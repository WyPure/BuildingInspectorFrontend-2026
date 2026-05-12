<template>
  <view class="container" v-if="visible">
    <!-- 弹窗组件 -->
    <view class="window">
      <!-- 标题栏 -->
      <view class="title">{{ dynamicTitle }}</view>

      <!-- 内容区 -->
      <view class="content">
        {{ dynamicContent }}
      </view>

      <!-- 按钮区域 -->
      <view class="button-container">
        <button class="btn confirm" @tap="handleConfirm">确定</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

// 定义 props
const props = defineProps({
  title: {
    type: String,
    default: "检查更新失败"
  },
  content: {
    type: String,
    default: "当前无网络,无法访问服务器,请在网络环境良好的情况下重试"
  }
})

// 定义 emits
const emit = defineEmits(['confirm'])

// 控制弹窗显示
const visible = ref(false)

// 动态标题和内容
const dynamicTitle = ref(props.title)
const dynamicContent = ref(props.content)

// 显示弹窗的方法
const show = (customTitle, customContent) => {
  // 只有当参数不为空时才更新内容，否则使用默认值
  if (customTitle && customTitle.trim() !== '') {
    dynamicTitle.value = customTitle
  }
  if (customContent && customContent.trim() !== '') {
    dynamicContent.value = customContent
  }
  visible.value = true
}

// 隐藏弹窗的方法
const hide = () => {
  visible.value = false
}

// 确认按钮点击事件
const handleConfirm = () => {
  emit('confirm')
  hide()
}

// 暴露方法给父组件
defineExpose({
  show,
  hide
})
</script>

<style scoped>
/* 容器样式 */
.container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
}

/* 弹窗样式 */
.window {
  width: 426rpx;
  height: 320rpx;
  background-color: #FFFFFF;
  border-radius: 16rpx;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.15);
}

/* 标题栏样式 */
.title {
  height: 70rpx;
  background-color: #BDCBE0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
  color: #0F4687;
  font-weight: bold;
  letter-spacing: 1rpx;
}

/* 内容区域样式 */
.content {
  flex: 1;
  padding: 30rpx;
  font-size: 24rpx;
  color: #333333;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background-color: #f8fafd;
  line-height: 1.6;
}

/* 按钮容器样式 */
.button-container {
  display: flex;
  justify-content: space-around;
  padding: 20rpx;
  background-color: #FFFFFF;
  border-top: 1rpx solid #eeeeee;
}

/* 按钮基础样式 */
.btn {
  width: 160rpx;
  height: 40rpx;
  line-height: 40rpx;
  border-radius: 5rpx;
  font-size: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  border: none;
  margin: 0;
  padding: 0 10rpx;
  box-sizing: border-box;
}


.cancel:active {
  background-color: #f0f7ff;
}

/* 确定按钮样式 */
.confirm {
  background-color: #1677FF;
  color: #FFFFFF;
}

.confirm:active {
  background-color: #0d5fd0;
}
</style>
