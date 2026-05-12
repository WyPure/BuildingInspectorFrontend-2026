<template>
  <view class="message-item" :class="props.message.sender">
    <view class="avatar">
      <uni-icons :type="props.message.sender === 'user' ? 'person-filled' : 'staff-filled'" size="22"
                 color="#FFFFFF"></uni-icons>
    </view>
    <view class="content-container">
      <view class="content">
        <template v-if="props.message.sender === 'ai'">
          <StatusTimeline :timeline="props.message.timeline"/>
        </template>

        <view class="text-content">
          <zero-markdown-view v-if="props.message.sender === 'ai'" :markdown="props.message.text || ''"
                              :aiMode="true"
                style="padding: 0 4px;"
                />
          <text v-else selectable="true">{{ props.message.text }}</text>
        </view>

        <template v-if="props.message.sender === 'ai'">
          <KnowledgeSources :sources="props.message.references"/>
        </template>
        <!-- 重试按钮，仅当 AI 消息是最后一个且发生错误时显示 -->
        <view v-if="props.message.sender === 'ai' && props.isLastAi && props.message.timeline.error && !props.message.timeline.current" class="retry-button-container">
          <button class="retry-button" @click="handleRetry">重试</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import StatusTimeline from './StatusTimeline.vue';
import KnowledgeSources from './KnowledgeSources.vue';

const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  isLastAi: {
    type: Boolean,
    default: false
  }
});
const emit = defineEmits(['retry']);
const handleRetry = () => {
  console.log("重试按钮被点击，消息ID:", props.message.id);
  emit('retry', props.message.id);
};
</script>

<style lang="scss" scoped>
.message-item {
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  margin-bottom: 16px;
  width: 100%;
  padding: 8px;

  &.user {
    flex-direction: row-reverse;
  }

  &.ai {
    align-items: flex-start;

    .text-content {
      padding: 0;
    }
  }
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  margin: 10px 2px;
  background-color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-weight: 600;
}

.content-container {
  max-width: 100%;
  flex-shrink: 1;
  margin-top: 8px;
}

.content {
  border-radius: 12px;
  word-wrap: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  background: #ffffff;
  color: #111827;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.text-content {
  padding: 8px 12px;
  font-size: 16px;
  line-height: 1.2;
  word-wrap: break-word;
}
// 重试按钮样式
.retry-button-container {
  padding: 4px;
  text-align: right;
}
.retry-button {
  background-color: transparent;
  border: none;
  color: #2563eb;
  font-size: 16rpx;
  cursor: pointer;
}
</style>