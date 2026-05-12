<template>
	<view class="mask-container">
		<view class="mask-loading-box">
			<view class="spinner-css"></view>
			<text class="loading-text">{{ text }}</text>
		</view>
	</view>
</template>

<script setup>
	defineProps({
		text: {
			type: String,
			default: '加载中...' 
		}
	});
</script>

<style scoped>
	.mask-container {
		position: fixed;
		z-index: 9999;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.3);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.mask-loading-box {
		background: #fff;
		border-radius: 20rpx;
		padding: 20rpx 30rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.spinner-css {
		width: 40rpx;
		height: 40rpx;
		border: 6rpx solid #ccc;
		border-top-color: #007AFF;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.loading-text {
		margin-top: 20rpx;
		font-size: 20rpx;
		color: #333;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}

		100% {
			transform: rotate(360deg);
		}
	}
</style>