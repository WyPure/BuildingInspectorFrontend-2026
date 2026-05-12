<template>
	<view>
		<!-- 保持桥梁分孔和结构体系单独显示 -->
		<view class="part-area" v-if="structureData && structureData.length > 0">
			<view class="part-area-title">桥梁分孔（m）</view>
			<view class="part-area-content">{{getBridgeSpanData().value || '/'}}</view>
		</view>

		<view class="part-area" v-if="structureData && structureData.length > 0">
			<view class="part-area-title">结构体系</view>
			<view class="part-area-content">
				<template v-if="getStructuralSystemData().children && getStructuralSystemData().children.length">
					<template v-for="(child, childIndex) in getStructuralSystemData().children" :key="child.id">
						{{ child.name }}: {{ child.value || '/' }}
						<text v-if="childIndex < getStructuralSystemData().children.length - 1" class="line-content-middle"></text>
					</template>
				</template>
				<template v-else>
					{{ getStructuralSystemData().value || '/' }}
				</template>
			</view>
		</view>

		<!-- 动态渲染其他结构部分 -->
		<view v-for="type in getStructureTypes()" :key="type.id" class="type-group">
			<view class="type-header" @click="toggleTypeExpand(type.name)">
				<text>{{type.name}}</text>
				<text class="expand-icon">{{ expandedTypes[type.name] ? '▼' : '▶' }}</text>
			</view>

			<view v-show="expandedTypes[type.name]">
				<view v-for="item in type.children" :key="item.id" class="expand-area">
					<view class="expand-area-title">{{item.name}}</view>
					<view class="expand-area-content">
						<template v-if="item.children && item.children.length">
							<template v-for="(child, childIndex) in item.children" :key="child.id">
								{{ child.name }}: {{ child.value || '/' }}
								<text v-if="childIndex < item.children.length - 1" class="line-content-middle"></text>
							</template>
						</template>
						<template v-else>
							{{ item.value || '/' }}
						</template>
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
		computed
	} from 'vue'

	const props = defineProps({
		data: {
			type: Object,
			default: () => ({})
		}
	})

	// 计算得到结构信息数据
	const structureData = computed(() => {
		return props.data || [];
	});

	// 获取桥梁分孔数据
	const getBridgeSpanData = () => {
		return structureData.value.find(item => item.name === '桥梁分孔(m)' || item.name === '桥梁分孔' || item.name === '桥梁分孔（m）') || {};
	};

	// 获取结构体系数据
	const getStructuralSystemData = () => {
		return structureData.value.find(item => item.name === '结构体系') || {};
	};

	// 获取需要分类展示的结构类型
	const getStructureTypes = () => {
		const excludeNames = ['桥梁分孔','桥梁分孔(m)', '结构体系','桥梁分孔（m）'];
		return structureData.value.filter(item => !excludeNames.includes(item.name));
	};

	// 展开状态
	const expandedTypes = reactive({});

	// 初始化默认展开所有类型
	const initExpandedTypes = () => {
		const types = getStructureTypes();
		types.forEach(type => {
			expandedTypes[type.name] = true;
		});
	};

	// 在数据变化时初始化展开状态
	if (structureData.value.length > 0) {
		initExpandedTypes();
	}

	// 切换类型展开
	const toggleTypeExpand = (type) => {
		expandedTypes[type] = !expandedTypes[type];
	};
</script>

<style scoped>
	/* 变成高度区域 */
	.part-area {
		display: flex;
		flex-direction: column;
		padding: 14rpx 10rpx;
		border-bottom: 1rpx solid #eee;
	}

	.part-area-title {
		font-size: 16rpx;
		color: #666666;
	}

	.part-area-content {
		margin-top: 4rpx;
		font-size: 20rpx;
		color: #666666;
	}

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

	.expand-area {
		padding: 10rpx;
		border-bottom: 1rpx solid #eee;
	}
	.expand-area-title {
		font-size: 16rpx;
		color: #666666;
	}
	.expand-area-content {
		margin-top: 4rpx;
		font-size: 20rpx;
		color: #333333;
	}
	
	.line-content-middle {
		margin-left: 10rpx;
		margin-right: 10rpx;
		color: #BDCBE0;
	}
</style>