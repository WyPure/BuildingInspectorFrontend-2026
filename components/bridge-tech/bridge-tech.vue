<template>
	<view>
		<view class="line" v-for="(item, index) in data" :key="item.id">
			<view class="line-title">
				{{ item.name }}
			</view>
			<view class="line-content">
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
</template>

<script setup>
import {
  ref,
  computed
} from 'vue'

/*const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
})
  const data = ref({
    bridge: {
      length: '155.6',//桥梁总长
      width: '12',//桥面总宽
      standardClearance: '22',//桥面标准净空
      actualClearance: '8.5',//桥面实际净空
      height: ''//桥面高度
    },
    approachRoadWidth: '0',//引道总宽
    approachRoadRadius: '0',//引道曲率半径
    approachRoadLinear: '无',//引道线形
    laneWidth: '7.5',//车道宽度
    sidewalkWidth: '0',//人行道宽度
    guardrailHeight: '1',//护栏或防护墙宽度
    centralDividerWidth: '0',//中央分隔带宽度
    underStandardClearance: '40',//桥下通航等级及标准净空
    underActualClearance: '8.5',//桥下实际净空
    floodFrequency: '1/100',//设计洪水频率
    waterLevel: '0',//洪水位
    acceleration: '0.05',//设计地震动峰值加速度系数
    historyFloodLevel: '0'
  })*/

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
})
</script>

<style scoped>
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