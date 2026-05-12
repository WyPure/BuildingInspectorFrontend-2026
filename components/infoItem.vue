<template>
	<view class="infoItem">
		<view class="infoItem-key">{{props.infoKey}}</view>
		<view class="infoItem-value">{{props.infoValue}}</view>
	</view>
</template>

<script setup>
	import {
		ref
	} from 'vue';
	const props = defineProps({
		infoKey: String,
		infoValue: String
	});
</script>

<style scoped>
	.infoItem {
		width: 100%;
		height: 50rpx;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		background-color: #FFFFFF;
		border-top: 1rpx solid #f4f4f4;
		border-bottom: 1rpx solid #f4f4f4;
	}

	.infoItem-key {
		font-size: 16rpx;
		color: #000;
		margin-left: 20rpx;
	}

	.infoItem-value {
		font-size: 16rpx;
		color: #959595;
		margin-right: 20rpx;
	}

	/* 适配 iPad（768px 以上） */
	@media screen and (min-width: 768px) {}

	/* 适配 iPad Pro（1024px 以上） */
	@media screen and (min-width: 1024px) {
		.infoItem {
			height: 100rpx;
		}

		.infoItem-key {
			font-size: 32rpx;
			margin-left: 50rpx;
		}

		.infoItem-value {
			font-size: 32rpx;
			margin-right: 50rpx;
		}
	}
</style>