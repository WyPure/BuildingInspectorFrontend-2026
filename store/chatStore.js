import { defineStore } from 'pinia';
import { watch } from 'vue';

// 尝试从同步存储中加载初始状态
const getInitialState = () => {
  try {
    const savedState = uni.getStorageSync('chatStore');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      // 基本的验证，确保conversations是一个对象
      if (typeof parsed.conversations === 'object' && parsed.conversations !== null) {
        return {
          conversations: parsed.conversations,
          currentChatId: parsed.currentChatId || null,
        };
      }
    }
  } catch (error) {
    console.error('从历史记录中获取聊天消息失败', error);
  }
  // 如果没有保存的状态或解析失败，返回默认初始状态
  return {
    conversations: {},
    currentChatId: null,
  };
};

export const useChatStore = defineStore('chat', {
  state: () => getInitialState(),
  getters: {
    // 获取当前对话的消息列表
    currentMessages: (state) => {
      if (!state.currentChatId || !state.conversations[state.currentChatId]) {
        return [
          {
            id: 'msg_init',
            sender: 'ai',
            text: '你好！我是你的智能助手，有什么可以帮你的吗？',
            timeline: { completed: [], current: null, error: null },
            references: []
          }
        ];
      }
      return state.conversations[state.currentChatId].messages;
    },
    // 获取用于历史记录显示的所有对话列表
    chatHistory: (state) => {
      return Object.values(state.conversations).map(conv => ({
        id: conv.id,
        // 优先使用自定义标题，否则使用第一条用户消息作为标题
        title: conv.title || conv.messages.find(m => m.sender === 'user')?.text.substring(0, 30) || '新对话',
      })).reverse(); // 按时间倒序排列
    },
  },
  actions: {
    // 开始一个新对话
    startNewChat() {
      const chatId = `chat_${Date.now()}`;
      this.conversations[chatId] = {
        id: chatId,
        messages: [
          {
            id: 'msg_init',
            sender: 'ai',
            text: '你好！我是你的智能助手，有什么可以帮你的吗？',
            timeline: { completed: [], current: null, error: null },
            references: []
          }
        ],
        title: null // 初始化自定义标题为null
      };
      this.currentChatId = chatId;
      return chatId;
    },
    // 重命名一个对话
    renameChat({ chatId, newTitle }) {
      if (this.conversations[chatId]) {
        this.conversations[chatId].title = newTitle;
        console.log(`对话 ${chatId} 已被重命名为: ${newTitle}`);
      } else {
        console.warn(`尝试重命名一个不存在的对话: ${chatId}`);
      }
    },
    // 删除一个对话
    deleteChat(chatId) {
      if (!this.conversations[chatId]) {
        console.warn(`删除一个不存在的对话: ${chatId}`);
        return;
      }

      const isCurrent = this.currentChatId === chatId;
      
      // 从 conversations 对象中删除该对话
      delete this.conversations[chatId];

      // 如果删除的是当前正在进行的对话
      if (isCurrent) {
        // 获取剩余的对话ID，并按时间倒序排序（最新的在前）
        const remainingChatIds = Object.keys(this.conversations).sort((a, b) => {
            const timeA = parseInt(a.split('_')[1] || '0');
            const timeB = parseInt(b.split('_')[1] || '0');
            return timeB - timeA;
        });

        // 如果还有其他对话，则切换到最新的一个
        if (remainingChatIds.length > 0) {
          this.currentChatId = remainingChatIds[0];
        } else {
          // 如果没有其他对话了，将 currentChatId 设置为 null
          // 这将导致 getter 返回初始欢迎消息
          this.currentChatId = null;
        }
      }
    },
    // 批量删除对话
    deleteMultipleChats(chatIds) {
      if (!chatIds || chatIds.length === 0) {
        return;
      }

      let isCurrentChatDeleted = false;

      chatIds.forEach(chatId => {
        if (this.conversations[chatId]) {
          if (this.currentChatId === chatId) {
            isCurrentChatDeleted = true;
          }
          delete this.conversations[chatId];
        }
      });

      if (isCurrentChatDeleted) {
        const remainingChatIds = Object.keys(this.conversations).sort((a, b) => {
          const timeA = parseInt(a.split('_')[1] || '0');
          const timeB = parseInt(b.split('_')[1] || '0');
          return timeB - timeA;
        });

        if (remainingChatIds.length > 0) {
          this.currentChatId = remainingChatIds[0];
        } else {
          this.currentChatId = null;
        }
      }
    },
    // 设置当前对话
    setCurrentChat(chatId) {
      if (this.conversations[chatId]) {
        this.currentChatId = chatId;
      }
    },
    // 向当前对话添加消息
    addMessage(message) {
      if (!this.currentChatId) {
        this.startNewChat();
      }
      this.conversations[this.currentChatId].messages.push(message);
    },
    updateLastAiMessage(updater) {
      if (!this.currentChatId) return;
      const messages = this.conversations[this.currentChatId].messages;
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.sender === 'ai') {
        updater(lastMessage);
      }
    },
    // 删除指定消息
    removeMessage(msgId) {
      if (!this.currentChatId) return;
      const messages = this.conversations[this.currentChatId].messages;
      const idx = messages.findIndex(m => m.id === msgId);
      if (idx >= 0) {
        messages.splice(idx, 1);
      }
    },
    // 查找当前对话的最后一条 AI 消息
    findLastAiMessage() {
      if (!this.currentChatId) return null;
      const messages = this.conversations[this.currentChatId].messages;
      return messages.slice().reverse().find(m => m.sender === 'ai');
    },
    // clearMessages is deprecated, use startNewChat instead.
    clearMessages() {
        if (!this.currentChatId) return;
        this.conversations[this.currentChatId].messages = [
            {
                id: 'msg_init',
                sender: 'ai',
                text: '你好！我是你的智能助手，有什么可以帮你的吗？',
                timeline: { completed: [], current: null, error: null },
                references: []
            }
        ];
    }
  },
});

