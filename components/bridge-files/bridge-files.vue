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
  import {ref} from "vue";

/*  const data = ref({
    designDrawings: '全',//设计图纸
    designDocuments: '全',//设计文件
    asBuiltDrawings: '全',//竣工图纸
    constructionDocuments: '全',//施工文件（含施工缺陷文件）
    acceptanceDocuments: '全',//验收文件
    administrativeApprovalDocuments: '全',//行政审批文件
    regularInspectionRecords: '全',//定期检查资料
    specialInspectionRecords: '全',//特殊检查资料
    maintenanceAndReinforcementRecords: '全',//历次维修、加固资料
    otherArchives: '无',//其他档案
    archiveFormats:'纸质、电子',//档案形式
    archiveCreationTime: '',//建档时间（年/月）
  })*/

  const props = defineProps({
    data: {
      type: Array,
      default: () => []
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