<template>
	<view>

    <view class="part-area">
      <view class="part-area-title">需要说明的事项(含桥梁管养单位的变更情况)</view>
      <view class="part-area-content" > {{data.value || '/'}}</view>
    </view>

	</view>
</template>

<script setup>
import {
  reactive,
  ref
} from 'vue'

/*const data = ref({
  notes: '',//需要说明的事项(含桥梁管养单位的变更情况)
})*/

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
})

</script>

<style scoped>
/* 分孔和结构体系 */
.part-area {
  display: flex;
  flex-direction: column;
  padding: 14rpx 10rpx;
  border-bottom: 1rpx solid #eee;
}

.part-area-title {
  font-size: 16rpx;
  color: #666666;
}

.part-area-content {
  margin-top: 4rpx;
  font-size: 20rpx;
  color: #666666;
}
</style>