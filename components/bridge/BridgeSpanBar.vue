<template>
	<!-- 未配置桥跨：提示条 -->
	<view v-if="mode === 'notice'" class="span-notice-bar" :style="cssVars">
		<view class="span-notice-text-wrap">
			<text class="span-notice-text">{{ noticeText }}</text>
		</view>
		<button type="default" plain class="bd-setting-tool-btn" hover-class="bd-setting-tool-btn-hover"
			@tap.stop="$emit('notice-configure')">{{ noticeButtonText }}</button>
	</view>
	<!-- 已配置：跨号 pills -->
	<view v-else class="span-scroll-bar" :style="cssVars">
		<scroll-view class="span-scroll-view" scroll-x="true" :show-scrollbar="false" :enable-flex="true">
			<view class="span-scroll-list">
				<view v-for="(spanNo, idx) in bridgeSpanItems" :key="spanNo"
					:class="['span-pill', idx === bridgeSpanSelectedIndex ? 'active' : '']"
					@tap.stop="$emit('select-span', idx)">
					第{{ spanNo }}跨
					<image v-if="badgeFor(spanNo) === 'red'" src="/static/image/red.png" class="span-pill-badge"
						mode="aspectFit" />
					<image v-else-if="badgeFor(spanNo) === 'yellow'" src="/static/image/yellow.png"
						class="span-pill-badge" mode="aspectFit" />
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
	import {
		computed
	} from 'vue';

	const props = defineProps({
		/** 'notice' | 'pills' */
		mode: {
			type: String,
			default: 'notice'
		},
		noticeText: {
			type: String,
			default: ''
		},
		noticeButtonText: {
			type: String,
			default: ''
		},
		bridgeSpanItems: {
			type: Array,
			default: () => []
		},
		bridgeSpanSelectedIndex: {
			type: Number,
			default: 0
		},
		/** { [spanNo: string|number]: 'red' | 'yellow' | '' } */
		spanBadgeMap: {
			type: Object,
			default: () => ({})
		},
		toolbarHeightRpx: {
			type: Number,
			default: 40
		},
		edgeRightGapRpx: {
			type: Number,
			default: 16
		}
	});

	defineEmits(['notice-configure', 'select-span']);

	const cssVars = computed(() => ({
		'--bd-toolbar-h': `${props.toolbarHeightRpx}rpx`,
		'--bd-edge-right-gap': `${props.edgeRightGapRpx}rpx`
	}));

	const badgeFor = (spanNo) => {
		const m = props.spanBadgeMap || {};
		return m[spanNo] || m[String(spanNo)] || '';
	};
</script>

<style scoped>
	/* 与 BridgeInspectionToolbar.inspection-toolbar-tools 同边距，保证「桥跨数量」与「新增病害」右缘对齐 */
	.span-notice-bar {
		display: flex;
		align-items: center;
		gap: 8rpx;
		padding: 6rpx var(--bd-edge-right-gap, 16rpx) 6rpx 4rpx;
		min-height: var(--bd-toolbar-h, 40rpx);
		box-sizing: border-box;
		background-color: #bdcbe0;
		flex-shrink: 0;
		position: relative;
		z-index: 2;
	}

	.span-notice-text-wrap {
		flex: 1;
		min-width: 0;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.span-notice-text {
		width: 100%;
		text-align: center;
		font-size: 22rpx;
		color: #e53935;
		line-height: 1.4;
		word-break: break-word;
	}

	.span-scroll-bar {
		display: flex;
		align-items: center;
		padding: 6rpx var(--bd-edge-right-gap, 16rpx) 6rpx 4rpx;
		min-height: var(--bd-toolbar-h, 40rpx);
		box-sizing: border-box;
		background-color: #bdcbe0;
		flex-shrink: 0;
		overflow: visible;
	}

	.span-scroll-view {
		flex: 1;
		min-width: 0;
		height: calc(var(--bd-toolbar-h, 40rpx) + 12rpx);
		min-height: calc(var(--bd-toolbar-h, 40rpx) + 12rpx);
		white-space: nowrap;
		overflow: visible;
		position: relative;
	}

	.span-scroll-view::before,
	.span-scroll-view::after {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		width: 24rpx;
		pointer-events: none;
		z-index: 2;
	}

	.span-scroll-view::before {
		left: 0;
		background: linear-gradient(to right, #bdcbe0 0%, rgba(189, 203, 224, 0) 100%);
	}

	.span-scroll-view::after {
		right: 0;
		background: linear-gradient(to left, #bdcbe0 0%, rgba(189, 203, 224, 0) 100%);
	}

	.span-scroll-list {
		display: flex;
		align-items: center;
		gap: 12rpx;
		padding: 0 8rpx 0 4rpx;
		width: max-content;
		min-width: 100%;
		height: 100%;
		min-height: var(--bd-toolbar-h, 40rpx);
		box-sizing: border-box;
		overflow: visible;
	}

	.span-pill {
		flex: 0 0 auto;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		height: var(--bd-toolbar-h, 40rpx);
		padding: 0 22rpx;
		border-radius: 999rpx;
		font-size: 16rpx;
		line-height: 1;
		color: #4b5563;
		background-color: #ffffff;
		border: 1rpx solid #d3d8e3;
		box-sizing: border-box;
		overflow: visible;
	}

	.span-pill-badge {
		position: absolute;
		top: -2rpx;
		right: 5rpx;
		width: 12rpx;
		height: 12rpx;
		z-index: 1;
		pointer-events: none;
	}

	.span-pill.active {
		color: #ffffff;
		background-color: #0F4687;
		border-color: #0F4687;
	}

	/* 与 BridgeInspectionToolbar 内按钮同一套压系统默认 */
	.span-notice-bar button.bd-setting-tool-btn {
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

	.span-notice-bar button.bd-setting-tool-btn::after {
		border: none !important;
		border-radius: 5rpx !important;
	}
</style>
