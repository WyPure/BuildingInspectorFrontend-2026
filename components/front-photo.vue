<template>
	<view class="front-photo-root">
		<view>
			<view class="photo-container">
				<view class="photo-item">
					<view class="head">
						<view class="head-text">
							左正面照
						</view>
					</view>
					<my-photo-picker class="photo-select" v-model="frontLeft" @select="frontLeftSelect"
						@delete="deletePhoto('frontLeft')" :limit="1"></my-photo-picker>
				</view>

				<view class="photo-item">
					<view class="head">
						<view class="head-text">
							右正面照
						</view>
					</view>
					<my-photo-picker class="photo-select" v-model="frontRight" @select="frontRightSelect"
						@delete="deletePhoto('frontRight')" :limit="1"></my-photo-picker>
				</view>
			</view>

			<view class="photo-container">
				<view class="photo-item">
					<view class="head">
						<view class="head-text">
							左侧面照
						</view>
					</view>
					<my-photo-picker class="photo-select" v-model="sideLeft" @select="sideLeftSelect"
						@delete="deletePhoto('sideLeft')" :limit="1"></my-photo-picker>
				</view>

				<view class="photo-item">
					<view class="head">
						<view class="head-text">
							右侧面照
						</view>
					</view>
					<my-photo-picker class="photo-select" v-model="sideRight" @select="sideRightSelect"
						@delete="deletePhoto('sideRight')" :limit="1"></my-photo-picker>
				</view>
			</view>

		</view>

	</view>

</template>

<script setup>
	import {
		onMounted,
		reactive,
		ref,
		watch
	} from 'vue';
	import {
		getFrontPhoto,
		readBridgeImage,
		removeDiseaseImage
	} from "@/utils/readJsonNew";
	import {
		idStore
	} from "@/store/idStorage";
	import {
		userStore
	} from "@/store";
	import {
		saveBridgeImages,
		setFrontPhoto
	} from "@/utils/writeNew";
	import myFilePicker from '@/components/myFilePicker/myFilePicker.vue';
	import {
		setBuildingUnCommitted
	} from "@/utils/isBuildingCommited";
	import MyPhotoPicker from "@/components/myPhotoPicker.vue";
	import {
		ButtonStore
	} from '@/store/button.js';
	import {
		copyFrontPhoto
	} from "@/utils/frontPhoto";

	// 接收父组件传递的数据加载状态
	const props = defineProps({
		activeTabTop: {
			type: Number,
			default: 0
		}
	});

	// 是否从json中读取数据
	const isSubmit = ref(2);

	const frontLeft = ref([]);
	const frontRight = ref([]);
	const sideLeft = ref([]);
	const sideRight = ref([]);

	const frontLeftImgNoExp = ref([]);
	const frontRightImgNoExp = ref([]);
	const sideRightImgNoExp = ref([]);
	const sideLeftImgNoExp = ref([]);

	const idStorageInfo = idStore();
	const userInfo = userStore()
	const buttonInfo = ButtonStore()

	watch(() => props.activeTabTop, (newval, oldval) => {
		if (newval == 2) {
			console.log('当前activeTabTop为：', newval) // 使用newval而不是activeTabTop
			// 隐藏图片信息按钮，确保在front-photo页面不显示
			buttonInfo.reback();
			readBridgeImageByJson();
		}
	})

	// 图片上传样式
	const imageStyles = reactive({
		width: '200rpx',
		height: '200rpx'
	});

	const frontLeftSelect = async (photoNum) => {
		frontLeftImgNoExp.value.push(photoNum);
		await autoSavePhotos('frontLeft');
	};

	const frontRightSelect = async (photoNum) => {
		frontRightImgNoExp.value.push(photoNum);
		await autoSavePhotos('frontRight');
	};

	const sideLeftSelect = async (photoNum) => {
		sideLeftImgNoExp.value.push(photoNum)
		await autoSavePhotos('sideLeft');
	};

	const sideRightSelect = async (photoNum) => {
		sideRightImgNoExp.value.push(photoNum)
		await autoSavePhotos('sideRight');
	};

	// 自动保存图片的方法
	const autoSavePhotos = async (type) => {
		console.log('自动保存图片:', type)
		try {
			// 检查是否有图片需要保存
			const hasImages = frontLeft.value.length > 0 ||
				frontRight.value.length > 0 ||
				sideLeft.value.length > 0 ||
				sideRight.value.length > 0;

			if (!hasImages) {
				console.log('没有图片需要保存');
				return;
			}

			// 显示加载提示
			uni.showLoading({
				title: '保存中...',
				mask: true
			});

			const savePhotoData = await createPhotoDate(type);
			console.log('保存的图片json数据:', savePhotoData);

			await setFrontPhoto(userInfo.username, idStorageInfo.buildingId, savePhotoData);
			// await setFrontPhotoUnCommited(userInfo.username, idStorageInfo.buildingId);
			isSubmit.value = 0;
			await setBuildingUnCommitted(userInfo.username, idStorageInfo.projectId, idStorageInfo.buildingId);
			uni.$emit('setBuildingUnCommit', idStorageInfo.buildingId)
			uni.$emit('frontPhotoStatusChanged') // 通知状态变化

			// 隐藏加载提示
			uni.hideLoading();

			uni.showToast({
				title: '保存成功',
				icon: 'success',
				duration: 1500
			});

			// isSubmit.value = 1; // 设置为已提交状态
		} catch (error) {
			// 隐藏加载提示
			uni.hideLoading();

			console.error('保存图片失败:', error);
			uni.showToast({
				title: '保存失败，请重试',
				icon: 'none',
				duration: 1500
			});
		}
	};

	const createPhotoDate = async (type) => {
		try {
			const data = await getFrontPhoto(userInfo.username, idStorageInfo.buildingId);
			if (type === 'frontLeft') {
				data.frontLeft = await saveBridgeImages(userInfo.username, idStorageInfo.buildingId, frontLeft
					.value);
				data.frontLeftImgNoExp = frontLeftImgNoExp.value;
			} else if (type === 'frontRight') {
				data.frontRight = await saveBridgeImages(userInfo.username, idStorageInfo.buildingId, frontRight
					.value);
				data.frontRightImgNoExp = frontRightImgNoExp.value;
			} else if (type === 'sideLeft') {
				data.sideLeft = await saveBridgeImages(userInfo.username, idStorageInfo.buildingId, sideLeft
					.value);
				data.sideLeftImgNoExp = sideLeftImgNoExp.value;
			} else if (type === 'sideRight') {
				data.sideRight = await saveBridgeImages(userInfo.username, idStorageInfo.buildingId, sideRight
					.value);
				data.sideRightImgNoExp = sideRightImgNoExp.value;
			}
			data.commitType = 0;
			return data;
		} catch (error) {
			console.error('front-photo.json不存在，需要创建json', error);
			const data = {
				frontLeft: [],
				frontRight: [],
				sideLeft: [],
				sideRight: [],
				commitType: 0
			};
			if (type === 'frontLeft') {
				data.frontLeft = await saveBridgeImages(userInfo.username, idStorageInfo.buildingId, frontLeft
					.value);
				data.frontLeftImgNoExp = frontLeftImgNoExp.value;
			} else if (type === 'frontRight') {
				data.frontRight = await saveBridgeImages(userInfo.username, idStorageInfo.buildingId, frontRight
					.value);
				data.frontRightImgNoExp = frontRightImgNoExp.value;
			} else if (type === 'sideLeft') {
				data.sideLeft = await saveBridgeImages(userInfo.username, idStorageInfo.buildingId, sideLeft
					.value);
				data.sideLeftImgNoExp = sideLeftImgNoExp.value;
			} else if (type === 'sideRight') {
				data.sideRight = await saveBridgeImages(userInfo.username, idStorageInfo.buildingId, sideRight
					.value);
				data.sideRightImgNoExp = sideRightImgNoExp.value;
			}
			return data;
		}
	};

	const deletePhoto = async (type) => {
		const data = await getFrontPhoto(userInfo.username, idStorageInfo.buildingId);
		if (type === 'frontLeft') {
			const imagesPaths = await readBridgeImage(userInfo.username, idStorageInfo.buildingId, data.frontLeft);
			await removeDiseaseImage(imagesPaths);
			data.frontLeft = [];
			frontLeftImgNoExp.value = [];
			if (data.frontLeftImgNoExp !== undefined) {
				data.frontLeftImgNoExp = [];
			}
		} else if (type === 'frontRight') {
			const imagesPaths = await readBridgeImage(userInfo.username, idStorageInfo.buildingId, data
				.frontRight);
			await removeDiseaseImage(imagesPaths);
			data.frontRight = [];
			frontRightImgNoExp.value = [];
			if (data.frontRightImgNoExp !== undefined) {
				data.frontRightImgNoExp = [];
			}
		} else if (type === 'sideLeft') {
			const imagesPaths = await readBridgeImage(userInfo.username, idStorageInfo.buildingId, data.sideLeft);
			await removeDiseaseImage(imagesPaths);
			data.sideLeft = [];
			sideLeftImgNoExp.value = [];
			if (data.sideLeftImgNoExp !== undefined) {
				data.sideLeftImgNoExp = [];
			}
		} else if (type === 'sideRight') {
			const imagesPaths = await readBridgeImage(userInfo.username, idStorageInfo.buildingId, data.sideRight);
			await removeDiseaseImage(imagesPaths);
			data.sideRight = [];
			sideRightImgNoExp.value = [];
			if (data.sideRightImgNoExp !== undefined) {
				data.sideRightImgNoExp = [];
			}
		}
		data.commitType = 0;
		await setFrontPhoto(userInfo.username, idStorageInfo.buildingId, data);
		isSubmit.value = 0;
		await setBuildingUnCommitted(userInfo.username, idStorageInfo.projectId, idStorageInfo.buildingId);
		uni.$emit('setBuildingUnCommit', idStorageInfo.buildingId);
		uni.$emit('frontPhotoStatusChanged'); // 通知状态变化
	};

	const readBridgeImageByJson = async () => {
		try {
			const data = await getFrontPhoto(userInfo.username, idStorageInfo.buildingId);
			console.log('获取正立面照数据成功:', data);
			// 处理图片数据
			if (data.frontLeft && Array.isArray(data.frontLeft)) {
				frontLeft.value = await readBridgeImage(userInfo.username, idStorageInfo.buildingId, data
					.frontLeft)
			}
			if (data.frontRight && Array.isArray(data.frontRight)) {
				frontRight.value = await readBridgeImage(userInfo.username, idStorageInfo.buildingId, data
					.frontRight)
			}
			if (data.sideLeft && Array.isArray(data.sideLeft)) {
				sideLeft.value = await readBridgeImage(userInfo.username, idStorageInfo.buildingId, data.sideLeft)
			}
			if (data.sideRight && Array.isArray(data.sideRight)) {
				sideRight.value = await readBridgeImage(userInfo.username, idStorageInfo.buildingId, data
					.sideRight)
			}
			if (data.commitType !== 2) isSubmit.value = data.commitType;
		} catch (error) {
			await copyFrontPhoto(userInfo.username, idStorageInfo.buildingId);
			const data = await getFrontPhoto(userInfo.username, idStorageInfo.buildingId);
			console.log('获取正立面照数据成功:', data);
			// 处理图片数据
			if (data.frontLeft && Array.isArray(data.frontLeft)) {
				frontLeft.value = await readBridgeImage(userInfo.username, idStorageInfo.buildingId, data
					.frontLeft)
			}
			if (data.frontRight && Array.isArray(data.frontRight)) {
				frontRight.value = await readBridgeImage(userInfo.username, idStorageInfo.buildingId, data
					.frontRight)
			}
			if (data.sideLeft && Array.isArray(data.sideLeft)) {
				sideLeft.value = await readBridgeImage(userInfo.username, idStorageInfo.buildingId, data.sideLeft)
			}
			if (data.sideRight && Array.isArray(data.sideRight)) {
				sideRight.value = await readBridgeImage(userInfo.username, idStorageInfo.buildingId, data
					.sideRight)
			}
			if (data.commitType !== 2) isSubmit.value = data.commitType;
		}
	};

	// 组件挂载时
	onMounted(async () => {
		// 隐藏图片信息按钮，确保在front-photo页面不显示
		buttonInfo.reback();
		// 只有当数据加载完成时才读取图片数据
		await readBridgeImageByJson();
	});
</script>

<style scoped>
	/* 整页横向占满，避免最外一圈白边 */
	.front-photo-root {
		width: 100%;
		box-sizing: border-box;
		padding: 0;
		margin: 0;
	}

	.photo-container {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		align-items: stretch;
		justify-content: flex-start;
		gap: 0;
		width: 100%;
		box-sizing: border-box;
		padding: 0;
		margin: 0 0 20rpx 0;
	}

	.photo-item {
		flex: 1;
		width: 0;
		min-width: 0;
		box-sizing: border-box;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		align-items: stretch;
	}

	.file-picker {
		margin-top: 20rpx;
		margin-left: 0;
		width: 100%;
		display: flex;
	}

	.photo-item image {
		width: 100%;
		height: 200rpx;
		border-radius: 6rpx;
		box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.1);
	}

	.loading-container {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 200rpx;
	}

	.loading-text {
		color: #999;
		font-size: 28rpx;
	}

	.head {
		background-color: #BDCBE0;
		width: 100%;
		max-width: 100%;
		box-sizing: border-box;
		text-align: center;
	}

	.head-text {
		padding: 4rpx 10rpx;
		font-size: 20rpx;
		text-align: center;
		width: 100%;
		box-sizing: border-box;
	}

	.not-submitted {
		color: red;
	}

	.photo-select {
		margin-top: 20rpx;
		width: 100%;
		max-width: 100%;
		box-sizing: border-box;
		height: 200rpx;
		/* 改为自适应高度 */
	}

	/* 标题与上传区同宽，内部均居中，纵向同一轴线 */
	.photo-select ::v-deep .photo-picker,
	.photo-select ::v-deep .preview-list {
		width: 100%;
		justify-content: center;
	}

	/* 手机端适配 */
	@media (max-width: 599px) {
		.head-text {
			padding: 6rpx 10rpx;
			font-size: 24rpx;
		}
	}
</style>