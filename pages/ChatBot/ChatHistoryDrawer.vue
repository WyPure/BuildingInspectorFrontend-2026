<template>
  <view class="chat-history-drawer">
    <view class="drawer-header">
      <text class="drawer-title">对话历史</text>
      <view class="header-actions">
        <button v-if="!isEditing" class="edit-button" @click="toggleEditMode">编辑</button>
        <button v-if="isEditing" class="edit-button" @click="cancelEditMode">取消</button>
      </view>
    </view>
    <scroll-view scroll-y class="history-list">
      <view
          v-for="chat in history"
          :key="chat.id"
          class="history-item"
          :class="{ 'active': chat.id === currentChatId && !isEditing }"
          @click="handleItemClick(chat.id)"
      >
        <view v-if="isEditing" class="checkbox-container" @click.stop="toggleSelection(chat.id)">
          <view class="checkbox" :class="{ 'checked': selectedChats.includes(chat.id) }"></view>
        </view>
        <view class="history-item-content">
          <text class="history-title">{{ chat.title }}</text>
        </view>
        <view v-if="!isEditing" class="action-buttons">
          <view class="action-button" @click.stop="promptRename(chat.id, chat.title)">
            <uni-icons type="compose" size="16" color="#6b7280"></uni-icons>
          </view>
          <view class="action-button" @click.stop="confirmDelete(chat.id)">
            <uni-icons type="trash" size="16" color="#6b7280"></uni-icons>
          </view>
        </view>
      </view>
    </scroll-view>
    <view v-if="isEditing" class="drawer-footer">
      <button class="delete-selected-button" :disabled="selectedChats.length === 0" @click="confirmDeleteSelected">
        删除已选 ({{ selectedChats.length }})
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useChatStore } from '../../store/chatStore';

const chatStore = useChatStore();

const history = computed(() => chatStore.chatHistory);
const currentChatId = computed(() => chatStore.currentChatId);
const isEditing = ref(false);
const selectedChats = ref([]);

const emit = defineEmits(['switchChat', 'requestSwitchChat']);

const toggleEditMode = () => {
  isEditing.value = true;
};

const cancelEditMode = () => {
  isEditing.value = false;
  selectedChats.value = [];
};

const handleItemClick = (chatId) => {
  if (isEditing.value) {
    toggleSelection(chatId);
  } else {
    emit('requestSwitchChat', chatId);
  }
};

const toggleSelection = (chatId) => {
  const index = selectedChats.value.indexOf(chatId);
  if (index > -1) {
    selectedChats.value.splice(index, 1);
  } else {
    selectedChats.value.push(chatId);
  }
};

const promptRename = (chatId, currentTitle) => {
  uni.showModal({
    title: '重命名对话',
    content: '请输入新的对话标题',
    editable: true,
    placeholderText: currentTitle,
    success: (res) => {
      if (res.confirm && res.content) {
        chatStore.renameChat({ chatId, newTitle: res.content });
      }
    }
  });
};

const confirmDelete = (chatId) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这个对话吗？此操作无法撤销。',
    success: (res) => {
      if (res.confirm) {
        chatStore.deleteChat(chatId);
      }
    },
  });
};

const confirmDeleteSelected = () => {
  if (selectedChats.value.length === 0) return;
  uni.showModal({
    title: '确认删除',
    content: `确定要删除这 ${selectedChats.value.length} 个对话吗？此操作无法撤销。`,
    success: (res) => {
      if (res.confirm) {
        chatStore.deleteMultipleChats(selectedChats.value);
        cancelEditMode();
      }
    },
  });
};
</script>

<style lang="scss" scoped>
.chat-history-drawer {
  width: 280px;
  height: 100%;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 15px 10px;
  border-bottom: 1px solid #f0f0f0;
  .drawer-title {
    font-size: 18px;
    font-weight: bold;
    color: #333;
  }
  .edit-button {
    font-size: 16rpx;
    color: #007aff;
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    line-height: 1;
    &:after {
      display: none;
    }
  }
}

.history-list {
  flex: 1;
  min-height: 0;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 0 0 15px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
  cursor: pointer;

  &:hover {
    background-color: #f7f7f7;
  }

  &.active {
    background-color: #e6f7ff;
    border-right: 3px solid #1890ff;
    padding-right: 0;
  }
}

.checkbox-container {
  padding: 12px 10px 12px 0;
}

.checkbox {
  width: 18px;
  height: 18px;
  border: 1px solid #ccc;
  border-radius: 50%;
  &.checked {
    background-color: #007aff;
    border-color: #007aff;
  }
}

.history-item-content {
  flex-grow: 1;
  padding: 12px 0;
  overflow: hidden;
}

.history-title {
  font-size: 14px;
  color: #555;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.action-buttons {
  display: flex;
  flex-shrink: 0;
}

.action-button {
  padding: 12px 10px;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
}

.drawer-footer {
  padding: 10px 15px;
  border-top: 1px solid #f0f0f0;
  .delete-selected-button {
    width: 100%;
    background-color: #ff3b30;
    color: white;
    font-size: 16rpx;
    &[disabled] {
      background-color: #ccc;
      color: #999;
    }
  }
}
</style>
