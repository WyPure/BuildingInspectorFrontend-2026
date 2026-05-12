<template>
	<view>
		<view class="line" v-for="(item, index) in data" :key="item.id">
			<view class="line-title">
				{{ item.name }}
			</view>
			<view class="line-content">
				{{ item.value || '/' }}
			</view>
		</view>
	</view>
</template>

<script setup>
	import {
		ref,
		computed
	} from 'vue'

	const props = defineProps({
		data: {
			type: Object,
			default: () => ({})
		}
	})

/*	const data = ref({
		code: '420302',
		route: {
			number: 'G70',
			name: '福州至银川高速公路',
			level: '国道、高度公路'
		},
		bridge: {
			number: 'G70420302R1020',
			name: '徐家棚大桥-上行',
			station: '1373.765',
			slope: '2',
			radius: '-1'
		},
		typeFeature: '0',
		road: {
			type: '道路',
			station: 'K1373+765'
		},
		load: '公路I级',
		creatTime: '2007-12-13',
		designUnit: '湖北省交通规划设计院',
		constructionUnit: '湖北省路桥有限公司',
		supervisionUnit: ''
	})*/
</script>

<style>
	.line {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding: 14rpx 12rpx;
		border-bottom: 1rpx solid #eee;
	}

	.line-title {
		color: #666666;
		font-size: 20rpx;
	}

	.line-content {
		color: #333333;
		font-size: 20rpx;
	}
</style>