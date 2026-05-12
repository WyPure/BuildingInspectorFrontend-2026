<template>
  <view class="custom-switch" :class="{ 'is-checked': modelValue }" @click="toggle">
    <view class="switch-track" :style="{ backgroundColor: modelValue ? activeColor : inactiveColor }">
      <view class="switch-thumb" :style="{ transform: modelValue ? 'translateX(100%)' : 'translateX(0)' }"></view>
    </view>
  </view>
</template>

<script setup>

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  activeColor: {
    type: String,
    default: '#409EFF'
  },
  inactiveColor: {
    type: String,
    default: '#F56C6C'
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

const toggle = () => {
  emit('update:modelValue', !props.modelValue);
  emit('change', !props.modelValue);
};
</script>

<style scoped>
.custom-switch {
  display: inline-block;
  position: relative;
  width: 60rpx;
  height: 30rpx;
  cursor: pointer;
}

.switch-track {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 15rpx;
  transition: background-color 0.3s;
}

.switch-thumb {
  position: absolute;
  top: 2rpx;
  left: 2rpx;
  width: 26rpx;
  height: 26rpx;
  border-radius: 50%;
  background-color: #fff;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
  transition: transform 0.3s;
}
</style> 