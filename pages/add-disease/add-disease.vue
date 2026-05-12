<!--新增病害页面-->
<template>
	<view class="add-disease-page">
		<uni-nav-bar
			:fixed="true"
			:statusBar="true"
			:border="false"
			backgroundColor="#0F4687"
			color="#ffffff"
			leftIcon="left"
			:title="''"
			:rightWidth="100"
			@clickLeft="onNavBack"
		>
			<view class="bridge-nav-title-wrap">
				<text class="bridge-nav-title-text">{{ pageNavTitle }}</text>
			</view>
			<template v-slot:right>
				<view class="bridge-page-nav-info" @click.stop="openBridgeInfoPopup">
					<text class="bridge-page-nav-info-icon">ⓘ</text>
				</view>
			</template>
		</uni-nav-bar>

		<view class="add-disease-body">
		<!-- 新增病害时显示 -->
		<view class="button-group-add" v-if="openMode === 'create'">
			<button class="button-savetonext" @click="savetonextdisease">保存并复制到下一条</button>
			<button class="button-save" @click="savedisease">保存</button>
			<button class="button-staging" @click="stagingDisease">暂存</button>
			<button class="button-cancle" @click="canceldisease">取消</button>
		</view>

		<!-- 编辑病害时显示 -->
		<view class="button-group-edit" v-else-if="openMode === 'edit'">
			<button class="button-before" @click="beforedisease">上一条</button>
			<button class="button-next" @click="nextdisease">下一条</button>
			<button class="button-delete" @click="deleteDisease">删除</button>
			<button class="button-copyAndTonext" @click="copyAndAddDisease">保存并复制到下一条</button>
			<button class="button-save" @click="editDisease">保存</button>
			<button class="button-staging" @click="stagingDisease">暂存</button>
			<button class="button-cancle" @click="canceldisease">取消</button>
		</view>

		<!-- 历史病害时显示 -->
		<view class="button-group-edit" v-else-if="openMode === 'history'">
			<button class="button-before" @click="beforeHistoryDisease">上一条</button>
			<button class="button-next" @click="nextHistoryDisease">下一条</button>
			<button class="button-copyHistoryDisease" @click="copyHistoryDisease">复制为新病害</button>
			<button class="button-cancle" @click="canceldisease">取消</button>
		</view>


		<!-- 表单内容容器 - 添加form-container类以便横屏时调整布局 -->
		<view :class="openMode !== 'online' ? 'form-container' : ''">

			<disease-information :structureData="structureData" :selectedGrandObject="selectedGrandObject"
				ref="diseaseInformationRef"> </disease-information>

			<disease-quantitative-data ref="diseaseQuantitativeDataRef">
			</disease-quantitative-data>

			<disease-description-part ref="diseaseDescriptionPart"></disease-description-part>

			<view>
				<view class="head">
					<view class="head-text">
						病害附件信息
					</view>
				</view>

				<view class="part-UploadImage">
					<view v-if="openMode === 'history' || openMode === 'online'">
						<view class="part-title">图片</view>
						<image v-for="(url, index) in fileList" :key="index" :src="url" mode="aspectFill"
							@click="previewImage(url)" class="disease-image" />
					</view>
					<view v-else>
						<view class="part-title">上传图片</view>
						<view class="upload-view">
							<!-- <uni-file-picker class="file-picker" limit="9" :image-styles="imageStyles" v-model="fileList"
                file-mediatype="image" mode="grid" @select="handleFileSelect" @delete="handleFileDelete"
                :auto-upload="false"></uni-file-picker> -->
							<my-photo-picker class="photo-select" v-model="fileList" @select="handleFileSelect"
								@delete="handleFileDelete" :limit="9"></my-photo-picker>
						</view>
					</view>
				</view>

				<view class="part-ADImages">
					<view v-if="openMode === 'history' || openMode === 'online'">
						<view class="part-title">简图</view>
						<image v-for="(url, index) in ADImgs" :key="index" :src="url" mode="aspectFill"
							@click="previewImage(url)" class="disease-image" />
					</view>
					<view v-else>
						<view class="part-title">绘制简图</view>
						<view class="ADImages">
							<view class="img-wrapper" v-for="(img, index) in ADImgs" :key="img.src">
								<image :src="img.src" class="ADImage" @click="previewImage(img.src)" />
								<view class="close-btn" @click="removeImage(index)">×</view>
							</view>
							<view
								class="ADImage-container ADImage-container--add"
								:style="adAddSlotStyle"
								@click="selectCanvasTemplate()"
							>
								<view class="ad-upload-plus"></view>
							</view>
						</view>
					</view>

				</view>
			</view>
		</view>


		<!-- 底部弹出层 -->
		<uni-popup ref="popup" type="bottom">
			<view class="popup-content">
				<view class="template-row">
					<view class="template-type">
						空心板、实心板
					</view>
					<view class="template-image">
						<image src="/static/image/template_kxb1.png" class="template-image-card"
							@click="onClickTemplate('kxb1')"></image>
						<image src="/static/image/template_kxb2.png" class="template-image-card"
							@click="onClickTemplate('kxb2')"></image>
						<image src="/static/image/template_kxb3.png" class="template-image-card"
							@click="onClickTemplate('kxb3')"></image>
						<image src="/static/image/template_kxb4.png" class="template-image-card"
							@click="onClickTemplate('kxb4')"></image>
						<image src="/static/image/template_kxb5.png" class="template-image-card"
							@click="onClickTemplate('kxb5')"></image>
						<image src="/static/image/template_kxb6.png" class="template-image-card"
							@click="onClickTemplate('kxb6')"></image>
					</view>
					<view class="template-type">
						T梁
					</view>
					<view class="template-image">
						<image src="/static/image/template_tl1.png" class="template-image-card"
							@click="onClickTemplate('tl1')"></image>
					</view>

					<view class="template-type">
						箱梁
					</view>
					<view class="template-image">
						<image src="/static/image/template_xl1.png" class="template-image-card"
							@click="onClickTemplate('xl1')"></image>
					</view>

					<view class="template-type">
						变截面箱梁
					</view>
					<view class="template-image">
						<image src="/static/image/template_blmxl1.png" class="template-image-card"
							@click="onClickTemplate('blmxl1')"></image>
						<image src="/static/image/template_blmxl2.png" class="template-image-card"
							@click="onClickTemplate('blmxl2')"></image>
						<image src="/static/image/template_blmxl3.png" class="template-image-card"
							@click="onClickTemplate('blmxl3')"></image>
						<image src="/static/image/template_blmxl4.png" class="template-image-card"
							@click="onClickTemplate('blmxl4')"></image>
					</view>

					<view class="template-type">
						桥台、桥墩
					</view>
					<view class="template-image">
						<image src="/static/image/template_qt1.png" class="template-image-card"
							@click="onClickTemplate('qt1')"></image>
						<image src="/static/image/template_qt2.png" class="template-image-card"
							@click="onClickTemplate('qt2')"></image>
					</view>

					<view class="template-type">
						横隔板
					</view>
					<view class="template-image">
						<image src="/static/image/template_hgb1.png" class="template-image-card"
							@click="onClickTemplate('hgb1')"></image>
						<image src="/static/image/template_hgb2.png" class="template-image-card"
							@click="onClickTemplate('hgb2')"></image>
					</view>

					<view class="template-type">
						翼墙、耳墙
					</view>
					<view class="template-image">
						<image src="/static/image/template_yq1.png" class="template-image-card"
							@click="onClickTemplate('yq1')"></image>
					</view>
					<view class="template-type">
						盖梁
					</view>
					<view class="template-image">
						<image src="/static/image/template_gl1.png" class="template-image-card"
							@click="onClickTemplate('gl1')"></image>
					</view>
					<view class="template-type">
						圆桩墩
					</view>
					<view class="template-image">
						<image src="/static/image/template_yzd1.png" class="template-image-card"
							@click="onClickTemplate('yzd1')"></image>
					</view>
				</view>
			</view>
		</uni-popup>

		</view>

		<BridgeInfoDialog
			ref="bridgeInfoDialogRef"
			:bridge-name="bridgeName"
			:bridge-code="bridgeCode"
			:bridge-pile-number="bridgePileNumber"
			:route-name="routeName"
			:route-code="routeCode"
		/>

	</view>
</template>

<script setup>
	import {
		ref,
		reactive,
		onMounted,
		onUnmounted,
		watch,
		computed,
		unref,
	} from 'vue';
	import {
		readDiseaseImages,
		readDiseaseUDImages,
		removeDiseaseImage,
	} from '../../utils/readJsonNew.js';
	import { getObjectUL, findUdDirForUser } from '@/utils/readUL';
	import { enrichObjectPayloadCatalogTemplateId } from '@/utils/businessDocumentStore';
	import {
		saveDiseaseImages
	} from '../../utils/writeNew.js';
	import {
		userStore
	} from "@/store";
	import {
		idStore
	} from "@/store/idStorage";
	import DiseaseInformation from "@/components/disease-information.vue";
	import DiseaseQuantitativeData from "@/components/disease-quantitativeData.vue";
	import DiseaseDescriptionPart from '@/components/disease-descriptionPart.vue';
	import MyPhotoPicker from '@/components/myPhotoPicker.vue';
	import {
		ButtonStore
	} from '@/store/button.js';
	import {
		useObject
	} from "@/store/object";
	import {
		onBackPress,
		onShow
	} from '@dcloudio/uni-app'
	import {
		getObjectTemplate
	} from "@/utils/diseaseHelp";
  import {lastComponentNameStore} from "@/store/lastComponentNameStore";
	import {
		appendBridgeQueryToUrl
	} from '@/utils/bridgeNavQuery.js';
	import BridgeInfoDialog from '@/components/bridge/BridgeInfoDialog.vue';
	import {
		useBridgeRouteInfo
	} from '@/composables/useBridgeRouteInfo.js';

	// 是否加载完成
	let isInitializing = false;
	const diseaseInformationRef = ref(null);
	const diseaseQuantitativeDataRef = ref(null);
	const diseaseDescriptionPart = ref(null);
	const buttonInfo = ButtonStore();

	const objectInfo = useObject();

	const userInfo = userStore()

	const idStorageInfo = idStore();

	const openMode = ref('create');

	const {
		bridgeName,
		bridgeCode,
		bridgePileNumber,
		routeName,
		routeCode,
		readBridgeInfo
	} = useBridgeRouteInfo();

	const bridgeInfoDialogRef = ref(null);

	const openBridgeInfoPopup = () => {
		bridgeInfoDialogRef.value?.open();
	};

	const pageNavTitle = computed(() => {
		const m = openMode.value;
		if (m === 'edit') return '编辑病害';
		if (m === 'history') return '历史病害';
		if (m === 'online') return '查看病害';
		return '新增病害';
	});

	const popup = ref(null);
	const ADImgs = ref([]);

	/** 绘制简图「添加」格：内联灰底，避免 scoped 在各端不生效 */
	const adAddSlotStyle =
		'background-color:#f5f5f5 !important;border-radius:16rpx;border:1rpx solid #e0e0e0;box-sizing:border-box;';

	const isChanged = ref(false);

	// 选择进入的构件（上部结构、下部结构、桥面系）
	const selectedGrandObject = ref('');

	// 保存结构数据
	const structureData = ref(null);

	// 添加一个数组来存储多个缺损的数据
	const diseaseDataList = ref([]);

	// 缺损数量
	const quantity = ref(1);

	// 图片编号列表
	const imgNoExp = ref([]);

	// 图片文件列表
	const fileList = ref([]);
	const previewImage = (url) => {
		console.log('预览图片:', url)
		uni.previewImage({
			urls: [url],
		});
	}

	// 页面加载时初始化三级选择器
	onMounted(async () => {
		readBridgeInfo();
		// 隐藏图片信息按钮，确保在新增病害页面不显示
		buttonInfo.reback();
		// 获取结构数据（先执行，并等待完成）
		isChanged.value = false;
		const pages = getCurrentPages();
		const currentPage = pages[pages.length - 1];
		const options = currentPage.$page?.options;
		selectedGrandObject.value = options.selectedGrandObject;
		console.log('设置grandObject', selectedGrandObject.value)

		// 初始化构件名称多级选择器
		// 如果有mode参数且值为edit，则设为编辑模式
		if (options && options.mode === 'edit') {
			openMode.value = 'edit';
		} else if (options && options.mode === 'history') {
			openMode.value = 'history';
		} else if(options && options.mode === 'online'){
      openMode.value = 'online';
    }
    else {
			openMode.value = 'create';
		}
		const structureOk = await fetchStructureData();
		if (!structureOk) {
			uni.showToast({
				title: '无法加载桥型构件模板，请先在桥梁检测页进入桥跨信息或检查下发包',
				icon: 'none',
				duration: 3200
			});
			setTimeout(() => uni.navigateBack(), 500);
			return;
		}
		// 如果传递了数据，则解析并填充表单
		if (options.data) {
			try {
				const diseaseData = JSON.parse(decodeURIComponent(options.data));
				console.log('接收到的历史病害数据:', diseaseData);

				// 填充表单数据
				await fillFormWithData(diseaseData);
			} catch (error) {
				console.error('解析编辑数据失败:', error);
				uni.showToast({
					title: '加载编辑数据失败',
					icon: 'none'
				});
			}
		}
		isInitializing = true;
		uni.$on('changeDiseaseData', () => {
			console.log('数据已改变')
			isChanged.value = true;
		})
	});

	onShow(() => {
		readBridgeInfo();
	});

	// 根据接收的数据填充表单
	const fillFormWithData = async (data) => {
		console.log('开始填充表单数据:', data);

		//设置构建名称
		if (data.component?.biObject?.name) {
			// uni.$emit('setComponentName', data.component.biObject.name)
			uni.$emit('setComponentName', {
				biObjectName: data.component.biObject.name,
				parentObjectName: data.component.parentObjectName,
				grandObjectName: data.component.grandObjectName,
				biObjectInput: data.biObjectName,
			})
		}

		// 设置构件编号
		if (data.component?.code) {
			uni.$emit('setComponentCode', data.component.code)
			console.log('成功设置构件编号:', data.component.code);
		}

		if (data.component?.componentMaterial) {
			uni.$emit('setComponentMaterial', data.component.componentMaterial)
		}

		// 设置病害类型
		if (data.type) {
			// 更新病害类型和位置选项
			uni.$emit('setDiseaseType', {
				diseaseTypeInput: data.type,
				diseaseType: data.diseaseType.name,
				diseaseTypeCode: data.diseaseType.code,
				diseaseTypeId: data.diseaseType.id,
				diseaseTypeGroupName: data.diseaseType.groupName,
			})
			console.log('成功设置病害类型:', data.type);
		}

		if (data.diseaseType.threshold) {
			uni.$emit('setThreshold', data.diseaseType.threshold)
		}

		// 设置病害位置
		if (data.position) {
			uni.$emit('setDiseasePosition', data.position)
			console.log('成功设置病害位置:', data.position);
		}
		if (data.segmentFlag !== undefined && data.segmentFlag !== null) {
			uni.$emit('setPositionSegmentFlag', data.segmentFlag === true || data.segmentFlag === 'yes' ||
				data.segmentFlag === 1 || data.segmentFlag === '1');
		} else if (String(data.positionNumber ?? '').trim() !== '') {
			uni.$emit('setPositionSegmentFlag', true);
		}
		if (data.positionNumber) {
			uni.$emit('setPositionNumber', data.positionNumber)
		}
		if (data.mileageStation1 || data.mileageStation2) {
			uni.$emit('setMileageStation', {
				mileageStation1: data.mileageStation1,
				mileageStation2: data.mileageStation2,
			})
		}

		// 设置缺损数量
		if (data.quantity) {
			quantity.value = parseInt(data.quantity) || 1;
			uni.$emit('setQuantity', data.quantity)
		}
		if (data.units) {
			uni.$emit('setUnits', data.units)
		}

		// 设置参与评定值（uni-data-checkbox格式）
		if (data.participateAssess !== undefined) {
			uni.$emit('setParticipateAssess', data.participateAssess)
		}

		if (data.nature) {
			uni.$emit('setNature', data.nature)
		}

		// 设置评定标度（新版为四维对象，旧版为单个数字）
		if (data.level !== undefined && data.level !== null && data.level !== '') {
			uni.$emit('setLevel', data.level)
		}

		// 设置病害描述
		if (data.description) {
			uni.$emit('setDescriptionByEmit', data.description)
		}

		if (data.crackType) {
			uni.$emit('setCrackType', data.crackType)
		}

		if (data.developmentTrend) {
			uni.$emit('setDevelopmentTrend', data.developmentTrend)
		}

		// 处理diseaseDetails数据
		if (data.diseaseDetails && Array.isArray(data.diseaseDetails)) {

			// 判断是否为范围模式 - 直接使用quantity字段判断
			const quantity = parseInt(data.quantity) || 0;
			const isRangeMode = quantity >= data.diseaseType.threshold;
			console.log('根据quantity判断范围模式:', quantity, isRangeMode);

			// 根据模式创建对应的数据结构
			if (isRangeMode) {
				if (data.diseaseDetails.length === 0) {
					data.diseaseDetails.push({
						useRangeMode: true,
						// 最小值
						lengthRangeStart: '',
						lengthRangeEnd: '',
						heightDepthRangeStart: '',
						heightDepthRangeEnd: '',
						crackWidthRangeStart: '',
						crackWidthRangeEnd: '',
						areaLength: '',
						areaWidth: '',
						areaIdentifier: '',
						deformationRangeStart: '',
						deformationRangeEnd: '',
						angleRangeStart: '',
						angleRangeEnd: '',
						numeratorRatio: '',
						denominatorRatio: '',

						// 参考面信息
						reference1Location: '',
						reference1LocationStart: '',
						reference1LocationEnd: '',
						reference2Location: '',
						reference2LocationStart: '',
						reference2LocationEnd: '',
					})
				}
				// 范围模式 - 缺损数量大于等于10时
				const detail = data.diseaseDetails[0];

				// 创建一个包含所有范围值的对象
				const rangeData = {
					useRangeMode: true,
					// 最小值
					lengthRangeStart: detail.lengthRangeStart || '',
					lengthRangeEnd: detail.lengthRangeEnd || '',
					heightDepthRangeStart: detail.heightDepthRangeStart || '',
					heightDepthRangeEnd: detail.heightDepthRangeEnd || '',
					crackWidthRangeStart: detail.crackWidthRangeStart || '',
					crackWidthRangeEnd: detail.crackWidthRangeEnd || '',
					areaLength: detail.areaLength || '',
					areaWidth: detail.areaWidth || '',
					areaIdentifier: detail.areaIdentifier || '',
					deformationRangeStart: detail.deformationRangeStart || '',
					deformationRangeEnd: detail.deformationRangeEnd || '',
					angleRangeStart: detail.angleRangeStart || '',
					angleRangeEnd: detail.angleRangeEnd || '',
					numeratorRatio: detail.numeratorRatio || '',
					denominatorRatio: detail.denominatorRatio || '',

					// 参考面信息
					reference1Location: detail.reference1Location || '',
					reference1LocationStart: detail.reference1LocationStart || '',
					reference1LocationEnd: detail.reference1LocationEnd || '',
					reference2Location: detail.reference2Location || '',
					reference2LocationStart: detail.reference2LocationStart || '',
					reference2LocationEnd: detail.reference2LocationEnd || '',
				};

				// 更新数据列表
				diseaseDataList.value = [rangeData];
			} else {
				if (data.diseaseDetails.length < data.quantity) {
					while (data.diseaseDetails.length < data.quantity) {
						data.diseaseDetails.push({
							useRangeMode: false,
							length1: '',
							length2: '',
							length3: '',
							heightDepth: '',
							crackWidth: '',
							areaLength: '',
							areaWidth: '',
							areaIdentifier: '',
							deformation: '',
							angle: '',
							numeratorRatio: '',
							denominatorRatio: '',

							// 参考面信息
							reference1Location: '',
							reference1LocationStart: '',
							reference1LocationEnd: '',
							reference2Location: '',
							reference2LocationStart: '',
							reference2LocationEnd: '',
						})
					}
				}
				// 普通模式 - 为每个缺损创建一条记录
				const newList = data.diseaseDetails.map(detail => {
					return {
						useRangeMode: false,
						length1: detail.length1 || '',
						length2: detail.length2 || '',
						length3: detail.length3 || '',
						heightDepth: detail.heightDepth || '',
						crackWidth: detail.crackWidth || '',
						areaLength: detail.areaLength || '',
						areaWidth: detail.areaWidth || '',
						areaIdentifier: detail.areaIdentifier || '',
						deformation: detail.deformation || '',
						angle: detail.angle || '',
						numeratorRatio: detail.numeratorRatio || '',
						denominatorRatio: detail.denominatorRatio || '',


						// 参考面信息
						reference1Location: detail.reference1Location || '',
						reference1LocationStart: detail.reference1LocationStart || '',
						reference1LocationEnd: detail.reference1LocationEnd || '',
						reference2Location: detail.reference2Location || '',
						reference2LocationStart: detail.reference2LocationStart || '',
						reference2LocationEnd: detail.reference2LocationEnd || '',
					};
				});

				// 更新数据列表
				diseaseDataList.value = newList;
			}
			uni.$emit('setDiseaseDataList', diseaseDataList.value)
			console.log('成功设置diseaseDetails数据', diseaseDataList.value);
		}

		// 处理图片数据
		if (data.images && Array.isArray(data.images)) {
			console.log('开始处理图片数据......:', data.images);
			let imagesPaths = [];
			if (openMode.value == 'history') {
				imagesPaths = await readDiseaseUDImages(userInfo.username, idStorageInfo.buildingId, data.images);
			} else if(openMode.value == 'online'){
        imagesPaths = data.images;
      }
      else {
				imagesPaths = await readDiseaseImages(userInfo.username, idStorageInfo.buildingId, data.images);
			}
			// const imagesPaths = readDiseaseImages(userInfo.username, idStorageInfo.buildingId, data.images);
			console.log('处理后的图片路径:', imagesPaths);
			fileList.value = imagesPaths;
		}

		// AD图片
		if (data.ADImgs && Array.isArray(data.ADImgs)) {
			let ADImgsPaths = [];
			if (openMode.value == 'history') {
				ADImgsPaths = await readDiseaseUDImages(userInfo.username, idStorageInfo.buildingId, data.ADImgs);
			} else if(openMode.value == 'online'){
        ADImgsPaths = data.ADImgs;
      }
      else {
				ADImgsPaths = await readDiseaseImages(userInfo.username, idStorageInfo.buildingId, data.ADImgs);
			}
			// const ADImgsPaths = readDiseaseImages(userInfo.username, idStorageInfo.buildingId, data.ADImgs);
			ADImgs.value = ADImgsPaths.map((src, index) => ({
				src: src
			}));
		}

		console.log('表单数据填充完成');
	};

	// 根据文本查找索引的工具函数
	const findIndexByText = (optionsArray, targetText) => {
		if (!optionsArray || !Array.isArray(optionsArray) || !targetText) return 0;

		const index = optionsArray.findIndex(item =>
			(item.text && item.text === targetText) || item === targetText
		);

		return index !== -1 ? index : 0;
	};

	// 图片上传样式
	const imageStyles = reactive({
		width: '150rpx',
		height: '150rpx'
	});

	const beforedisease = () => {
		console.log('上一条');
		// 获取当前病害ID和类型
		const pages = getCurrentPages();
		const currentPage = pages[pages.length - 1];
		const options = currentPage.$page?.options;
		const currentId = options?.id;
		const grandObjectName = diseaseInformationRef.value.component.grandObjectName

		if (!currentId || !grandObjectName) {
			uni.showToast({
				title: '无法获取当前病害信息',
				icon: 'none'
			});
			return;
		}

		// 使用uni.$emit发送获取同类型病害列表的请求
		uni.$emit('getDiseasesOfType', {
			grandObjectName: grandObjectName,
			currentId: currentId,
			callback: (diseaseList) => {
				if (!diseaseList || diseaseList.length === 0) {
					uni.showToast({
						title: '没有可用的病害记录',
						icon: 'none'
					});
					return;
				}

				// 过滤掉已删除的病害
				const validDiseases = diseaseList.filter(item => item.commitType != 2);

				// 找到当前病害的索引
				const currentIndex = validDiseases.findIndex(item => String(item.id) === String(
					currentId));
				if (currentIndex === -1) {
					uni.showToast({
						title: '无法找到当前病害',
						icon: 'none'
					});
					return;
				}

				// 计算上一个病害的索引（循环到最后一个）
				const prevIndex = currentIndex === 0 ? validDiseases.length - 1 : currentIndex - 1;
				const prevDisease = validDiseases[prevIndex];

				// 跳转到上一个病害的编辑页面
				navigateToEditDisease(prevDisease);
			}
		});
	}

	const nextdisease = () => {
		console.log('下一条');
		// 获取当前病害ID和类型
		const pages = getCurrentPages();
		const currentPage = pages[pages.length - 1];
		const options = currentPage.$page?.options;
		const currentId = options?.id;
		const grandObjectName = diseaseInformationRef.value.component.grandObjectName

		if (!currentId || !grandObjectName) {
			uni.showToast({
				title: '无法获取当前病害信息',
				icon: 'none'
			});
			return;
		}

		// 使用uni.$emit发送获取同类型病害列表的请求
		uni.$emit('getDiseasesOfType', {
			grandObjectName: grandObjectName,
			currentId: currentId,
			callback: (diseaseList) => {
				if (!diseaseList || diseaseList.length === 0) {
					uni.showToast({
						title: '没有可用的病害记录',
						icon: 'none'
					});
					return;
				}

				// 过滤掉已删除的病害
				const validDiseases = diseaseList.filter(item => item.commitType != 2);

				// 找到当前病害的索引
				const currentIndex = validDiseases.findIndex(item => String(item.id) === String(
					currentId));
				if (currentIndex === -1) {
					uni.showToast({
						title: '无法找到当前病害',
						icon: 'none'
					});
					return;
				}

				// 计算下一个病害的索引（循环到第一个）
				const nextIndex = currentIndex === validDiseases.length - 1 ? 0 : currentIndex + 1;
				const nextDisease = validDiseases[nextIndex];

				// 跳转到下一个病害的编辑页面
				navigateToEditDisease(nextDisease);
			}
		});
	}

	// 导航到编辑病害页面的辅助函数
	const navigateToEditDisease = (disease) => {
		if (!disease || !disease.id) {
			uni.showToast({
				title: '无效的病害数据',
				icon: 'none'
			});
			return;
		}

		// 将病害数据编码为URL参数
		const diseaseData = encodeURIComponent(JSON.stringify(disease));

		// 重定向到编辑页面并传递必要参数（保留桥梁 query，便于 ⓘ 弹窗）
		uni.redirectTo({
			url: appendBridgeQueryToUrl(`/pages/add-disease/add-disease?mode=edit&id=${disease.id}&data=${diseaseData}`),
			success: () => {
				console.log('成功导航到病害:', disease.id);
			},
			fail: (error) => {
				console.error('导航失败:', error);
				uni.showToast({
					title: '切换失败，请重试',
					icon: 'none'
				});
			}
		});
	}

	const savetonextdisease = () => {
		console.log('保存并复制到下一条');
		// 调用创建标准数据结构的函数，然后进行保存
		const diseaseData = createDiseaseData();
		// 验证数据完整性
		if (!diseaseData.type || !diseaseData.component || !diseaseData.position || !diseaseData.description) {
			console.log('数据不完整，请确保选择了构件名称、构件编号、病害类型和病害位置');
			uni.hideLoading();
			uni.showToast({
				title: '请填写必填项',
				icon: 'none'
			});
			return;
		}
		const saveDiseaseData = JSON.parse(JSON.stringify(diseaseData));
		if (saveDiseaseData) {
			saveWithoutNavigateBack(saveDiseaseData);
		}
		diseaseData.id = new Date().getTime();
		diseaseData.localId = new Date().getTime();
	}

	// 创建病害数据对象的方法
	const createDiseaseData = () => {

		// 处理diseaseDataList，构建病害详细数据
		let diseaseDetails = [];
		const numValue = diseaseQuantitativeDataRef.value.quantity;
		const isRangeMode = numValue >= 10;
		console.log('保存时使用的模式:', isRangeMode ? '范围模式' : '普通模式', '缺损数量:', numValue);

		if (isRangeMode) {
			// 当缺损数量大于等于10时，使用范围模式，只存储一条记录
			const rangeData = diseaseQuantitativeDataRef.value.diseaseDataList[0];

			// 创建一个包含范围值的记录
			diseaseDetails.push({
				// 普通模式字段设为空
				length1: '',
				length2: '',
				length3: '',
				// width: '',
				heightDepth: '',
				crackWidth: '',
				// area: '',
				deformation: '',
				angle: '',
				// percentage: '',

				// 范围模式字段
				lengthRangeStart: rangeData.lengthRangeStart || '',
				lengthRangeEnd: rangeData.lengthRangeEnd || '',
				/*				widthRangeStart: rangeData.widthRangeStart || '',
								widthRangeEnd: rangeData.widthRangeEnd || '',*/
				heightDepthRangeStart: rangeData.heightDepthRangeStart || '',
				heightDepthRangeEnd: rangeData.heightDepthRangeEnd || '',
				crackWidthRangeStart: rangeData.crackWidthRangeStart || '',
				crackWidthRangeEnd: rangeData.crackWidthRangeEnd || '',
				areaLength: rangeData.areaLength || '',
				areaWidth: rangeData.areaWidth || '',
				areaIdentifier: rangeData.areaIdentifier || '',
				deformationRangeStart: rangeData.deformationRangeStart || '',
				deformationRangeEnd: rangeData.deformationRangeEnd || '',
				angleRangeStart: rangeData.angleRangeStart || '',
				angleRangeEnd: rangeData.angleRangeEnd || '',
				numeratorRatio: rangeData.numeratorRatio || '',
				denominatorRatio: rangeData.denominatorRatio || '',

				// 公共字段
				/*crackType: crackType.value[rangeData.crackTypeIndex]?.text ||
					'纵向',*/
				// developmentTrend: developmentTrend.value[rangeData.developmentTrendIndex]?.text || '稳定',
				reference1Location: rangeData.reference1Location || '',
				reference1LocationStart: rangeData.reference1LocationStart || '',
				reference1LocationEnd: rangeData.reference1LocationEnd || '',
				reference2Location: rangeData.reference2Location || '',
				reference2LocationStart: rangeData.reference2LocationStart || '',
				reference2LocationEnd: rangeData.reference2LocationEnd || ''
			});

			console.log('保存时生成的范围模式数据结构:', JSON.stringify(diseaseDetails[0]));
		} else {
			// 当缺损数量小于10时，使用普通模式，为每个缺损创建一条记录
			diseaseQuantitativeDataRef.value.diseaseDataList.forEach(item => {
				diseaseDetails.push({
					// 普通模式字段
					length1: item.length1 || '',
					length2: item.length2 || '',
					length3: item.length3 || '',
					// width: item.width || '',
					heightDepth: item.heightDepth || '',
					crackWidth: item.crackWidth || '',
					// area: item.area || '',
					deformation: item.deformation || '',
					angle: item.angle || '',
					areaLength: item.areaLength,
					areaWidth: item.areaWidth,
					areaIdentifier: item.areaIdentifier,
					numeratorRatio: item.numeratorRatio,
					denominatorRatio: item.denominatorRatio,
					// percentage: item.percentage || '',

					// 范围模式字段设为空
					lengthRangeStart: '',
					lengthRangeEnd: '',
					// widthRangeStart: '',
					// widthRangeEnd: '',
					heightDepthRangeStart: '',
					heightDepthRangeEnd: '',
					crackWidthRangeStart: '',
					crackWidthRangeEnd: '',
					deformationRangeStart: '',
					deformationRangeEnd: '',
					angleRangeStart: '',
					angleRangeEnd: '',

					// 公共字段
					/*crackType: crackType.value[item.crackTypeIndex]
						?.text || '纵向',*/
					// developmentTrend: developmentTrend.value[item.developmentTrendIndex]?.text || '稳定',
					reference1Location: item.reference1Location || '',
					reference1LocationStart: item.reference1LocationStart || '',
					reference1LocationEnd: item.reference1LocationEnd || '',
					reference2Location: item.reference2Location || '',
					reference2LocationStart: item.reference2LocationStart || '',
					reference2LocationEnd: item.reference2LocationEnd || ''
				});
			});
		}

		const diseaseTypeObj = diseaseInformationRef.value.diseaseTypeObj;
		const bridgeSpanSelectedStorageKey = `bridgeSpanSelected:${idStorageInfo.buildingId}`;
		const selectedBridgeSpan = parseInt(uni.getStorageSync(bridgeSpanSelectedStorageKey), 10);
		const bridgeSpanNo = Number.isFinite(selectedBridgeSpan) && selectedBridgeSpan > 0 ? selectedBridgeSpan : null;

		// 创建符合要求的病害数据对象
		return {
			createBy: "",
			createTime: openMode.value === 'create' ? formatDateTime() : JSON.parse(decodeURIComponent(
				getCurrentPages()[getCurrentPages().length - 1].$page?.options.data))?.createTime,
			updateTime: formatDateTime(),
			id: openMode.value === 'create' ? new Date().getTime() : JSON.parse(decodeURIComponent(getCurrentPages()[
				getCurrentPages().length - 1].$page?.options.data))?.id,
			diseaseType: diseaseTypeObj ? {
				id: diseaseTypeObj.id,
				code: diseaseTypeObj.code || '',
				name: diseaseTypeObj.name,
				maxScale: diseaseTypeObj.maxScale || 5,
				minScale: diseaseTypeObj.minScale || 1,
				groupName: diseaseTypeObj.groupName || '',
        threshold: diseaseTypeObj.threshold || 10,
				status: "0"
			} : null,
			diseaseTypeId: diseaseTypeObj ? diseaseTypeObj.id : null,
			description: diseaseDescriptionPart.value.description,
			position: diseaseInformationRef.value.position,
			positionNumber: diseaseInformationRef.value.positionNumber,
			segmentFlag: (diseaseInformationRef.value?.positionSegmentFlag ?? '') === 'yes',
			mileageStation1: diseaseInformationRef.value.mileageStation1,
			mileageStation2: diseaseInformationRef.value.mileageStation2,
			mileageStation3: '',
			mileageStation4: '',
			level: diseaseDescriptionPart.value.level,
			quantity: diseaseQuantitativeDataRef.value.quantity,
			units: diseaseQuantitativeDataRef.value.units,
			// 直接存储详细数据
			diseaseDetails: diseaseDetails,
			type: diseaseInformationRef.value.type, // 直接使用type.value而不是通过索引获取
			nature: diseaseDescriptionPart.value.nature,
			participateAssess: diseaseDescriptionPart.value.participateAssess,
			biObjectId: diseaseInformationRef.value.component.biObject.id,
			projectId: idStorageInfo.projectId,
			crackType: diseaseQuantitativeDataRef.value.crackType,
			developmentTrend: diseaseDescriptionPart.value.developmentTrend,
			biObjectName: diseaseInformationRef.value.getBiObjctName, //使用三级选择或输入框中的值
			component: diseaseInformationRef.value.component,
			componentId: null, // 组件ID也设为null
			buildingId: idStorageInfo.buildingId,
			bridgeSpanNo,
			taskId: idStorageInfo.taskId,
			images: [], // 初始化为空数组，等待图片保存后更新
			ADImgs: [], // 添加AD图片字段
			imgNoExp: imgNoExp.value,
			commitType: 1, //0为已提交 1为未提交 2为删除 3为未保存
			localId: openMode.value === 'create' ? new Date().getTime() : JSON.parse(decodeURIComponent(
				getCurrentPages()[getCurrentPages().length - 1].$page?.options.data))?.localId,
			historyDiseaseId: openMode.value === 'create' ? null : JSON.parse(decodeURIComponent(
				getCurrentPages()[getCurrentPages().length - 1].$page?.options.data))?.historyDiseaseId,
		};
	}

	// 保存但不返回上一页的方法
	const saveWithoutNavigateBack = (diseaseData) => {
		console.log('保存但不返回');

		// 显示加载提示
		uni.showLoading({
			title: '保存中...'
		});

		// 使用公共方法保存图片和更新病害数据
		saveImagesAndUpdateDisease(diseaseData)
			.then(() => {
				uni.hideLoading();
				uni.showToast({
					title: '保存成功',
					icon: 'success'
				});

				// 只清空图片列表，保留其他表单数据
				setTimeout(() => {
					// 清空图片列表
					fileList.value = [];
					ADImgs.value = [];
					console.log('已清空图片列表，保留其他表单数据');

					// 显示提示
					uni.showToast({
						title: '已保存，可继续添加下一条',
						icon: 'none',
						duration: 1000
					});
				}, 500);
			})
			.catch(error => {
				console.error('保存失败:', error);
				uni.hideLoading();
				uni.showToast({
					title: '保存失败，请重试',
					icon: 'none'
				});
			});
	}

	// 保存图片的公共方法
	const saveImagesAndUpdateDisease = async (diseaseData) => {
		// 获取当前页面选项
		const pages = getCurrentPages();
		const currentPage = pages[pages.length - 1];
		const options = currentPage.$page?.options;

    // 保存构建名称到lastComponentNameStore中，供下次使用
    if(diseaseData.component.grandObjectName && diseaseData.component.parentObjectName && diseaseData.component.biObject.name){
      lastComponentNameStore().setGrandObjectName(diseaseData.component.grandObjectName);
      lastComponentNameStore().setParentObjectName(diseaseData.component.parentObjectName);
      lastComponentNameStore().setObjectName(diseaseData.component.biObject.name);
    }

		// 如果是编辑模式，获取原始数据中的图片和AD图片
		let originalImages = [];
		let originalADImages = [];
		if (openMode.value === 'edit') {
			if (options && options.data) {
				try {
					const originalData = JSON.parse(decodeURIComponent(options.data));
					// 将相对路径转为绝对路径
					originalImages = await readDiseaseImages(userInfo.username, idStorageInfo.buildingId,
						originalData
						.images) || [];
					originalADImages = await readDiseaseImages(userInfo.username, idStorageInfo.buildingId,
						originalData
						.ADImgs) || [];
				} catch (error) {
					console.error('解析原始数据失败:', error);
				}
			}
		}
		// 获取当前文件列表中的图片URL
		// myPhotoPicker组件的fileList直接存储图片路径字符串
		const currentImageUrls = fileList.value;
		const currentADImages = ADImgs.value.map(img => img.src);

		try {
			// 1. 先保存当前所有病害图片
			let imageRelativePaths = [];
			if (currentImageUrls.length > 0) {
				imageRelativePaths = await saveDiseaseImages(userInfo.username, idStorageInfo.buildingId,
					currentImageUrls);
				diseaseData.images = imageRelativePaths;
				console.log('保存当前所有病害图片，相对路径:', imageRelativePaths);
			} else {
				diseaseData.images = [];
			}

			// 2. 保存当前所有AD图片
			let adImageRelativePaths = [];
			if (currentADImages.length > 0) {
				adImageRelativePaths = await saveDiseaseImages(userInfo.username, idStorageInfo.buildingId,
					currentADImages);
				diseaseData.ADImgs = adImageRelativePaths;
				console.log('保存当前所有AD图片，相对路径:', adImageRelativePaths);
			} else {
				diseaseData.ADImgs = [];
			}

			// 3. 删除所有原有病害图片
			if (originalImages.length > 0) {
				await removeDiseaseImage(originalImages)
					.then(result => {
						console.log('删除原有病害图片成功:', result);
					})
					.catch(error => {
						console.error('删除原有病害图片失败:', error);
					});
			}

			// 4. 删除所有原有AD图片
			if (originalADImages.length > 0) {
				await removeDiseaseImage(originalADImages)
					.then(result => {
						console.log('删除原有AD图片成功:', result);
					})
					.catch(error => {
						console.error('删除原有AD图片失败:', error);
					});
			}

			console.log('已保存病害图片，更新病害数据...:', diseaseData);
			// 根据模式发送不同的事件
			if (openMode.value === 'create') {
				uni.$emit('addNewDisease', diseaseData);
			} else {
				uni.$emit('updateDisease', diseaseData);
			}
		} catch (error) {
			console.error('保存图片过程中发生错误:', error);
			plus.nativeUI.toast('保存图片失败');
			throw error; // 重新抛出错误，让调用者知道发生了错误
		}
	};

	const savedisease = () => {

		// 调用方法创建病害数据对象
		const diseaseData = createDiseaseData();

		console.log('将要保存的病害diseaseData', diseaseData);

		// 验证数据完整性
		if (!diseaseData.type || !diseaseData.component || !diseaseData.position || !diseaseData.description) {
			console.log('数据不完整，请确保选择了构件名称、构件编号、病害类型和病害位置');
			uni.hideLoading();
			uni.showToast({
				title: '请填写必填项',
				icon: 'none'
			});
			return;
		}

		// 显示加载提示
		uni.showLoading({
			title: '保存中...'
		});

		// 使用公共方法保存图片和更新病害数据
		saveImagesAndUpdateDisease(diseaseData)
			.then(() => {
				uni.hideLoading();
				uni.showToast({
					title: '保存成功',
					icon: 'success'
				});

				// 返回上一页
				setTimeout(() => {
					isChanged.value = false;
					uni.navigateBack();
				}, 500);
			})
			.catch(error => {
				uni.hideLoading();
				uni.showToast({
					title: '保存失败',
					icon: 'none'
				});
			});
	};

	const stagingDisease = () => {
		// 调用方法创建病害数据对象
		const diseaseData = createDiseaseData();

		console.log('将要暂存的病害diseaseData', diseaseData);

		// 验证数据完整性
		if (!diseaseData.type || !diseaseData.component || !diseaseData.position || !diseaseData.description) {
			console.log('数据不完整，请确保选择了构件名称、构件编号、病害类型和病害位置');
			uni.hideLoading();
			uni.showToast({
				title: '请填写必填项',
				icon: 'none'
			});
			return;
		}
		diseaseData.commitType = 3;

		// 显示加载提示
		uni.showLoading({
			title: '暂存中...'
		});

		// 使用公共方法保存图片和更新病害数据
		saveImagesAndUpdateDisease(diseaseData)
			.then(() => {
				uni.hideLoading();
				uni.showToast({
					title: '暂存成功',
					icon: 'success'
				});

				// 返回上一页
				setTimeout(() => {
					isChanged.value = false;
					uni.navigateBack();
				}, 500);
			})
			.catch(error => {
				uni.hideLoading();
				uni.showToast({
					title: '暂存失败',
					icon: 'none'
				});
			});
	}

	const canceldisease = () => {
		uni.navigateBack({
			delta: 1 // 返回上一页
		});
	}

	// 定义格式化函数
	const formatDateTime = (date = new Date()) => {
		const y = date.getFullYear();
		const m = String(date.getMonth() + 1).padStart(2, '0');
		const d = String(date.getDate()).padStart(2, '0');
		const h = String(date.getHours()).padStart(2, '0');
		const mm = String(date.getMinutes()).padStart(2, '0');
		const s = String(date.getSeconds()).padStart(2, '0');
		return `${y}-${m}-${d} ${h}:${mm}:${s}`;
	};

	// 编辑模式下的方法
	const deleteDisease = () => {
		uni.showModal({
			title: '确认删除',
			content: '确定要删除这条病害记录吗？',
			success: (res) => {
				if (res.confirm) {
					// 获取当前编辑的病害ID
					const currentId = getCurrentPages()[getCurrentPages().length - 1].$page?.options?.id;

					if (currentId) {
						// 创建带有isDelete标记的对象
						const deleteData = {
							id: currentId,
						};

						// 使用事件总线通知bridge-disease页面
						console.log('准备发送deleteDisease事件，标记删除ID:', currentId);
						uni.$emit('deleteDisease', deleteData);

						// 删除成功提示
						uni.showToast({
							title: '删除成功',
							icon: 'success'
						});

						// 返回上一页
						setTimeout(() => {
							isChanged.value = false;
							uni.navigateBack();
						}, 500);
					} else {
						uni.showToast({
							title: '无法获取病害ID',
							icon: 'none'
						});
					}
				}
			}
		});
	}

	const copyAndAddDisease = async () => {
		const diseaseData = createDiseaseData();
		// 验证数据完整性
		if (!diseaseData.type || !diseaseData.component || !diseaseData.position || !diseaseData.description) {
			console.log('数据不完整，请确保选择了构件名称、构件编号、病害类型和病害位置');
			uni.hideLoading();
			uni.showToast({
				title: '请填写必填项',
				icon: 'none'
			});
			return;
		}
		const saveDiseaseData = JSON.parse(JSON.stringify(diseaseData));

		await saveImagesAndUpdateDisease(saveDiseaseData)
		// 清空图片列表
		fileList.value = [];

		// 清空AD图片列表
		ADImgs.value = [];
		diseaseData.id = new Date().getTime();
		diseaseData.commitType = 1;
		diseaseData.localId = new Date().getTime();
		diseaseData.createTime = formatDateTime();
		diseaseData.updateTime = formatDateTime();
		diseaseData.historyDiseaseId = null;

		console.log('保存并复制到下一条');

		/*		// 清空图片列表
		    fileList.value = [];

		    // 清空AD图片列表
		    ADImgs.value = [];*/

		// 将编辑模式切换为新增模式
		openMode.value = 'create';
		// saveImagesAndUpdateDisease(diseaseData)

		// 简单提示
		uni.showToast({
			title: '保存并复制成功',
			icon: 'success',
			duration: 500
		});
	}

	const editDisease = () => {
		console.log('编辑');

		// 调用方法创建病害数据对象
		const diseaseData = createDiseaseData();
		diseaseData.commitType = 1;

		// 验证数据完整性
		if (!diseaseData.type || !diseaseData.component || !diseaseData.position || !diseaseData.description) {
			console.log('数据不完整，请确保选择了构件名称、构件编号、病害类型和病害位置');
			uni.hideLoading();
			uni.showToast({
				title: '请填写必填项',
				icon: 'none'
			});
			return;
		}

		// 显示加载提示
		uni.showLoading({
			title: '保存中...'
		});

		// 使用公共方法保存图片和更新病害数据
		saveImagesAndUpdateDisease(diseaseData)
			.then(() => {
				uni.hideLoading();
				uni.showToast({
					title: '保存成功',
					icon: 'success'
				});

				// 返回上一页
				setTimeout(() => {
					isChanged.value = false;
					uni.navigateBack();
				}, 500);
			})
			.catch(error => {
				uni.hideLoading();
				uni.showToast({
					title: '保存失败',
					icon: 'none'
				});
			});
	};

	const copyHistoryDisease = () => {
		const diseaseData = createDiseaseData();
		uni.$emit('copyHistoryDisease', diseaseData);
		uni.navigateBack();
	}

	const beforeHistoryDisease = () => {
		// 获取当前病害的ID
		const currentDiseaseId = JSON.parse(decodeURIComponent(
			getCurrentPages()[getCurrentPages().length - 1].$page?.options.data))?.id;

		// 发送事件到history-disease组件，请求上一条病害
		uni.$emit('navigateHistoryDisease', {
			action: 'previous',
			currentId: currentDiseaseId
		});
	}

	const nextHistoryDisease = () => {
		// 获取当前病害的ID
		const currentDiseaseId = JSON.parse(decodeURIComponent(
			getCurrentPages()[getCurrentPages().length - 1].$page?.options.data))?.id;

		// 发送事件到history-disease组件，请求下一条病害
		uni.$emit('navigateHistoryDisease', {
			action: 'next',
			currentId: currentDiseaseId
		});
	}

	const handleFileSelect = (photoNum) => {
		console.log('图片选择完成');
		if (fileList.value.length !== imgNoExp.value.length + 1) {
			// 计算需要补充的空字符串数量
			const targetLength = fileList.value.length - 1;
			const needAdd = targetLength - imgNoExp.value.length;

			// 如果需要补充，添加相应数量的空字符串
			if (needAdd > 0) {
				for (let i = 0; i < needAdd; i++) {
					imgNoExp.value.push('');
				}
			}
		}
		imgNoExp.value.push(photoNum);
		// myPhotoPicker组件通过v-model直接更新了fileList数组
		// 这里不需要像之前那样从事件中提取数据
		console.log('图片编号列表', imgNoExp.value);
		console.log('当前图片列表:', fileList.value);
	}

	const handleFileDelete = (e) => {
		console.log('图片删除事件', e);
		imgNoExp.value.splice(e.index, 1);
		// myPhotoPicker组件通过v-model直接更新了fileList数组
		// 这里可以进行一些额外的处理，如果需要的话
		console.log('删除后图片编号列表:', imgNoExp.value);
		console.log('删除后的图片列表:', fileList.value);
	}

	const onClickTemplate = (templateIndex) => {
		uni.navigateTo({
			url: `/pages/canvas/canvas?template=${templateIndex}`,
			success: (res) => {
				// 监听从 B 页面返回的数据
				res.eventChannel.once('returnData', (data) => {
					ADImgs.value.push({
						src: data.src
					});
				})
				popup.value.close();
			},
		})
	}
	const selectCanvasTemplate = () => {
		popup.value.open()
	}
	const removeImage = (index) => {
		ADImgs.value.splice(index, 1)
	}

	// 获取结构数据
	const fetchStructureData = async () => {
		try {
			let payload = objectInfo.getData();
			if (!payload || typeof payload !== 'object') {
				payload = {};
			}
			let tid = Number(payload.templateObjectId);
			// 未进过桥跨信息时 Pinia 常无 templateObjectId：与 getObjectUL 一致，从 UD 反查并 enrich 后再取模板树
			if (!Number.isFinite(tid) || tid <= 0) {
				const fresh = await getObjectUL(userInfo.username, idStorageInfo.buildingId);
				if (fresh && typeof fresh === 'object') {
					const udDir = await findUdDirForUser(userInfo.username);
					const uid = unref(idStore().userId);
					const enriched = await enrichObjectPayloadCatalogTemplateId(
						fresh,
						udDir,
						idStorageInfo.buildingId,
						uid || undefined
					);
					objectInfo.setData(enriched);
					payload = objectInfo.getData();
					tid = Number(payload?.templateObjectId);
				}
			}
			console.log('模板ID', payload?.templateObjectId);
			const data = await getObjectTemplate(tid, {
				buildingId: idStorageInfo.buildingId,
				userName: userInfo.username,
				objectTree: payload,
			});
			if (!data) {
				uni.showToast({
					title: '未找到该桥型模板或预置库未就绪',
					icon: 'none'
				});
				return null;
			}
			console.log('结构数据获取成功:', data);
			structureData.value = data;
			return data;
		} catch (error) {
			console.error('获取结构数据失败:', error);
			uni.showToast({
				title: '获取结构数据失败',
				icon: 'none'
			});
			return null;
		}
	};

	watch([fileList, ADImgs], () => {
		if (isInitializing) {
			console.log('数据已改变')
			isChanged.value = true;
		}
	}, {
		deep: true
	})

	let isManualBack = false; // 是否手动触发返回

	const onNavBack = () => {
		if (isManualBack) {
			isManualBack = false;
			uni.navigateBack();
			return;
		}
		if ((openMode.value === 'edit' || openMode.value === 'create') && isChanged.value) {
			uni.showModal({
				title: '提示',
				content: '您有未保存的修改，点击[确定]将丢弃未保存数据。',
				success: (res) => {
					if (res.confirm) {
						isManualBack = true;
						uni.navigateBack();
					}
				},
			});
			return;
		}
		uni.navigateBack();
	};

	onBackPress(() => {
		if (isManualBack) {
			isManualBack = false;
			return false; // 允许返回
		}
		if ((openMode.value === 'edit' || openMode.value === 'create') && isChanged.value) {
			uni.showModal({
				title: '提示',
				content: '您有未保存的修改，点击[确定]将丢弃未保存数据。',
				success: (res) => {
					if (res.confirm) {
						isManualBack = true;
						uni.navigateBack();
					}
				},
			});
			return true; // 先阻止默认返回
		}
		return false;
	});

	onUnmounted(() => {
		// 移除监听事件
		uni.$off('changeDiseaseData')
	})
</script>

<style scoped>
	.add-disease-page {
		display: flex;
		flex-direction: column;
		height: 100vh;
		width: 100%;
		box-sizing: border-box;
		background-color: #ffffff;
		--add-disease-edge-right: 16rpx;
	}

	.add-disease-body {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background-color: #ffffff;
	}

	.bridge-nav-title-wrap {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 8rpx;
		box-sizing: border-box;
	}

	.bridge-nav-title-text {
		color: #ffffff;
		font-size: 22rpx;
		font-weight: 400;
		line-height: 1.2;
		text-align: center;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.bridge-page-nav-info {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		padding-right: 0;
		box-sizing: border-box;
	}

	.bridge-page-nav-info-icon {
		color: #ffffff;
		font-size: 26rpx;
		font-weight: 400;
		line-height: 1.2;
		display: block;
		transform: translateY(1rpx);
	}

	.add-disease-page :deep(.uni-nav-bar__right) {
		padding-right: var(--add-disease-edge-right, 16rpx) !important;
		box-sizing: border-box;
	}

	/* 编辑病害顶部按钮 */
	.button-group-edit {
		display: flex;
		flex-direction: row;
		background-color: #BDCBE0;
		align-items: center;
		/* 垂直居中按钮 */
		padding: 10rpx 0;
	}

	.button-delete {
		background-color: #FF3141;
		color: #ffffff;
		margin-right: 10rpx;
	}

	/* 新增病害顶部按钮 */
	.button-group-add {
		display: flex;
		flex-direction: row;
		background-color: #BDCBE0;
		align-items: center;
		/* 垂直居中按钮 */
		padding: 10rpx 0;
	}

	/* 顶栏按钮统一尺寸（与桥梁工具条 40rpx 高一致，便于全项目对齐） */
	.button-group-add button,
	.button-group-edit button {
		height: 40rpx;
		line-height: 40rpx;
		box-sizing: border-box;
		border-radius: 5rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 16rpx;
		padding: 0 10rpx;
	}

	.button-group-add button::after,
	.button-group-edit button::after {
		border: none;
	}

	.button-before,
	.button-next {
		margin: 0 10rpx;
		background-color: #0F4687;
		color: #ffffff;
	}

	.button-copyAndTonext {
		background-color: #0F4687;
		color: #ffffff;
		margin-left: 0;
		margin-right: 10rpx;
	}

	.button-savetonext {
		background-color: #0F4687;
		color: #ffffff;
		margin-right: 10rpx;
	}

	.button-save {
		background-color: #0F4687;
		color: #ffffff;
		margin-left: 0;
		margin-right: 0;
	}

	.button-cancle {
		border: 1px solid #1677FF;
		margin: 0 10rpx;
	}

	.button-copyHistoryDisease {
		background-color: #0F4687;
		color: #ffffff;
		margin-right: 0;
	}

	.button-staging {
		background-color: #0F4687;
		color: #ffffff;
		margin-right: 0;
		margin-left: 10rpx;
	}

	/*picker公用*/
	.picker-content {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
	}

	/* 上传图片 */
	.part-UploadImage {
		display: flex;
		flex-direction: column;
		border-bottom: 1px solid #EEEEEE;
		padding: 12rpx 16rpx;
		min-height: 200rpx;
		height: auto;
	}

	.part-title {
		font-size: 20rpx;
	}

	.upload-view {
		width: 100%;
		margin-top: 10rpx;
	}

	/* 外层不铺灰，只让组件里「添加」格单独 #f5f5f5 */
	.photo-select {
		margin-top: 10rpx;
		height: auto;
		min-height: 100rpx;
		background-color: transparent;
	}

	/* 与简图区一致：方卡尺寸；已选图预览格白底（勿整片灰） */
	.photo-select::v-deep .preview-container {
		width: 176rpx;
		height: 176rpx;
		min-width: 176rpx;
		min-height: 176rpx;
		max-width: 176rpx;
		max-height: 176rpx;
	}

	.photo-select::v-deep .photo-item-container {
		width: 176rpx;
	}

	.photo-select::v-deep .info-button-wrapper {
		width: 176rpx;
	}

	/* 仅已选图缩略格在 .photo-item-container 内；添加格与之同级，勿用 :not 以免部分端误伤灰底 */
	.photo-select::v-deep .photo-item-container .preview-container {
		background-color: #ffffff !important;
	}

	.photo-select::v-deep .preview-image {
		background-color: #ffffff !important;
	}

	.file-picker {
		width: 100%;
	}

	.part-ADImages {
		display: flex;
		flex-direction: column;
		border-bottom: 1px solid #EEEEEE;
		padding: 12rpx 16rpx;
	}


	.ADImages {
		width: 100%;
		margin-top: 10rpx;
		display: flex;
		align-items: center;
		justify-content: flex-start;
		flex-wrap: wrap;
	}

	.img-wrapper {
		width: 140rpx;
		height: 140rpx;
		position: relative;
		display: inline-block;
		margin: 0 10rpx;
		border: 1px solid #EEEEEE;
		border-radius: 5rpx;
	}

	.ADImage {
		height: 140rpx;
		width: 140rpx;
		object-fit: cover;
		/* 保持比例裁剪填充 */
		border-radius: 8rpx;
	}

	/* 右上角的删除按钮 */
	.close-btn {
		position: absolute;
		top: 0rpx;
		right: 0rpx;
		width: 20rpx;
		height: 20rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background-color: rgba(0, 0, 0, 0.6);
		color: #fff;
		font-size: 24rpx;
		z-index: 1;
	}

	.ADImage-container {
		height: 176rpx;
		width: 176rpx;
		border: none;
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
	}

	.ad-upload-plus {
		width: 36rpx;
		height: 36rpx;
		position: relative;
		flex-shrink: 0;
	}

	.ad-upload-plus::before,
	.ad-upload-plus::after {
		content: '';
		position: absolute;
		background-color: #b8bcc4;
		border-radius: 1rpx;
	}

	.ad-upload-plus::before {
		left: 50%;
		top: 0;
		width: 2rpx;
		height: 100%;
		transform: translateX(-50%);
	}

	.ad-upload-plus::after {
		top: 50%;
		left: 0;
		width: 100%;
		height: 2rpx;
		transform: translateY(-50%);
	}

	.popup-content {
		background-color: #fff;
		height: 70vh;
		/* padding: 10rpx; */
		display: flex;
		flex-direction: column;
		overflow: auto;
	}

	.template-row {
		width: 100%;
		border-bottom: 1px solid #eeeeee;
	}

	.template-type {
		font-size: 18rpx;
		padding: 16rpx;
		box-sizing: border-box;
	}

	.template-image {
		width: 100%;
		padding: 20rpx;
		display: flex;
		align-items: center;
		justify-content: flex-start;
		flex-wrap: wrap;
		row-gap: 10rpx;
		border-bottom: 1px solid #eeeeee;
		gap: 20rpx;
	}

	.template-image-card {
		height: 200rpx;
		width: 200rpx;
	}

	.head {
		background-color: #BDCBE0;
	}

	.head-text {
		padding: 4rpx 10rpx;
		font-size: 18rpx;
	}

	/* 深度穿透组件样式 */
	::v-deep .uni-data-checklist .checklist-box {
		min-height: 20rpx !important;
		min-width: 60rpx !important;
		display: flex !important;
		align-items: center !important;
		justify-content: center !important;
	}

	/* 单独处理文本容器 */
	::v-deep .uni-data-checklist .checklist-box .checklist-content {
		line-height: 1 !important;
		/* 重置行高 */
		display: flex !important;
		align-items: center !important;
		justify-content: center !important;
		width: 100% !important;
		/* 确保文本容器占满父级 */
	}


	.form-container {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		box-sizing: border-box;
	}

	/* 确保外部容器不滚动 */
	view {
		box-sizing: border-box;
	}

	/* 调整图片列表的间距 */
	.photo-select::v-deep .preview-list {
		gap: 15rpx;
	}

	.disease-image {
		height: 140rpx;
		width: 140rpx;
		margin-top: 10rpx;
		margin-left: 10rpx;
		object-fit: cover;
	}
  /* 手机端适配 */
  @media (max-width: 599px) {
    .photo-select ::v-deep .preview-list,
    .photo-select ::v-deep .preview-container,
    .photo-select ::v-deep .upload-list {
      justify-content: flex-start !important;
    }
  }
</style>

<style lang="scss">
.add-disease-page .preview-container.preview-container--add {
	background-color: #f5f5f5 !important;
	border-radius: 16rpx !important;
	border: 1rpx solid #e0e0e0 !important;
	box-sizing: border-box !important;
}

.add-disease-page .ADImage-container.ADImage-container--add {
	background-color: #f5f5f5 !important;
	border-radius: 16rpx !important;
	border: 1rpx solid #e0e0e0 !important;
	box-sizing: border-box !important;
}
</style>