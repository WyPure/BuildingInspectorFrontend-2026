<template>
  <view class="container">
    <view v-if="isLoading" class="loading">
      <text>加载中...</text>
    </view>
    <view class="content-layout" v-else>
      <!-- 第一级目录 -->
      <view class="sidebar">
        <view v-for="(item, index) in structureData?.children || []" :key="index"
              :class="['sidebar-item', selectedIndex === index ? 'active' : '']" @click="changeTab(index)">
          <view class="treeName sidebar-item-content">
            <image v-if="hasPhotos(item)" src="@/static/image/yes.png" class="menu-icon"></image>
            {{item.name || '未命名'}}
          </view>
        </view>
      </view>

      <!-- 第二级目录 -->
      <view class="sidebar second-sidebar">
        <view v-if="secondLevelItems.length > 0">
          <view v-for="(item, index) in secondLevelItems" :key="index"
                :class="['sidebar-item', selectedSecondIndex === index ? 'active' : '']"
                @click="changeSecondTab(index)">
            <view class="treeName sidebar-item-content">
              <image v-if="hasPhotos(item)" src="@/static/image/yes.png" class="menu-icon"></image>
              {{item.name || '未命名'}}
            </view>
          </view>
        </view>
        <view v-else class="no-data-tip">
          正在加载
        </view>
      </view>

      <!-- 照片区域 - 仅展示当前选中的二级项 -->
      <view class="photo-section">
        <view class="photo-controls-wrapper" v-if="currentSecondItem.photo.length > 0">
          <view class="photo-item" v-for="(url, pIndex) in (currentSecondItem.photo || [])" :key="pIndex">
            <image :src="url" mode="aspectFill" @click="previewImage(url)" class="image" />
            <view class="photo-info-text" @click="openPhotoInfo((currentSecondItem.information && currentSecondItem.information[pIndex]) || '')">{{ (currentSecondItem.information && currentSecondItem.information[pIndex]) || '暂无备注' }}</view>
          </view>
        </view>
        <view v-else class="no-data-tip">暂无图片</view>
      </view>
    </view>

    <!-- 图片信息弹窗（uni-popup） -->
    <uni-popup ref="photoInfoPopup" type="center" :is-mask-click="true" @maskClick="closePhotoInfo">
      <view class="photo-info-popup">
        <view class="popup-title">图片备注</view>
        <scroll-view scroll-y="true" class="photo-info-scroll">
          <view class="photo-info-content">{{ photoInfoText || '暂无备注' }}</view>
        </scroll-view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup>
import {computed, onMounted, ref} from "vue";
import {userStore} from "@/store";
import {idStore} from "@/store/idStorage";
import apiConfig from "@/config/api";

// 加载中
const isLoading = ref(true);

const userInfo = userStore()
const idStorageInfo = idStore()
const selectedIndex = ref(0);
const selectedSecondIndex = ref(0);
const structureData = ref(null);

// 图片备注弹窗（uni-popup）
const photoInfoPopup = ref(null);
const photoInfoText = ref('');
const openPhotoInfo = (text) => {
  photoInfoText.value = text || '';
  photoInfoPopup.value && photoInfoPopup.value.open();
};
const closePhotoInfo = () => {
  photoInfoPopup.value && photoInfoPopup.value.close();
};

const changeTab = (index) => {
  selectedIndex.value = index;
  selectedSecondIndex.value = 0;
};

// 添加hasPhotos函数来检查菜单项是否有照片
const hasPhotos = (item) => {
  if (item.photo && item.photo.length > 0) {
    return true;
  }

  if (item.children && item.children.length > 0) {
    return item.children.some(child => hasPhotos(child));
  }

  return false;
};

const changeSecondTab = async (index) => {
  selectedSecondIndex.value = index;
};
// 计算第二个侧边栏的数据
const secondLevelItems = computed(() => {
  if (!structureData.value?.children?.[selectedIndex.value]?.children) {
    return [];
  }
  return structureData.value.children[selectedIndex.value].children;
});

// 当前选中的二级项
const currentSecondItem = computed(() => {
  console.log(secondLevelItems.value[selectedSecondIndex.value]);
  return secondLevelItems.value[selectedSecondIndex.value] || null;
});

const previewImage = (url) => {
  console.log('预览图片:', url)
  uni.previewImage({
    urls: [url],
  });
}

onMounted(async () => {
  // 获取 Token
  const responseLogin = await uni.request({
    url: `${apiConfig.baseURL}/jwt/login?username=${userInfo.username}&password=${userInfo.password}`,
    method: 'POST'
  });

  if (!responseLogin.data || !responseLogin.data.token) {
    uni.hideLoading();
    uni.showToast({
      title: '获取授权失败',
      icon: 'none'
    });
    return;
  }

  const token = responseLogin.data.token;
  const structureInfoResponse = await uni.request({
    url: `${apiConfig.baseURL}/api/building/${idStorageInfo.buildingId}/object-online`, //http://{{host}}:{{port}}/api/building/1959/object-online
    method: 'GET',
    header: {
      Authorization: `${token}`
    }
  });
  console.log(structureInfoResponse.data.data)
  structureData.value = structureInfoResponse.data.data;
  isLoading.value = false;
})

</script>

<style scoped>
.active {
  position: relative;
  background-color: #fff;
}

.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 17%;
  height: 66%;
  width: 3rpx;
  background-color: #0F4687;
}

.active .treeName {
  color: #0F4687 !important;
}

.container {
  width: 100%;
  height: 100vh; /* 确保容器有高度 */
  display: flex;
  flex-direction: column;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
}

.content-layout {
  height: 100%;
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar-item {
  padding: 24rpx 4rpx;
  text-align: left;
  color: #666;
  border-bottom: 1px solid #eeeeee;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  height: 40rpx;
  justify-content: center;
  position: relative;
}

.sidebar-item-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding-left: 10rpx;
  width: 100%;
  overflow: hidden;
  word-break: break-all; /* 允许在任意字符间断行 */
  white-space: normal; /* 改为正常换行 */
  line-height: 1.4; /* 增加行高，提高可读性 */
  min-height: 60rpx; /* 设置最小高度，确保多行文字有足够空间 */
}

/* 侧边栏样式 */
.sidebar {
  width: 140rpx;
  background-color: #f5f5f5;
  border-right: 1rpx solid #eeeeee;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.second-sidebar {
  background-color: #fafafa;
  width: 140rpx;
}

.treeName {
  margin-left: 5rpx;
  font-size: 15rpx;
/*  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;*/
  flex: 1;
  white-space: normal; /* 改为正常换行 */
  word-break: break-all; /* 允许在任意字符间断行 */
  overflow: visible; /* 改为可见 */
  text-overflow: unset; /* 取消省略号 */
  line-height: 1.4;
}

/* 添加无数据提示样式 */
.no-data-tip {
  padding: 30rpx;
  text-align: center;
  color: #999;
  font-size: 24rpx;
}

/* 菜单图标样式 */
.menu-icon {
  width: 15rpx;
  height: 15rpx;
  margin-right: 5rpx;
  flex-shrink: 0;
}

/* 照片区域 */
.photo-section {
  flex: 1;
  padding: 20rpx;
  overflow-y: auto;
}

/* 照片控件包装器：两列布局 */
.photo-controls-wrapper {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 20rpx;
}

/* 每张图片与对应文字容器：占据两列中的一列 */
.photo-item {
  display: flex;
  flex-direction: column;
  width: calc(50% - 10rpx); /* 两列布局，考虑gap分配 */
}

/* 图片下方说明文字：更窄更高且垂直/水平居中，单行省略 */
.photo-info-text {
  margin-top: 10rpx;
  font-size: 20rpx;
  color: #666;
  width: 80%;
  align-self: center;
  height: 40rpx;      /* 提高高度 */
  padding: 6rpx 8rpx; /* 保留少量左右内边距 */
  background-color: #e7e7e7;
  border-radius: 8rpx;
  display: flex;
  align-items: center;     /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  white-space: nowrap;     /* 单行 */
  overflow: hidden;
  text-overflow: ellipsis; /* 省略号 */
  cursor: pointer;
}

/* 单张图片尺寸 */
.image{
  width: 100%;
  height: 220rpx; /* 可按需调整高度 */
  border-radius: 8rpx;
  background: #f3f3f3;
}

/* 图片信息弹窗样式（内容容器） */
.photo-info-popup {
  background-color: #fff;
  padding: 0;
  width: 600rpx;
  border-radius: 10rpx;
  overflow: hidden;
}

.popup-title {
  font-size: 20rpx;
  text-align: center;
  color: #333;
  background-color: #BDCBE0;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo-info-scroll{
  min-height: 300rpx; /* 最小高度，避免内容过少时过矮 */
}

.photo-info-content{
  padding: 20rpx;
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  white-space: pre-wrap;
}
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200rpx;
  font-size: 28rpx;
  color: #666;
}
</style>