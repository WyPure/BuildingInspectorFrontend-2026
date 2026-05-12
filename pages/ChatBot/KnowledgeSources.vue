<template>
  <view class="knowledge-sources-container" v-if="sources && sources.length > 0">
    <view class="knowledge-sources-header">
      <uni-icons type="lightbulb-filled" size="14" color="#d1d5db"></uni-icons>
      <text>知识来源:</text>
    </view>
    <view class="knowledge-sources-list">
      <view v-for="(source, index) in sources" :key="index" class="knowledge-source-card">
        {{ source }}
      </view>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  sources: {
    type: Array,
    default: () => []
  }
});
</script>

<style lang="scss" scoped>
.knowledge-sources-container {
  margin-top: 8px;
  padding: 8px 12px;
  border-top: 1px solid #f3f4f6;
  line-height: 1.4;
}
.knowledge-sources-header {
  display: inline;
  font-weight: 400;
  font-size: 14px;
  color: #9ca3af;
  margin-right: 8px;

  uni-icons {
    margin-right: 4px;
  }
}
.knowledge-sources-list {
  display: inline;
}
.knowledge-source-card {
  display: inline-block;
  border: 1px solid #d1d5db;
  padding: 4px 8px;
  margin: 2px 4px;
  border-radius: 8px;
  color: #6b7280;
  font-size: 12px;
  line-height: inherit;
  white-space: nowrap;
}
</style>