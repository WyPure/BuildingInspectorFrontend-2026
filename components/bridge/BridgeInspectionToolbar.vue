<template>
	<view class="inspection-toolbar-row" :style="cssVars">
		<view class="inspection-toolbar-inner">
			<view class="inspection-sub-tabs">
				<view v-for="(tab, index) in inspectionSubTabs" :key="index"
					:class="['inspection-sub-tab', activeSubTab === index ? 'active' : '']"
					@click="$emit('switch-sub-tab', index)">
					{{ tab.name }}
				</view>
			</view>
			<view class="inspection-toolbar-tools">
				<view v-if="awaitingBridgeSpanRange" class="inspection-toolbar-tools-right">
					<button type="default" plain class="bd-setting-tool-btn"
						hover-class="bd-setting-tool-btn-hover" @tap.stop="$emit('configure-bridge-span')">
						{{ BRIDGE_SPAN_BUTTON_TEXT }}
					</button>
				</view>
				<template v-else>
					<view v-if="activeSubTab === 0 || activeSubTab === 1"
						class="inspection-toolbar-tools-right"
						:class="{ 'inspection-toolbar-tools-right--history': activeSubTab === 1 }">
						<view class="toolbar-search-host">
							<uni-search-bar :modelValue="searchText" class="proto-uni-search" placeholder="搜索词"
								clearButton="none" cancelButton="none" @update:modelValue="onSearchUpdate"
								@confirm="$emit('search-confirm')" />
						</view>
						<button v-if="activeSubTab === 0" type="default" plain class="bd-setting-tool-btn"
							:class="{ 'bd-setting-tool-btn--disabled': !bridgeSpanReady }" :disabled="!bridgeSpanReady"
							hover-class="bd-setting-tool-btn-hover" @tap.stop="$emit('add-disease')">
							新增病害
						</button>
						<view v-if="activeSubTab === 1" class="history-toolbar-actions">
							<button v-if="!historySelectModeActive" type="default" plain class="bd-setting-tool-btn"
								hover-class="bd-setting-tool-btn-hover" @tap.stop="$emit('history-select')">
								选择
							</button>
							<template v-else>
								<button type="default" plain
									class="bd-setting-tool-btn history-toolbar-btn history-toolbar-btn--copy"
									hover-class="bd-setting-tool-btn-hover" @tap.stop="$emit('history-copy')">
									复制为新病害
								</button>
								<button type="default" plain class="bd-setting-tool-btn history-toolbar-btn history-toolbar-btn--cancel"
									hover-class="bd-setting-tool-btn-hover" @tap.stop="$emit('history-cancel')">
									取消
								</button>
							</template>
						</view>
					</view>
					<view v-else-if="activeSubTab === 2" class="inspection-toolbar-tools-right">
						<button type="default" plain class="bd-setting-tool-btn"
							:class="{ 'bd-setting-tool-btn--disabled': !bridgeSpanReady }" :disabled="!bridgeSpanReady"
							hover-class="bd-setting-tool-btn-hover" @tap.stop="$emit('configure-bridge-span')">
							{{ BRIDGE_SPAN_BUTTON_TEXT }}
						</button>
					</view>
				</template>
			</view>
		</view>
	</view>
</template>

<script setup>
	import {
		computed
	} from 'vue';
	import {
		BRIDGE_SPAN_BUTTON_TEXT
	} from '@/pages/bridge-disease/bridgeDiseasePageConstants';

	const props = defineProps({
		inspectionSubTabs: {
			type: Array,
			default: () => []
		},
		activeSubTab: {
			type: Number,
			default: 0
		},
		searchText: {
			type: String,
			default: ''
		},
		bridgeSpanReady: {
			type: Boolean,
			default: false
		},
		historySelectModeActive: {
			type: Boolean,
			default: false
		},
		toolbarHeightRpx: {
			type: Number,
			default: 40
		},
		edgeRightGapRpx: {
			type: Number,
			default: 16
		},
		/** 未配置桥跨：隐藏搜索/新增病害/历史与复制工具，右侧仅「新增桥跨」 */
		awaitingBridgeSpanRange: {
			type: Boolean,
			default: false
		}
	});

	const emit = defineEmits([
		'update:searchText',
		'switch-sub-tab',
		'search-confirm',
		'add-disease',
		'history-select',
		'history-copy',
		'history-cancel',
		'configure-bridge-span'
	]);

	const cssVars = computed(() => ({
		'--bd-toolbar-h': `${props.toolbarHeightRpx}rpx`,
		'--bd-edge-right-gap': `${props.edgeRightGapRpx}rpx`
	}));

	const onSearchUpdate = (v) => {
		emit('update:searchText', v == null ? '' : String(v));
	};
</script>

<style scoped>
	.inspection-toolbar-row {
		flex-shrink: 0;
		background-color: #bdcbe0;
		border-bottom: 1rpx solid #e2e8f0;
	}

	.inspection-toolbar-inner {
		display: flex;
		flex-direction: row;
		align-items: center;
		flex-wrap: nowrap;
		width: 100%;
		min-height: var(--bd-toolbar-h, 40rpx);
		box-sizing: border-box;
	}

	.inspection-sub-tabs {
		display: flex;
		flex-direction: row;
		align-items: center;
		flex-shrink: 0;
		padding: 0 2rpx 0 0;
		gap: 10rpx;
	}

	.inspection-sub-tab {
		padding: 10rpx 6rpx;
		font-size: 20rpx;
		color: #333333;
		white-space: nowrap;
	}

	.inspection-sub-tab.active {
		color: #0F4687;
		font-weight: 600;
		border-bottom: 4rpx solid #0F4687;
		margin-bottom: -2rpx;
	}

	.inspection-toolbar-tools {
		flex: 1;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: flex-start;
		min-width: 0;
		padding: 6rpx var(--bd-edge-right-gap, 16rpx) 6rpx 4rpx;
		gap: 8rpx;
		box-sizing: border-box;
	}

	.inspection-toolbar-tools-right {
		margin-left: auto;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 8rpx;
		flex-shrink: 1;
		min-width: 0;
		overflow: visible;
	}

	/* 历史病害：双按钮 + 搜索并排，收窄搜索区避免「取消」被裁切 */
	.inspection-toolbar-tools-right--history .toolbar-search-host {
		flex: 0 0 150rpx;
		width: 150rpx;
		min-width: 100rpx;
		max-width: 150rpx;
	}

	.proto-uni-search {
		width: 100%;
		height: 100%;
	}

	/*
	 * App 端 webview 会给 button 强加 min-height；仅用 App.vue 仍可能被盖住。
	 * 与 SystemSetting .profile-btn 同数值，在此用父级前缀 + !important 压死（含 plain 镂空态）。
	 */
	.inspection-toolbar-row button.bd-setting-tool-btn {
		flex-shrink: 0;
		height: 40rpx !important;
		min-height: 40rpx !important;
		max-height: 40rpx !important;
		line-height: 40rpx !important;
		padding: 0 10rpx !important;
		margin: 0 !important;
		font-size: 16rpx !important;
		color: #fff !important;
		background: #0f4687 !important;
		border-radius: 5rpx !important;
		border: none !important;
		box-sizing: border-box !important;
		display: flex !important;
		align-items: center !important;
		justify-content: center !important;
		-webkit-appearance: none !important;
		appearance: none !important;
	}

	.inspection-toolbar-row button.bd-setting-tool-btn::after {
		border: none !important;
		border-radius: 5rpx !important;
	}

	.inspection-toolbar-row button.bd-setting-tool-btn.bd-setting-tool-btn--disabled,
	.inspection-toolbar-row button.bd-setting-tool-btn[disabled] {
		background-color: #c5c5c5 !important;
		color: #fff !important;
		opacity: 1 !important;
	}

	.inspection-toolbar-row button.bd-setting-tool-btn.bd-setting-tool-btn--mini {
		min-width: 132rpx !important;
	}

	.toolbar-search-host {
		flex: 0 0 218rpx;
		width: 218rpx;
		min-width: 140rpx;
		max-width: 218rpx;
		height: var(--bd-toolbar-h, 40rpx);
		display: flex;
		align-items: center;
	}

	.toolbar-search-host :deep(.uni-searchbar) {
		padding: 0 !important;
		width: 100%;
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		box-sizing: border-box;
	}

	.toolbar-search-host :deep(.uni-searchbar__box) {
		width: 100%;
		height: var(--bd-toolbar-h, 40rpx) !important;
		min-height: var(--bd-toolbar-h, 40rpx) !important;
		max-height: var(--bd-toolbar-h, 40rpx) !important;
		box-sizing: border-box !important;
		flex: 1;
		min-width: 0;
		padding-top: 0 !important;
		padding-bottom: 0 !important;
	}

	.toolbar-search-host :deep(.uni-searchbar__box-search-input) {
		flex: 1;
		min-width: 0;
		height: var(--bd-toolbar-h, 40rpx);
		line-height: var(--bd-toolbar-h, 40rpx);
		font-size: 20rpx;
		min-height: 0;
	}

	.toolbar-search-host :deep(.uni-searchbar__text-placeholder) {
		flex: 1;
		min-width: 0;
		height: 100%;
		display: flex;
		align-items: center;
		line-height: var(--bd-toolbar-h, 40rpx);
		font-size: 20rpx;
	}

	.history-toolbar-actions {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		align-items: center;
		flex-shrink: 1;
		min-width: 0;
		gap: 6rpx;
		overflow: visible;
	}

	/* 复制可压缩省略；取消按字宽、禁止再被 flex 挤没 */
	.inspection-toolbar-row button.history-toolbar-btn--copy {
		flex: 1;
		min-width: 0 !important;
		max-width: 200rpx;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.inspection-toolbar-row button.history-toolbar-btn--cancel {
		flex-shrink: 0 !important;
		min-width: 0 !important;
		width: auto;
		max-width: none;
		padding: 0 12rpx !important;
	}
</style>
