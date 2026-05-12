<template>
	<view class="container">
    <view v-if="isLoading" class="loading">
      <text>加载中...</text>
    </view>
    <!-- 三个侧边栏 -->
    <view v-else class = "sidebar">
      <!-- 第一级侧边栏 -->
      <view class = 'sidebar-level1'>
        <!-- 遍历展示第一层的数据 -->
        <view v-for="(item1,index1) in (treeData?.children || [])" :key="item1.id" @click = "changeTab(index1)" :class = "{active: safeMenuIndex[0] === index1}">
          <!-- menuIndex[0]记录了当前选中的菜单项索引 index1 是当前循环渲染菜单项的索引 你每次修改后menuIndex会变会触发遍历 index会找到更新的index然后高亮-->
          <!-- 给每个容器设置宽高 -->
          <view class = "box">
            {{item1.name}}
          </view>
        </view>
      </view>

      <!-- 第二级侧边栏 -->
      <view class = "sidebar-level2">
        <!-- 遍历展示第2层的数据 -->
        <view v-for="(item2,index2) in (treeData?.children?.[safeMenuIndex[0]]?.children || [])" :key="item2.id"
              @click = "changeTab(safeMenuIndex[0],index2)" :class = "{active: safeMenuIndex[1] === index2}">
          <!-- menuIndex[1]记录了第二级的菜单项索引 index2 是当前循环渲染菜单项的索引 你每次修改后menuIndex会变会触发遍历 index会找到更新的index然后高亮-->
          <view class = "box">
            {{item2.name}}
          </view>
        </view>
      </view>

      <!-- 第三级侧边栏 -->
      <view class = "sidebar-level3">
        <!-- 遍历展示第3层的数据 -->
        <view v-for="(item3,index3) in (treeData?.children?.[safeMenuIndex[0]]?.children?.[safeMenuIndex[1]]?.children || [])" :key="item3.id"
              @click = "changeTab(safeMenuIndex[0],safeMenuIndex[1],index3)" :class = "{active2: safeMenuIndex[2] === index3}" class="fathercontentandbutton">
          <!-- menuIndex[2]记录了第3级的菜单项索引 index3 是当前循环渲染菜单项的索引 你每次修改后menuIndex会变会触发遍历 index会找到更新的index然后高亮-->
          <view class="content">

            <view class = "box3">
              {{item3.name}}
            </view>

            <!-- 右侧信息区 -->
            <view class="right">
              <!-- 内容 -->
              <view class="content-container">
                <text class="disease">
                  <span class="dissease-count">病害构件数量</span>
                  {{item3?.diseaseNumber ?? 0}}
                </text>
                <text class="component-count">
                  <span class="count">构件数量</span>
                  {{item3.count}}
                </text>
              </view>

            </view>
          </view>

        </view>
      </view>



    </view>
	</view>
</template>

<script setup>
import {computed, nextTick, onMounted, ref} from "vue";
import {userStore} from "@/store";
import {idStore} from "@/store/idStorage";
import apiConfig from "@/config/api";

const userInfo = userStore();
const idStorageInfo = idStore();

// 加载中
const isLoading = ref(true);

// 结构信息数据
const treeData = ref(null);

//用数组存储索引下标,默认只选中前2项
const menuIndex = ref([0,0,-1])
// 确保menuIndex有安全的值
const safeMenuIndex = computed(() => {
  return menuIndex.value || [0, 0, -1]
})

const changeTab = (index1, index2, index3) => {
  //有值就取index 没值就取默认值
  const currentMenuIndex = menuIndex.value || [0, 0, -1];
  menuIndex.value = [
    index1 !== undefined ? index1 : currentMenuIndex[0],
    index2 !== undefined ? index2 : currentMenuIndex[1],
    index3 !== undefined ? index3 : currentMenuIndex[2],
  ];

  //获取数据
  if(index3 !== undefined){
  }
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
    url: `${apiConfig.baseURL}/api/building/${idStorageInfo.buildingId}/object`, //http://{{host}}:{{port}}/api/building/1959/object
    method: 'GET',
    header: {
      Authorization: `${token}`
    }
  });
  console.log(structureInfoResponse.data.data)
  treeData.value = structureInfoResponse.data.data;
  isLoading.value = false;
})
</script>

<style>
.container{
  width: 100%;
  display: flex;
  flex-direction: column;
  height: 100vh; /* 确保容器有高度 */
}
/*激活后的背景色 */
.active {
  background-color: #FFF;
  color:#0F4687;
  position: relative;
}
/*使用伪元素添加竖线 */
.active::before {
  content: "";                /* 必需属性，定义伪元素的内容 */
  position: absolute;
  top: 50%;                   /* 线的顶部对齐盒子中心 */
  transform: translateY(-50%); /* 将线移动一半 使两者中心对齐 */
  left: 0;
  width: 4rpx;                /* 线宽*/
  height: 48rpx;              /* 线高 - 调整为与容器匹配 */
  background-color: #0F4687;  /* 线色*/
}
/*第三个菜单项激活 文字不变色*/
.active2{
  background-color: #FFF;
  position: relative;
}
.container{
  width: 100%;
  display: flex;
  flex-direction: column;
}
.Title{
  padding: 20rpx 0;
  background-color: #BDCBE0;
  font-size: 20rpx;
  display: flex;
}
.Title button{
  margin-right: 20rpx;
  background-color: #0F4687;
  color: white;
  font-size: 15rpx;
  height: 36rpx;
  line-height: 26rpx;
  padding: 5rpx 10rpx;
  white-space: nowrap; /* 防止文本换行 */
}
.Title span{
  padding-top: 5rpx;
  padding-bottom: 5rpx;
}
.text{
  padding-left: 20rpx;
}
.sidebar{
  height:100%;
  /*菜单项中的元素 横向排列*/
  display: flex;
  flex-direction: row;
  color:#333;
}
.sidebar-level1 {
  width: 140rpx;
  background-color: #f5f5f5;
  font-size: 15rpx;
  white-space:nowrap;/* 强制文本不换行*/
  text-align: center; /* 添加水平居中 */
  color:#333;
  overflow-y: auto; /* 允许滚动 */
}
.sidebar-level2 {
  width: 140rpx;
  font-size: 15rpx;
  background-color: #fafafa;
  text-align: center;
  white-space:normal;/* 允许换行*/
  word-break: break-all;
  overflow-y: auto; /* 允许滚动 */
}
.sidebar-level3 {
  flex: 1; position: relative; /* 为按钮提供定位参考 */
  background-color: #f5f5f5;
  font-size: 20rpx;
  overflow-y: auto; /* 允许滚动 */
}
.fathercontentandbutton{
  position: relative; /* 为按钮提供定位参考 */
  display: flex;           /* 新增：让容器成为flex容器 */
  align-items: stretch;     /* 新增：让子元素拉伸到父容器高度 */
}
.box{
  height: 90rpx; /* 固定高度 */
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 20rpx; /* 为图标预留空间 */
  position: relative; /* 为警告图标提供定位参考 */
}

/* 第一级菜单项的特殊样式 */
.sidebar-level1 .box {
  padding-left: 20rpx; /* 与第二级保持一致 */
}

/* 第一级菜单项文字左移 */
.sidebar-level1 .box {
  transform: translateX(-20rpx);
}
.content{
  display: flex;
  flex-direction: row;
  align-items: center;
  flex: 1;
}
.content-container{
  font-size:15rpx ;
  display:flex;
  flex-direction: column;
  align-items: flex-end;
}
.right{
  display: flex;
  flex-direction: row;
  margin-left:auto;/*优先从右边找位置 */
  margin-right: 16rpx;
}
.warning-icon {
  position: absolute;
  left: 10rpx;
  top: 50%;
  transform: translateY(-50%);
  width: 13rpx;
  height: 13rpx;
}

/* 第三级菜单项的警告图标特殊样式 */
.box3 .warning-icon {
  left: 10rpx;
  transform: translateX(-10rpx) translateY(-7rpx); /* 抵消文字的右移并上移，与文字中心对齐 */
}

/* 第一级菜单项的警告图标左移 */
.sidebar-level1 .warning-icon {
  left: 30rpx;
}
.box{
  height: 90rpx; /* 固定高度 */
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 20rpx; /* 为图标预留空间 */
  position: relative; /* 为警告图标提供定位参考 */
}

/* 第一级菜单项的特殊样式 */
.sidebar-level1 .box {
  padding-left: 20rpx; /* 与第二级保持一致 */
}

/* 第一级菜单项文字左移 */
.sidebar-level1 .box {
  transform: translateX(-20rpx);
}
.box3{
  height:auto;
  padding:22rpx 20rpx;
  border-bottom:1px solid #eee;
  position: relative;
  padding-left: 20rpx; /* 确保与第一级和第二级保持一致 */
  transform: translateX(10rpx); /* 第三级菜单项文字整体右移 */
}
.rightarrow {
  height: 20rpx;
  width: 20rpx;
  align-items: center;/*相对于父容器的交叉轴垂直居中*/
  transform: translate(0, 6rpx); /* 微调箭头的位置 */
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