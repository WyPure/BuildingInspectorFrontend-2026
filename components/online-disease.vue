<template>
  <view class="disease-container">
    <view class="search-add-container">
      <view class="view-search-bar">
        <uni-search-bar class="search-bar" placeholder="搜索词" clearButton="none" cancelButton="none"
                        @input="handleSearchInput" />
      </view>
      <picker class="tag-select" :value="tagIndex" :range="tags" @change="tagChange">
        <view class="tag-picker">{{tags[tagIndex]}}</view>
        <text class="tag-icon">▼</text>
      </picker>
      <view class="number-part">
        病害总数: {{ diseaseList.length }}
      </view>
    </view>

    <view>
      <disease-item v-for="(item, index) in filteredDiseases" :key="index" :item="item" :editMode="'online'"/>
      <view v-if="filteredDiseases.length === 0" class="placeholder">
        暂无数据
      </view>
    </view>

	</view>
</template>

<script setup>

// 顶部选择未完成、未提交
import {computed, onMounted, ref} from "vue";
import {userStore} from "@/store";
import {idStore} from "@/store/idStorage";
import apiConfig from "@/config/api";

const userInfo = userStore();
const idStorageInfo = idStore();

const tags = ref(['全部', '上部结构', '下部结构', '桥面系']);
const tagIndex = ref(0);
const tagChange = (e) => {
  // e.detail.value 可能为字符串，统一转为数字索引
  tagIndex.value = Number(e.detail.value);
  // commitType 0为已提交 1为未提交 2为删除 3为未保存
  // 切换筛选时，如处于选择模式可根据需要清空已选
};

// 处理搜索输入，实时筛选
const searchText = ref('');
const handleSearchInput = (e) => {
  searchText.value = e;
  console.log('实时搜索内容:', e);
};

const diseaseList = ref([]);

// 计算属性
const filteredDiseases = computed(() => {
  // 根据activeTab和searchText过滤disease列表
  const selectedType = tags.value[tagIndex.value];

  const filtered = diseaseList.value.filter(item => {
    // 过滤掉已删除的数据（commit_type=2）
    if (item.commitType === 2) {
      return false;
    }
    // 按类型过滤 - 使用component.grandObjectName
    if(selectedType !== '全部' && item.component?.grandObjectName !== selectedType){
      return false;
    }
    // 如果有搜索关键词，再按关键词过滤
    if (searchText.value) {
      // 将搜索文本按空格分词
      const keywords = searchText.value.trim().split(/\s+/);
      return keywords.some(keyword =>
          (item.description?.includes(keyword) ||
              item.type?.includes(keyword) ||
              item.biObjectName?.includes(keyword) ||
              item.position?.includes(keyword))
      );
    }

    return true;
  });

  // 按 component.code 升序排序
  return filtered.sort((a, b) => {
    const codeA = a.component?.code || '';
    const codeB = b.component?.code || '';
    return codeA.localeCompare(codeB);
  });
});

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

  const currentYear = idStorageInfo.projectYear;
  const diseaseDataResponse = await uni.request({
    url: `${apiConfig.baseURL}/api/building/${idStorageInfo.buildingId}/disease?year=${currentYear}`,//http://{{host}}:{{port}}/api/building/1959/disease?year=2025
    method: 'GET',
    header: {
      Authorization: `${token}`
    }
  });
  diseaseList.value = diseaseDataResponse.data.data[0].diseases;
})

</script>

<style>
.disease-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
}
.search-add-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0rpx;
  background-color: #BDCBE0;
  z-index: 1;
}

.view-search-bar {
  width: 45%;
}

.search-bar {
  flex: 1;
}
.tag-select {
  position: relative;
  display: inline-flex;
  align-items: center;
  margin-left: 8rpx;
  background: #ffffff;
  border: 1rpx solid #CFD7E6;
  border-radius: 4rpx;
  padding: 4rpx 28rpx 4rpx 10rpx;
  /* 右侧为箭头预留空间 */
  box-shadow: 0 0 0 rgba(0, 0, 0, 0);
  /* 需要时可加阴影 */
  width: 120rpx;
  box-sizing: border-box;
}

.tag-picker {
  padding: 0;
  /* 由外层控制内边距 */
  margin-left: 0;
  /* 使用外层margin */
  font-size: 20rpx;
  color: #333;
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-icon {
  position: absolute;
  right: 8rpx;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18rpx;
  color: #6B778C;
  pointer-events: none;
  /* 不阻挡点击 */
}
.number-part{
  display: flex;
  /* 内部按钮横向排列 */
  align-items: center;
  /* 垂直居中 */
  margin-left: auto;
  padding-right: 16rpx;
  font-size: 20rpx;
}
.placeholder {
  text-align: center;
  color: #999;
  font-size: 28rpx;
  margin-top: 30rpx;
}

</style>