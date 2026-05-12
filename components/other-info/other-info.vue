<template>
	<view>
		<!-- 照片区域，每行两张照片 -->
		<view class="image-container">
			<view v-for="(item, index) in imageItems" :key="item.id" class="image-item">
				<view class="image-title">
					{{ item.name }}
				</view>
				<view class="image-wrapper">
					<image :src="getImageUrl(item.value)" mode="aspectFill" class="image" @click="clickImg(item)"></image>
				</view>
			</view>
		</view>

		<!-- 文本信息区域 -->
		<view class="line" v-for="(item, index) in textItems" :key="item.id">
			<view class="line-title">
				{{ item.name }}
			</view>
			<view class="line-content">
				{{ item.value || '/' }}
			</view>
		</view>
	</view>
</template>

<script setup>
	import {
		ref,
		computed
	} from "vue";
  import {readBridgeImage, readBridgeUDImage} from "@/utils/readJsonNew";
  import {userStore} from "@/store";
  import {idStore} from "@/store/idStorage";

  const userInfo = userStore();
  const idStorageInfo = idStore();

	const props = defineProps({
		data: {
			type: Object,
			default: () => ({})
		}
	});

	// 获取实际数据数组
	const dataArray = computed(() => {
		// 检查是否是数组
		if (Array.isArray(props.data)) {
			return props.data;
		}
		// 检查是否有children属性
		if (props.data && props.data.children && Array.isArray(props.data.children)) {
			return props.data.children;
		}
		// 默认返回空数组
		return [];
	});

	// 分离图片项和文本项
	const imageItems = computed(() => {
		// 获取前四项作为图片项
		return dataArray.value.slice(0, 4);
	});

	const textItems = computed(() => {
		// 获取第五项及之后的所有项作为文本项
		return dataArray.value.slice(4);
	});

	// 获取图片URL，如果值为"/"或不存在，则使用默认图片
	const getImageUrl = (value) => {
		if (!value || value === '/') {
			return '/static/image/disease.png';
		}
		return readBridgeUDImage(userInfo.username, idStorageInfo.buildingId, value);
	};

	// 点击预览图片
	const clickImg = (item) => {
		const url = getImageUrl(item.value);
		uni.previewImage({
			urls: [url],
			current: 0
		});
	};
</script>

<style scoped>
	/* 照片区域样式 */
	.image-container {
		display: flex;
		flex-wrap: wrap;
		width: 100%;
		border-bottom: 1rpx solid #eee;
	}

	.image-item {
		width: 50%;
		box-sizing: border-box;
		padding: 20rpx;
	}

	.image-title {
		font-size: 18px;
		color: #666666;
	}

	.image-wrapper {
		margin-top: 12rpx;
	}

	.image {
		width: 120rpx;
		height: 120rpx;
	}

	/* 文本区域样式 */
	.line {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding: 14rpx 12rpx;
		border-bottom: 1rpx solid #eee;
	}

	.line-title {
		color: #666666;
		font-size: 20rpx;
	}

	.line-content {
		color: #333333;
		font-size: 20rpx;
	}

	.line-content-middle {
		margin-left: 10rpx;
		margin-right: 10rpx;
		color: #BDCBE0;
	}
</style>