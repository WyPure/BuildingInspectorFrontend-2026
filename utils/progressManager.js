// 全局进度条管理器
// 用于管理下载进度条的唯一性，确保只有一个活跃的进度条

import { ref } from 'vue';

// 全局活跃的进度条ID
const globalActiveProgressId = ref(null);

// 设置活跃的进度条ID
export function setActiveProgressId(id) {
  console.log('设置全局活跃进度条ID:', id, '(之前的ID:', globalActiveProgressId.value, ')');
  globalActiveProgressId.value = id;
}

// 获取当前活跃的进度条ID
export function getActiveProgressId() {
  return globalActiveProgressId.value;
}

// 清理活跃的进度条ID（只有当前ID匹配时才清理）
export function clearActiveProgressId(id) {
  if (globalActiveProgressId.value === id) {
    console.log('清理全局活跃进度条ID:', id);
    globalActiveProgressId.value = null;
    return true;
  } else {
    console.log('尝试清理进度条ID失败，当前活跃ID:', globalActiveProgressId.value, '尝试清理的ID:', id);
    return false;
  }
}

// 检查指定ID是否是当前活跃的进度条
export function isActiveProgressId(id) {
  return globalActiveProgressId.value === id;
}

// 强制清理所有进度条状态（用于紧急情况）
export function forceCleanup() {
  console.log('强制清理所有进度条状态');
  globalActiveProgressId.value = null;
}
