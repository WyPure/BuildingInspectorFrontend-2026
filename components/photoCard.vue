<template>
	<view class="container">
		<view class="wrapper-box">
			<view class="row-container">
				<view class="image">
					<myPhotoPicker 
						v-model="photos"
						@select="handlePhotoChange"
						@delete="handleDeletePhoto"
					/>
				</view>
				<view class="info">
					<photoInfo 
						:selectedFirstIndex="selectedFirstIndex"
						:selectedSecondIndex="selectedSecondIndex"
						:photoIndex="currentPhotoIndex"
					/>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import myPhotoPicker from "./myPhotoPicker.vue";
import photoInfo from "./photoInfo.vue";
import { ref, onMounted, watch } from 'vue';
import { userStore } from '@/store/index.js';
import { idStore } from '@/store/idStorage';
import { getObjectUL } from '../utils/readUL';
// import { readBridgeImage } from '../utils/readUL';
import { readBridgeImage } from '../utils/readJsonNew';
import { setObject } from '../utils/writeNew';
import { saveBridgeImages } from '../utils/writeNew';
import { buildingImagesFromAbsoluteToRelative } from '../utils/readJsonNew';
import { setBuildingUnCommitted } from "@/utils/isBuildingCommited";
import { setCommit0 } from "@/utils/CurrentPhoto";

const userInfo = userStore();
const idInfo = idStore();
const photos = ref([]);
const currentPhotoIndex = ref(0);
const loading = ref(false);

// 接收选中的索引
const props = defineProps({
  selectedFirstIndex: {
    type: Number,
    default: 0
  },
  selectedSecondIndex: {
    type: Number,
    default: 0
  }
});

// 初始化加载图片数据
const loadPhotos = async () => {
  console.log('加载图片数据，索引:', props.selectedFirstIndex, props.selectedSecondIndex);
  loading.value = true;
  try {
    // 获取结构数据
    const structureData = await getObjectUL(userInfo.username, idInfo.buildingId);
    console.log('获取到结构数据:', structureData);
    
    if (!structureData?.children?.[props.selectedFirstIndex]?.children?.[props.selectedSecondIndex]) {
      console.error('找不到对应的结构项');
      photos.value = [];
      loading.value = false;
      return;
    }
    
    const secondLevelItem = structureData.children[props.selectedFirstIndex].children[props.selectedSecondIndex];
    console.log('二级菜单项:', secondLevelItem);
    
    // 如果有照片数据，转换为绝对路径
    if (secondLevelItem.photo && secondLevelItem.photo.length > 0) {
      console.log('原始照片数据:', secondLevelItem.photo);
      // 将相对路径转换为绝对路径
      const absolutePaths = await readBridgeImage(userInfo.username, idInfo.buildingId, secondLevelItem.photo);
      console.log('转换后的绝对路径:', absolutePaths);
      photos.value = absolutePaths;
    } else {
      photos.value = [];
    }
  } catch (error) {
    console.error('加载图片失败:', error);
    uni.showToast({
      title: '加载图片失败',
      icon: 'none'
    });
    photos.value = [];
  } finally {
    loading.value = false;
  }
};

// 处理照片变化
const handlePhotoChange = async () => {
  console.log('照片变化:', photos.value);
  try {
    // 获取结构数据
    const structureData = await getObjectUL(userInfo.username, idInfo.buildingId);
    if (!structureData?.children?.[props.selectedFirstIndex]?.children?.[props.selectedSecondIndex]) {
      console.error('找不到对应的结构项');
      return;
    }
    
    // 获取二级菜单项
    const secondLevelItem = structureData.children[props.selectedFirstIndex].children[props.selectedSecondIndex];
    
    // 将绝对路径转换为相对路径
    secondLevelItem.photo = await buildingImagesFromAbsoluteToRelative(photos.value);
    
    // 保存到结构数据
    await setObject(userInfo.username, idInfo.buildingId, structureData);
    
    // 设置为未提交状态
    await setBuildingUnCommitted(userInfo.username, idInfo.projectId, idInfo.buildingId);
    uni.$emit('setBuildingUnCommit', idInfo.buildingId);
    await setCommit0(userInfo.username, idInfo.buildingId);
    
    console.log('照片数据已保存');
    
    // 通知photoInfo组件更新
    uni.$emit('photoInfoUpdate');
  } catch (error) {
    console.error('保存照片失败:', error);
    uni.showToast({
      title: '保存失败',
      icon: 'none'
    });
  }
};

// 处理删除照片
const handleDeletePhoto = async (data) => {
  console.log('删除照片:', data);
  try {
    // 更新当前照片索引
    if (currentPhotoIndex.value >= photos.value.length - 1) {
      currentPhotoIndex.value = Math.max(0, photos.value.length - 2);
    }
    
    // 通知photoInfo组件更新
    uni.$emit('photoInfoUpdate');
    
    // 保存照片变化
    await handlePhotoChange();
  } catch (error) {
    console.error('删除照片失败:', error);
  }
};

// 监听索引变化
watch([() => props.selectedFirstIndex, () => props.selectedSecondIndex], () => {
  console.log('索引变化，重新加载图片');
  currentPhotoIndex.value = 0; // 重置当前照片索引
  loadPhotos();
}, { immediate: true });

onMounted(() => {
  loadPhotos();
});
</script>

<style scoped>
.container {
	width: 100%;
	padding: 10rpx;
	box-sizing: border-box;
}

.wrapper-box {
	border: 1px solid #BDCBE0;
	border-radius: 10rpx;
	padding: 10rpx 10rpx 0rpx 10rpx; /* 上右下左，下边距减为0 */
	background-color: #ffffff; /* 改为纯白色 */
	box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.05);
	margin-bottom: 0; /* 确保底部没有外边距 */
}

.row-container {
	display: flex;
	flex-direction: row;
	align-items: flex-start;
	gap: 20rpx;
	width: 100%;
}

.image {
	flex: 0 0 auto;
	width: 200px;
}

.info {
	flex: 1;
	min-width: 0;
	max-height: none; /* 移除最大高度限制 */
	overflow: visible; /* 改为可见，不截断超出部分 */
	margin-top: 2px;
}

/* 强制修改photoInfo组件样式 */
.info :deep(.photo-info-container) {
	height: auto !important;
	max-height: none !important; /* 移除最大高度限制 */
	margin: 0 !important;
	max-width: none !important;
	background-color: transparent !important;
	box-shadow: none !important;
	border-radius: 8rpx !important;
	padding-top: 0 !important;
	overflow: visible !important; /* 改为可见，不截断超出部分 */
}

/* 强制修改标题文字大小和背景色 */
.info :deep(.photo-info-title) {
	font-size: 20rpx !important;
	margin-bottom: 0 !important; /* 移除底部边距 */
	background-color: #BDCBE0 !important;
	padding: 5rpx !important;
	border-radius: 8rpx 8rpx 0 0 !important;
	text-align: center !important;
	line-height: 1.2 !important;
	height: auto !important;
}

/* 强制修改textarea样式 */
.info :deep(.photo-info-textarea) {
	height: 168px !important;
	max-height: 168px !important;
	min-height: 168px !important;
	font-size: 20rpx !important;
	background-color: #fff !important;
	margin-top: 0 !important;
	margin-bottom: -8rpx !important; /* 确保底部没有外边距 */
	border-top: none !important;
	border-radius: 0 0 8rpx 8rpx !important;
	padding-bottom: 5rpx !important; /* 减小底部内边距 */
}
</style>
