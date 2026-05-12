<template>
  <view class="status-timeline-container" v-if="timeline.completed.length > 0 || timeline.current || timeline.error">
    <view class="status-timeline-header">执行过程</view>
    <view class="timeline">
      <view v-for="(step, index) in timeline.completed" :key="index" class="timeline-item completed">
        <view class="timeline-item-header">
          <text class="timeline-dot"></text>
          <text class="step-name">{{ step.name }}</text>
          <text class="status-timer">{{ step.duration }}</text>
          <text class="status-label">已完成</text>
        </view>
        <view class="tool-calls-details" v-if="step.toolCalls && step.toolCalls.length > 0">
          <view v-for="(tool, tIndex) in step.toolCalls" :key="tIndex" class="tool-call-item">
            <uni-icons type="gear" size="14" color="#6b7280"></uni-icons>
            <text>{{ tool }}</text>
          </view>
        </view>
      </view>

      <view v-if="timeline.current" class="timeline-item current">
        <view class="timeline-item-header">
          <text class="timeline-dot"></text>
          <text class="step-name">{{ timeline.current.name }}...</text>
          <text class="status-timer current-timer">{{ timeline.current.elapsed }}s</text>
        </view>
        <view class="tool-calls-details" v-if="timeline.current.toolCalls && timeline.current.toolCalls.length > 0">
          <view v-for="(tool, tIndex) in timeline.current.toolCalls" :key="tIndex" class="tool-call-item">
            <uni-icons type="gear" size="14" color="#6b7280"></uni-icons>
            <text>{{ tool }}</text>
          </view>
        </view>
      </view>

      <view v-if="timeline.error" class="timeline-item error">
        <view class="timeline-item-header">
          <text class="timeline-dot"></text>
          <text class="step-name">{{ timeline.error }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  timeline: {
    type: Object,
    required: true
  }
});
</script>

<style lang="scss" scoped>
.status-timeline-container {
  padding: 12px 12px 0;
  font-size: 14px;
  margin-bottom: 8px;
}
.status-timeline-header {
  font-weight: 600;
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
  color: #374151;
}
.timeline {
  position: relative;
  padding-left: 24px;
  &::before {
    content: '';
    position: absolute;
    left: 11px;
    top: 8px;
    bottom: 8px;
    width: 2px;
    background: #e5e7eb;
  }
}
.timeline-item {
  position: relative;
  margin-bottom: 12px;
  &:last-child {
    margin-bottom: 0;
  }
}
.timeline-dot {
  content: '';
  position: absolute;
  left: -19px;
  top: 5px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid #ffffff;
}
.timeline-item-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}
.step-name {
  margin-right: 8px;
}
.status-timer {
  font-size: 12px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  margin-right: 8px;
}
.status-label {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}
.completed {
  color: #6b7280;
  opacity: 0.9;
  .timeline-dot {
    background: #22c55e;
    box-shadow: 0 0 0 1px #22c55e;
  }
  .status-timer {
    color: #059669;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
  }
  .status-label {
    background: #dcfce7;
    color: #166534;
    border: 1px solid #bbf7d0;
  }
}
.current {
  color: #2563eb;
  font-weight: 500;
  .timeline-dot {
    background: #2563eb;
    box-shadow: 0 0 0 1px #2563eb;
  }
  .current-timer {
    color: #2563eb;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
  }
}
.error {
  color: #dc2626;
  font-weight: 500;
  .timeline-dot {
    background: #ef4444;
    box-shadow: 0 0 0 1px #ef4444;
  }
}
.tool-calls-details {
  margin-top: 6px; 
  padding-left: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.tool-call-item {
  font-size: 12px;
  color: #6b7280;
  background-color: #f8fafc;
  padding: 4px 10px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  margin-top: 6px;

  uni-icons {
    margin-right: 6px;
  }
}
</style>