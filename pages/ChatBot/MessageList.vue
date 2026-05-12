<template>
  <view class="message-list-component-wrapper">
    <scroll-view
        class="message-list-container"
        scroll-y="true"
        :scroll-with-animation="useAnimation"
        :scroll-animation-duration="200"
        :scroll-into-view="scrollTargetId"
        @scroll="handleScroll"
    >
      <view v-for="msg in props.messages" :key="msg.id" :id="msg.id">
        <MessageItem :message="msg" :is-last-ai="msg.id===lastAiId" @retry="handleItemRetry" />
      </view>
      <view id="scroll-bottom-anchor" style="height: 1px;"></view>
    </scroll-view>

    <view class="scroll-to-bottom-container" v-if="props.showScrollButton">
      <button class="scroll-to-bottom-button" @click="requestScrollToBottom">
        <uni-icons type="arrow-down" color="#2563eb" size="16"></uni-icons>
        <text>回到最新</text>
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, nextTick, onMounted, getCurrentInstance, computed } from 'vue';
import MessageItem from './MessageItem.vue';

const props = defineProps({
  messages: {
    type: Array,
    required: true
  },
  showScrollButton: {
    type: Boolean,
    default: false
  }
});
// 计算最后一个 AI 消息的 id
const lastAiId = computed(() => {
  const list = props.messages;
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].sender === 'ai') {
      return list[i].id;
    }
  }
  return null;
});

const emit = defineEmits(['onScrollStateChange', 'requestScroll', 'retry']);

const useAnimation = ref(false);
const scrollTargetId = ref('scroll-bottom-anchor');
const componentInstance = getCurrentInstance();
let viewHeight = 0;
let isProgrammaticScroll = false;
let scrollTimeout = null;

onMounted(() => {
  uni.createSelectorQuery().in(componentInstance).select('.message-list-container').boundingClientRect(data => {
    if (data) {
      viewHeight = data.height;
    }
  }).exec();
});

const handleScroll = (event) => {
  if (isProgrammaticScroll) {
    return;
  }
  const { scrollTop, scrollHeight } = event.detail;
  const SCROLL_THRESHOLD = viewHeight / 2;
  const isFarFromBottom = scrollHeight - scrollTop - viewHeight > SCROLL_THRESHOLD;

  emit('onScrollStateChange', { isFar: isFarFromBottom });
};

const requestScrollToBottom = () => {
  emit('requestScroll');
}

const scrollToBottom = (options = { animated: false }) => {
  useAnimation.value = options.animated;
  isProgrammaticScroll = true;
  scrollTargetId.value = null;
  nextTick(() => {
    scrollTargetId.value = 'scroll-bottom-anchor';

    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isProgrammaticScroll = false;
    }, 300);
  });
};

// 处理从消息项冒泡的重试事件
const handleItemRetry = (msgId) => {
  console.log("MessageList 收到重试事件:", msgId);
  emit('retry', msgId);
};

defineExpose({
  scrollToBottom
});

</script>

<style lang="scss" scoped>
.message-list-component-wrapper {
  position: relative;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.message-list-container {
  height: 100%;
  padding: 0 8px;
  background: #ffffff;
  box-sizing: border-box;
}


.scroll-to-bottom-container {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.scroll-to-bottom-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 14px;
  height: 32px;
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease-in-out;

  &:after {
    border: none;
  }

  uni-icons {
    margin-right: 4px;
  }

  text {
    color: #2563eb;
    font-size: 16rpx;
    font-weight: 500;
  }
}
</style>