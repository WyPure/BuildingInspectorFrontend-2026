<template>
	<view>
		<view v-for="(item, index) in data" :key="item.id" class="type-group">
			<view class="type-header" @click="toggleTypeExpand(item.name)">
				<text>{{item.name}}</text>
				<text class="expand-icon">{{ expandedTypes[item.name] ? '▼' : '▶' }}</text>
			</view>

			<view v-if="expandedTypes[item.name] && item.children">
				<view class="line" v-for="(child, childIndex) in item.children" :key="child.id">
					<view class="line-title">
						{{ child.name }}
					</view>
					<view class="line-content">
						{{ child.value || '/' }}
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
	import {
		reactive,
		ref,
		onMounted
	} from 'vue'

/*	const data = ref([{
			date: '2022-10',
			inspectionType: '定期检查',
			technicalCondition: '2类',
			treatmentCountermeasure: '小修',
      nextInspectionDate: '2023年',
		},
		{
			date: '2023-11',
      inspectionType: '定期检查',
      technicalCondition: '2类',
      treatmentCountermeasure: '小修',
      nextInspectionDate: '2024年',
		},
    {
      date: '2024-12',
      inspectionType: '定期检查',
      technicalCondition: '2类',
      treatmentCountermeasure: '小修',
      nextInspectionDate: '2025年',
    }
	])*/

	const props = defineProps({
		data: {
			type: Array,
			default: () => []
		}
	})

	// 展开状态
	const expandedTypes = reactive({});

	// 初始化默认展开
	onMounted(() => {
		initExpandState();
	});

	const initExpandState = () => {
		props.data.forEach(item => {
			expandedTypes[item.name] = true;
		});
	};

	// 切换类型展开
	const toggleTypeExpand = (type) => {
		expandedTypes[type] = !expandedTypes[type];
	};
</script>

<style scoped>
	/* 下拉收缩 */
	.type-header {
		height: 30rpx;
		font-size: 15rpx;
		font-weight: bold;
		background-color: #BDCBE0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 5rpx 10rpx;
		border-radius: 2rpx;
		color: #0F4687;
		border-bottom: 1rpx solid #0F4687;
		border-top: 1rpx solid #0F4687;
	}

	.expand-icon {
		margin-left: 5rpx;
		font-size: 12rpx;
		color: #666;
	}

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
	.line-content-middle{
		margin-left: 10rpx;
		margin-right: 10rpx;
		color: #BDCBE0;
	}
</style>