<template>
  <view>
    <view
      v-if="isExpanded"
      class="backdrop"
      @click.stop="collapseButton"
    ></view>
    <view
      class="chat-agent-button-container"
      :class="{ 'expanded': isExpanded }"
      @click="handleClick"
    >
      <uni-icons type="chat-filled" size="24" color="#FFFFFF"></uni-icons>
      <text v-if="isExpanded" class="button-text">智能助手</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';

const isExpanded = ref(false);
const collapseTimer = ref(null);

const clearCollapseTimer = () => {
  if (collapseTimer.value) {
    clearTimeout(collapseTimer.value);
    collapseTimer.value = null;
  }
};

const collapseButton = () => {
  isExpanded.value = false;
  clearCollapseTimer();
};

const handleClick = () => {
  clearCollapseTimer();

  if (isExpanded.value) {
    uni.navigateTo({
      url: '/pages/ChatBot/ChatBot'
    });
  } else {
    isExpanded.value = true;
    collapseTimer.value = setTimeout(() => {
      isExpanded.value = false;
    }, 2000); 
  }
};


onUnmounted(() => {
  clearCollapseTimer();
});
</script>

<style lang="scss" scoped>
.backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: transparent;
  z-index: 998;
}

.chat-agent-button-container {
  position: fixed;
  bottom: 100px;
  right: -25px;
  width: 50px;
  height: 50px;
  background-color: #2563eb;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 14px 0 rgba(37, 99, 235, 0.3);
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  opacity: 0.5;
  z-index: 999;

  .button-text {
    display: none;
    color: #ffffff;
    font-size: 16rpx;
    margin-left: 8px;
    white-space: nowrap;
  }

  &.expanded {
    right: 20px;
    width: 130px;
    border-radius: 25px;
    opacity: 0.8;

    .button-text {
      display: inline;
    }
  }
}
</style>
