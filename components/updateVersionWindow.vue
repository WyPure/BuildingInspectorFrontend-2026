<template>
	<view class="container" v-if="visible">
		<!-- 弹窗组件 -->
		<view class="window">
			<!-- 标题栏 -->
			<view class="title">{{ title }}</view>

			<!-- 内容区 -->
			<view class="content">
				{{ content }}
			</view>

			<!-- 按钮区域 -->
			<view class="button-container">
				<button class="btn cancel" @tap="handleCancel">取消</button>
				<button class="btn confirm" @tap="handleConfirm">确定</button>
			</view>
		</view>
	</view>
</template>

<script setup>
	import {
		defineProps,
		defineEmits
	} from 'vue';

	// 定义props
	const props = defineProps({
		visible: {
			type: Boolean,
			default: false
		},
		title: {
			type: String,
			default: '发现新版本'
		},
		content: {
			type: String,
			default: '检测到新的数据包版本，是否立即更新？'
		}
	});

	// 定义emits
	const emit = defineEmits(['confirm', 'cancel']);

	// 取消按钮事件
	const handleCancel = () => {
		emit('cancel');
	};

	// 确定按钮事件
	const handleConfirm = () => {
		emit('confirm');
	};
</script>

<style scoped>
	/* 容器样式 */
	.container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 9999;
	}

	/* 弹窗样式 */
	.window {
		width: 426rpx;
		height: 320rpx;
		background-color: #FFFFFF;
		border-radius: 16rpx;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.15);
	}

	/* 标题栏样式 */
	.title {
		height: 70rpx;
		background-color: #BDCBE0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 20rpx;
		color: #0F4687;
		font-weight: bold;
		letter-spacing: 1rpx;
	}

	/* 内容区域样式 */
	.content {
		flex: 1;
		padding: 30rpx;
		font-size: 16rpx;
		color: #333333;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		background-color: #f8fafd;
		line-height: 1.6;
	}

	/* 按钮容器样式 */
	.button-container {
		display: flex;
		justify-content: space-around;
		padding: 20rpx;
		background-color: #FFFFFF;
		border-top: 1rpx solid #eeeeee;
	}

	/* 按钮基础样式 */
	.btn {
		width: 160rpx;
		height: 40rpx;
		line-height: 40rpx;
		border-radius: 5rpx;
		font-size: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s;
		border: none;
		margin: 0;
		padding: 0 10rpx;
		box-sizing: border-box;
	}

	/* 取消按钮样式 */
	.cancel {
		background-color: #FFFFFF;
		color: #1677FF;
		border: 1rpx solid #1677FF;
	}

	.cancel:active {
		background-color: #f0f7ff;
	}

	/* 确定按钮样式 */
	.confirm {
		background-color: #1677FF;
		color: #FFFFFF;
	}

	.confirm:active {
		background-color: #0d5fd0;
	}

	/* 手机端适配 */
	@media (max-width: 767px) {
		.window {
			width: 540rpx;
			height: 420rpx;
		}

		.title {
			height: 80rpx;
			font-size: 26rpx;
		}

		.content {
			font-size: 24rpx;
		}

		.btn {
			width: 200rpx;
			height: 40rpx;
			line-height: 40rpx;
			font-size: 16rpx;
			padding: 0 10rpx;
			box-sizing: border-box;
		}
	}
</style>