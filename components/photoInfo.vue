<template>
  <view class="photo-info-container">
    <view class="photo-info-title">图片备注</view>
    <textarea
      class="photo-info-textarea"
      v-model="currentInput"
      placeholder="请输入备注内容"
      @blur="setInformation"
      :disabled="loading"
    />
  </view>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { getObjectUL } from '../utils/readUL'
import { setObject } from '../utils/writeNew'
import { userStore } from '@/store/index.js'
import { idStore } from '@/store/idStorage'

// --- state ---
const currentInput = ref('')
const loading = ref(false)

const userInfo = userStore()
const idInfo = idStore()

// 获取当前选中的菜单索引
const props = defineProps({
  selectedFirstIndex: {
    type: Number,
    default: 0
  },
  selectedSecondIndex: {
    type: Number,
    default: 0
  },
  photoIndex: {
    type: Number,
    default: 0
  }
})

/**
 * 初始化：
 * 1. 读取本地数据
 * 2. 如果当前选中的二级菜单项没有 information 字段则补上并写回
 * 3. 把当前二级菜单项的 information 显示到 input
 */
const init = async () => {
  console.log('init开始执行，当前索引:', props.selectedFirstIndex, props.selectedSecondIndex, '照片索引:', props.photoIndex);
  loading.value = true
  try {
    // 使用idInfo.buildingId作为TaskBridgeId
    const raw = (await getObjectUL(userInfo.username, idInfo.buildingId)) || {}
    console.log('获取到数据:', raw);
    
    // 确保数据结构存在
    if (!raw.children || !raw.children[props.selectedFirstIndex]) {
      console.error('数据结构不完整，一级菜单不存在');
      loading.value = false
      return
    }
    
    const firstLevelItem = raw.children[props.selectedFirstIndex]
    console.log('一级菜单项:', firstLevelItem);
    
    if (!firstLevelItem.children || !firstLevelItem.children[props.selectedSecondIndex]) {
      console.error('二级菜单项不存在');
      loading.value = false
      return
    }
    
    const secondLevelItem = firstLevelItem.children[props.selectedSecondIndex]
    console.log('二级菜单项:', secondLevelItem);
    
    // 如果二级菜单项没有 information 字段，补上并立即写回
    if (!Object.prototype.hasOwnProperty.call(secondLevelItem, 'information')) {
      console.log('二级菜单项没有information字段，添加默认值');
      secondLevelItem.information = []
      // 确保数组长度足够
      while (secondLevelItem.photo && secondLevelItem.photo.length > secondLevelItem.information.length) {
        secondLevelItem.information.push('请输入图片备注')
      }
      await setObject(userInfo.username, idInfo.buildingId, raw)
    } else if (typeof secondLevelItem.information === 'string') {
      // 兼容处理：如果之前的 information 是字符串，转换为数组
      console.log('将字符串information转换为数组');
      secondLevelItem.information = [secondLevelItem.information]
      await setObject(userInfo.username, idInfo.buildingId, raw)
    }
    
    // 确保information数组长度足够
    if (Array.isArray(secondLevelItem.information)) {
      while (secondLevelItem.photo && secondLevelItem.photo.length > secondLevelItem.information.length) {
        secondLevelItem.information.push('请输入图片备注')
      }
      
      // 显示当前照片索引对应的备注
      if (props.photoIndex < secondLevelItem.information.length) {
        currentInput.value = secondLevelItem.information[props.photoIndex] || ''
      } else {
        // 如果索引超出范围，显示空白
        currentInput.value = ''
      }
    } else {
      currentInput.value = ''
    }
    console.log('设置input值:', currentInput.value, '照片索引:', props.photoIndex);
  } catch (err) {
    console.error('init error:', err)
    uni.showToast({ title: '初始化失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

/**
 * 保存（更新操作）：
 * 在 input 失焦时调用，把最新的 input 写回当前二级菜单项的 information 字段
 */
const setInformation = async () => {
  console.log('setInformation开始执行，当前索引:', props.selectedFirstIndex, props.selectedSecondIndex, '照片索引:', props.photoIndex);
  try {
    // 重新获取最新数据，避免使用旧数据
    const raw = await getObjectUL(userInfo.username, idInfo.buildingId);
    if (!raw) {
      console.error('无法获取数据');
      return;
    }
    
    // 确保数据结构存在
    if (!raw.children || !raw.children[props.selectedFirstIndex]) {
      console.error('数据结构不完整，一级菜单不存在');
      return
    }
    
    const firstLevelItem = raw.children[props.selectedFirstIndex]
    console.log('一级菜单项:', firstLevelItem);
    
    if (!firstLevelItem.children || !firstLevelItem.children[props.selectedSecondIndex]) {
      console.error('二级菜单项不存在');
      return
    }
    
    const secondLevelItem = firstLevelItem.children[props.selectedSecondIndex]
    console.log('要保存的二级菜单项:', secondLevelItem);
    console.log('当前input值:', currentInput.value);
    console.log('原information值:', secondLevelItem.information);
    
    // 确保 information 是数组
    if (!Array.isArray(secondLevelItem.information)) {
      secondLevelItem.information = [];
    }
    
    // 确保数组长度足够
    while (props.photoIndex >= secondLevelItem.information.length) {
      secondLevelItem.information.push('');
    }
    
    // 没有变化则不用写
    if (secondLevelItem.information[props.photoIndex] === currentInput.value) {
      console.log('值未变化，不需要保存');
      return;
    }
    
    // 更新二级菜单项的 information 字段对应索引的元素
    secondLevelItem.information[props.photoIndex] = currentInput.value
    console.log('已更新information字段，准备保存，照片索引:', props.photoIndex);
    
    // 保存整个数据结构
    console.log('保存数据前检查:', JSON.stringify(raw.children[props.selectedFirstIndex].children[props.selectedSecondIndex].information));
    const result = await setObject(userInfo.username, idInfo.buildingId, raw)
    console.log('保存结果:', result);
    
    // 再次检查保存是否成功
    const checkData = await getObjectUL(userInfo.username, idInfo.buildingId);
    if (checkData) {
      console.log('保存后检查:',
        '二级菜单information:', checkData.children[props.selectedFirstIndex]?.children[props.selectedSecondIndex]?.information
      );
    }
    
    uni.showToast({ title: '已保存', icon: 'none' })
  } catch (err) {
    console.error('setInformation error:', err)
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

// 监听索引变化，重新加载数据
watch([() => props.selectedFirstIndex, () => props.selectedSecondIndex, () => props.photoIndex], async ([newFirstIndex, newSecondIndex, newPhotoIndex], [oldFirstIndex, oldSecondIndex, oldPhotoIndex]) => {
  console.log('索引变化:', {
    oldFirstIndex, 
    newFirstIndex, 
    oldSecondIndex, 
    newSecondIndex,
    oldPhotoIndex,
    newPhotoIndex
  });
  
  if (newFirstIndex !== oldFirstIndex || newSecondIndex !== oldSecondIndex || newPhotoIndex !== oldPhotoIndex) {
    console.log('索引发生变化，重新加载数据');
    await init();
  }
}, { immediate: true, deep: true })

// uni-app 生命周期
onMounted(() => {
  console.log('photoInfo组件已挂载，初始化数据');
  // 延迟执行init，确保props已经正确传递
  setTimeout(() => {
    init();
  }, 100);
  
  // 监听照片更新事件
  uni.$on('photoInfoUpdate', () => {
    console.log('收到photoInfoUpdate事件，重新初始化数据');
    init();
  });
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  uni.$off('photoInfoUpdate');
})
</script>

<style scoped>
.photo-info-container {
  width: 100%;
  max-width: 750rpx; /* 增加最大宽度 */
  margin: 0 auto; /* 居中显示 */
  background-color: #f9f9f9;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.1);
  padding: 20rpx;
  box-sizing: border-box;
}

.photo-info-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 15rpx;
}

.photo-info-textarea {
  width: 100%;
  height: 200rpx;
  padding: 15rpx;
  border: 1rpx solid #ddd;
  background-color: #fff;
  font-size: 28rpx;
  color: #333;
  border-radius: 8rpx;
  box-sizing: border-box;
}

.photo-info-textarea:focus {
  border-color: #409eff;
}
</style>