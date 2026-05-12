import App from './App'

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'


Vue.config.productionTip = false
App.mpType = 'app'


const app = new Vue({
	...App
})
app.$mount()
// #endif

// #ifdef VUE3
import {
	createSSRApp
} from 'vue'
import {
	createPinia
} from 'pinia'
import './style/base.css'
import { useChatStore } from './store/chatStore.js';
// #ifdef APP-PLUS
import { initBridgeCatalogDb } from './utils/diseaseHelp.js';
// #endif


export function createApp() {
	const app = createSSRApp(App)
	const pinia = createPinia()

	app.use(pinia)

	// App 端：初始化桥型目录数据库
	// #ifdef APP-PLUS
	initBridgeCatalogDb().then(() => {
		console.log('桥型/标度预置库已复制并就绪');
	}).catch((e) => {
		console.error('桥型目录库初始化失败:', e);
	});
	// #endif

	// 在 app 创建之后，但在挂载之前，设置持久化
	const chatStore = useChatStore(pinia);
	chatStore.$subscribe((mutation, state) => {
		const stateToSave = {
			conversations: state.conversations,
			currentChatId: state.currentChatId,
		};
		try {
			uni.setStorageSync('chatStore', JSON.stringify(stateToSave));
		} catch (error) {
			console.error('聊天机器人持久化失败', error);
		}
	});

	return {
		app
	}
}
// #endif