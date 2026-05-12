<template>
	<view>
    <view class="bridge-info">
      <view class="bridge-info-content">
        <view class="bridge-info-content-left">
          <view class="bridge-info-content-left-title">{{bridgeName}}</view>
          <view class="bridge-info-content-left-content">
            {{bridgeCode}}/{{routeCode}}/{{routeName}}/{{bridgePileNumber}}
          </view>
        </view>
      </view>
    </view>
	</view>

  <!-- 顶部导航栏 -->
  <view class="tabs">
    <view v-for="(tab, index) in tabs" :key="index" :class="['tab-item', activeTab === index ? 'active' : '']"
          @click="switchTab(index)">
      <view class="tab-item-text">
        {{ tab.name }}
      </view>
    </view>
    <!-- 滑动指示器 -->
    <view class="tab-indicator" :style="indicatorStyle"></view>
  </view>

  <view class="content">
    <view v-show="activeTab === 0">
      <!-- 病害总览 -->
      <online-disease></online-disease>
    </view>
    <view v-show="activeTab === 1">
      <!-- 现状照 -->
      <online-current-photo></online-current-photo>
    </view>
    <view v-show="activeTab === 2">
      <!-- 结构信息 -->
      <online-structure-info></online-structure-info>
    </view>
  </view>
</template>

<script setup>
import {computed, onMounted, ref} from "vue";
import OnlineDisease from "@/components/online-disease.vue";
import OnlineCurrentPhoto from "@/components/online-currentPhoto.vue";
import OnlineStructureInfo from "@/components/online-structureInfo.vue";
import apiConfig from "@/config/api";
import {userStore} from "@/store";
import {idStore} from "@/store/idStorage";

const userInfo = userStore();
const idStorageInfo = idStore();

const bridgeName = ref('');
const bridgeCode = ref('');
const bridgePileNumber = ref('');
const routeCode = ref('');
const routeName = ref('');

const diseaseData = ref();
const structureInfoData = ref();

const readBridgeInfo = () => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const params = currentPage.$page?.options;
  bridgeName.value = params.bridgeName || '';
  bridgeCode.value = params.bridgeCode || '';
  bridgePileNumber.value = params.bridgePileNumber || '';
  routeName.value = params.routeName || '';
  routeCode.value = params.routeCode || '';
};

// 定义导航标签
const tabs = ref([{
  name: '病害总览',
},
  {
    name: '现状照'
  },
  {
    name: '结构信息',
  }
]);
// 当前活动标签
const activeTab = ref(0);

// 切换标签
const switchTab = (index) => {
  activeTab.value = index;
};

// 计算滑动指示器的样式
const indicatorStyle = computed(() => {
  const width = 100 / tabs.value.length;
  return {
    width: `${width * 0.6}%`, // 设置为标签宽度的60%
    left: `calc(${width * activeTab.value}% + ${width/2}% - ${width * 0.3}%)`, // 将指示器居中
    transform: 'none' // 移除transform
  };
});

onMounted(async function () {
  readBridgeInfo();
  // 获取 Token
/*  const responseLogin = await uni.request({
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

  const currentYear = new Date().getFullYear();
  const diseaseDataResponse = await uni.request ({
    url: `${apiConfig.baseURL}/api/building/${idStorageInfo.buildingId}/disease?year=${currentYear}`,//http://{{host}}:{{port}}/api/building/1959/disease?year=2025
    method: 'GET',
    header: {
      Authorization: `${token}`
    }
  });
  diseaseData.value = diseaseDataResponse.data.data[0].diseases;

  const structureInfoResponse = await uni.request ({
    url: `${apiConfig.baseURL}/api/building/${idStorageInfo.buildingId}/object`, //http://{{host}}:{{port}}/api/building/1959/object
    method: 'GET',
    header: {
      Authorization: `${token}`
    }
  });
  console.log(structureInfoResponse.data.data)
  structureInfoData.value = structureInfoResponse.data.data;*/
})
	
</script>

<style scoped>
.bridge-info {
  background-color: #BDCBE0;
  padding: 10rpx;
  flex-shrink: 0;
}

.bridge-info-content {
  padding: 10rpx;
  border: 1rpx solid #0F4687;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.bridge-info-content-left-title {
  font-size: 20rpx;
  font-weight: 700;
  color: #333333;
}

.bridge-info-content-left-content {
  font-size: 16rpx;
  color: #666666;
}
.tabs {
  display: flex;
  position: relative;
  height: 4.37%;
  background-color: #BDCBE0;
  flex-shrink: 0;
}
.tab-item-text {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.tab-item {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #333333;
  font-size: 20rpx;
  position: relative;
  z-index: 1;
}
.tab-indicator {
  position: absolute;
  bottom: 0;
  height: 3rpx;
  background-color: #0F4687;
  transition: all 0.3s;
}
</style>
