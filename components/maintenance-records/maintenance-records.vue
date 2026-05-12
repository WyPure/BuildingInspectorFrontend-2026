<template>
	<view>
		<view v-for="(item, index) in data" :key="item.id" class="type-group">
			<view class="type-header" @click="toggleTypeExpand(item.id)">
				<text>时间（段）：{{item.name}}</text>
				<text class="expand-icon">{{ expandedTypes[item.id] ? '▼' : '▶' }}</text>
			</view>

			<view v-if="expandedTypes[item.id] && item.children">
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

const props = defineProps({
	data: {
		type: Object,
		default: () => ({})
	}
})

// 展开状态
const expandedTypes = reactive({});

// 初始化默认展开
onMounted(() => {
	initExpandState();
});

const initExpandState = () => {
	if (props.data && props.data) {
		props.data.forEach(item => {
			expandedTypes[item.id] = true;
		});
	}
};

// 切换类型展开
const toggleTypeExpand = (id) => {
	expandedTypes[id] = !expandedTypes[id];
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