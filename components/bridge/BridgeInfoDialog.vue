<template>
	<uni-popup ref="popupRef" type="center">
		<view class="bridge-info-popup">
			<view class="bridge-info-popup-title">
				<text class="bridge-info-popup-title-text">当前桥梁信息</text>
			</view>
			<view class="bridge-info-form">
				<view class="bridge-info-row">
					<text class="bridge-info-label">桥梁名称</text>
					<text class="bridge-info-value">{{ bridgeName || '未命名桥梁' }}</text>
				</view>
				<view class="bridge-info-row">
					<text class="bridge-info-label">桥梁编号</text>
					<text class="bridge-info-value">{{ bridgeCode || '-' }}</text>
				</view>
				<view class="bridge-info-row">
					<text class="bridge-info-label">里程桩号</text>
					<text class="bridge-info-value">{{ bridgePileNumber || '-' }}</text>
				</view>
				<view class="bridge-info-row">
					<text class="bridge-info-label">路线名称</text>
					<text class="bridge-info-value">{{ routeName || '-' }}</text>
				</view>
				<view class="bridge-info-row">
					<text class="bridge-info-label">路线编号</text>
					<text class="bridge-info-value">{{ routeCode || '-' }}</text>
				</view>
			</view>
			<view class="bridge-info-popup-actions">
				<view class="bridge-info-btn-confirm" hover-class="bridge-info-btn--hover" @tap.stop="handleOk">
					<text class="bridge-info-btn-confirm-text">我知道了</text>
				</view>
			</view>
		</view>
	</uni-popup>
</template>

<script setup>
	import {
		ref
	} from 'vue';

	const props = defineProps({
		bridgeName: {
			type: String,
			default: ''
		},
		bridgeCode: {
			type: String,
			default: ''
		},
		bridgePileNumber: {
			type: String,
			default: ''
		},
		routeName: {
			type: String,
			default: ''
		},
		routeCode: {
			type: String,
			default: ''
		}
	});

	const popupRef = ref(null);

	const handleOk = () => {
		popupRef.value?.close?.();
	};

	defineExpose({
		open: () => popupRef.value?.open?.(),
		close: () => popupRef.value?.close?.()
	});
</script>

<style scoped>
	/* 与 BridgeSpanRangeDialog「新增桥跨」弹窗同一套字号、行高、主色与按钮高度 */
	.bridge-info-popup {
		--bs-fs: 16rpx;
		--bs-btn-h: 40rpx;
		--bs-form-pad-x: 24rpx;
		background-color: #fff;
		width: 60vw;
		max-width: 83vw;
		border-radius: 8rpx;
		overflow: hidden;
		box-sizing: border-box;
		font-size: var(--bs-fs);
	}

	.bridge-info-popup-title {
		background-color: #bdcbe0;
		padding: 12rpx 16rpx;
		text-align: center;
		box-sizing: border-box;
	}

	.bridge-info-popup-title-text {
		font-size: var(--bs-fs);
		color: #0f4687;
		font-weight: 500;
	}

	.bridge-info-form {
		padding: 20rpx var(--bs-form-pad-x) 8rpx;
		box-sizing: border-box;
	}

	.bridge-info-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		margin-bottom: 18rpx;
		font-size: var(--bs-fs);
	}

	.bridge-info-label {
		width: 108rpx;
		flex: 0 0 108rpx;
		padding-right: 8rpx;
		box-sizing: border-box;
		font-size: var(--bs-fs);
		color: #666666;
		line-height: 1.35;
	}

	.bridge-info-value {
		flex: 1;
		min-width: 0;
		font-size: var(--bs-fs);
		color: #333333;
		line-height: 1.35;
		white-space: normal;
		word-break: break-all;
		overflow-wrap: anywhere;
	}

	.bridge-info-popup-actions {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		align-items: center;
		justify-content: flex-end;
		box-sizing: border-box;
		width: 100%;
		padding: 12rpx var(--bs-form-pad-x) 20rpx;
	}

	.bridge-info-btn-confirm {
		flex: 0 0 auto;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #1677ff;
		color: #ffffff;
		font-size: var(--bs-fs);
		min-height: var(--bs-btn-h);
		height: var(--bs-btn-h);
		padding: 0 16rpx;
		border-radius: 5rpx;
		box-sizing: border-box;
		border: 1rpx solid #1677ff;
	}

	.bridge-info-btn-confirm-text {
		font-size: var(--bs-fs);
		line-height: 1.2;
		text-align: center;
		color: inherit;
		white-space: nowrap;
	}

	.bridge-info-btn--hover {
		opacity: 0.88;
	}
</style>
