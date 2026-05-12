<template>
  <uni-swipe-action :ref="el => swipeAction = el" v-if="editMode === 'edit'">
		<uni-swipe-action-item :right-options="swipeOptions" @click="handleSwipeClick" @change="swipeChange" :disabled="selectMode">
			<view class="disease-item" @click="handleItemClick">
				<!-- 选择框区域 -->
				<view v-if="selectMode" class="select-area">
					<view :class="['select-circle', isSelected ? 'selected' : '']">
						<view v-if="isSelected" class="select-inner"></view>
					</view>
				</view>

        <view class="disease-content" @click="selectMode ? null : editDisease()">
					<view class="item-header">
						<text class="title">{{item.component.name}}/{{item.type}}</text>
					</view>
					<view class="content-container">
						<view class="left-column">
							<view class="info-row">
								<text class="label">病害描述：</text>
								<text class="description-text">{{item.description}}</text>
							</view>
							<view class="info-row info-row--time">
								<text class="label">采集时间：</text>
								<text class="info-value">{{item.createTime}}</text>
							</view>
						</view>
						<view class="right-column">
							<view class="info-row">
								<text class="label">缺损数量：</text>
								<text>{{item.quantity}}</text>
							</view>
							<view class="info-row">
								<text class="label">参考评定/评定标度：</text>
<!--								<text>{{item.participateAssess === '1' ? '是' : '否'}}/{{item.participateAssess === '1' ? item.level : '-'}}</text>-->
                <text>{{item.participateAssess === '1' ? '是' : (item.participateAssess === null ? '-' : '否')}}/{{item.participateAssess === '0' ? '-' : formatLevelDisplay(item.level)}}</text>
							</view>
						</view>
					</view>
					<view class="status" v-if="item.commitType === 3" style="background-color: #FFD24A; color: #ffffff;">未完成</view>
					<view class="status" v-else-if="item.commitType === 1" style="background-color: #FF6430; color: #ffffff;">未提交</view>
					<view class="status" v-else-if="item.commitType === 0" style="background-color: #00B578; color: #ffffff;">已提交</view>
          <image v-if="hasADImgs" class="AD-icon" src="/static/image/ADIcon.png" mode="aspectFit"></image>
					<image v-if="hasImages" class="image-icon" src="/static/image/disease.png" mode="aspectFit"></image>
				</view>
			</view>
		</uni-swipe-action-item>
	</uni-swipe-action>

  <!-- 历史病害模式下不可滑动的版本 -->
  <view v-else class="disease-item" @click="handleItemClick">
    <!-- 选择框区域 -->
    <view v-if="selectMode" class="select-area">
      <view :class="['select-circle', isSelected ? 'selected' : '']">
        <view v-if="isSelected" class="select-inner"></view>
      </view>
    </view>

    <view class="disease-content" @click="selectMode ? null : editDisease()">
      <view class="item-header">
        <text class="title">{{item.component.name}}/{{item.type}}</text>
      </view>
      <view class="content-container">
        <view class="left-column">
          <view class="info-row">
            <text class="label">病害描述：</text>
            <text class="description-text">{{item.description}}</text>
          </view>
          <view class="info-row info-row--time">
            <text class="label">采集时间：</text>
            <text class="info-value">{{item.createTime}}</text>
          </view>
        </view>
        <view class="right-column">
          <view class="info-row">
            <text class="label">缺损数量：</text>
            <text>{{item.quantity}}</text>
          </view>
          <view class="info-row">
            <text class="label">参考评定/评定标度：</text>
<!--            <text>{{item.participateAssess === '1' ? '是' : '否'}}/{{item.participateAssess === '1' ? item.level : '-'}}</text>-->
            <text>{{item.participateAssess === '1' ? '是' : (item.participateAssess === null ? '-' : '否')}}/{{item.participateAssess === '0' ? '-' : formatLevelDisplay(item.level)}}</text>
          </view>
        </view>
      </view>
      <view class="status" v-if="item.copyId && item.copyId.length > 0" style="background-color: #00B578; color: #ffffff;">已复制</view>
      <image v-if="hasADImgs" class="AD-icon" src="/static/image/ADIcon.png" mode="aspectFit"></image>
      <image v-if="hasImages" class="image-icon" src="/static/image/disease.png" mode="aspectFit"></image>
    </view>
  </view>

</template>

<script setup>
import {ref, watch, onMounted, computed} from 'vue';
import {readDiseaseImages} from "@/utils/readJsonNew";
import {userStore} from "@/store/index";
import {idStore} from "@/store/idStorage";
import {appendBridgeQueryToUrl} from '@/utils/bridgeNavQuery.js';

const userInfo = userStore();
const idStorageInfo = idStore();

/** 兼容旧版单个数字标度与新版四维对象 */
const formatLevelDisplay = (level) => {
	if (level === null || level === undefined || level === '') {
		return '-';
	}
	if (typeof level === 'object' && level !== null) {
		const d = level.durability;
		const s = level.structural;
		const f = level.functional;
		const i = level.impact;
		if ([d, s, f, i].some((v) => v !== undefined && v !== null)) {
			return [d ?? '-', s ?? '-', f ?? '-', i ?? '-'].join('/');
		}
	}
	return String(level);
};

// 声明props
const props = defineProps({
	item: {
		type: Object,
		default: () => ({
      "createBy": "crh@znjc",
      "createTime": "2023-05-02 16:52:18",
      "updateTime": "2023-05-02 16:52:17",
      "id": 54,
      "diseaseType": {
        "id": 17,
        "code": "5.2.1-3",
        "name": "焊缝开裂",
        "maxScale": 5,
        "minScale": 1,
        "status": "0"
      },
      "diseaseTypeId": 17,
      "description": "焊缝部位涂层有大量裂纹，受拉翼缘边焊缝存在裂缝，其他部位焊缝无裂缝，主梁、纵横梁受拉翼缘边焊缝开裂长度≤5mm",
      "developmentTrend": "稳定",
      "level": 2,
      "quantity": 1,
      "type": "焊缝开裂",
      "participateAssess": "0",
      "deductPoints": 35,
      "biObjectId": 709,
      "projectId": 2,
      "component": {
        "createBy": "admin",
        "createTime": "2025-04-21 16:53:39",
        "updateTime": "2025-04-21 16:53:38",
        "id": 244,
        "code": "R-1-1#上部承重构件（主梁、挂梁）",
        "name": "上部承重构件（主梁、挂梁）1",
        "biObjectId": 709,
        "status": "0",
        "delFlag": "0",
        "biObject": {
          "id": 709,
          "name": "上部承重构件（主梁、挂梁）",
          "count": 0
        },
        "parentObjectName": "上部结构"
      },
      "componentId": 244,
      "buildingId": 37
    })
	},
	selectMode: {
		type: Boolean,
		default: false
	},
	selected: {
		type: Boolean,
		default: false
	},
  editMode: {
    type: String,
    default: 'history'
  }
});

// 声明emit
const emit = defineEmits(['delete', 'select', 'swipe-opened']);

// 数据部分
const isSelected = ref(false);
const swipeAction = ref(null);
const swipeOptions = [
	{
		text: '取消',
		style: {
			backgroundColor: '#909399'
		}
	},
	{
		text: '编辑',
		style: {
			backgroundColor: '#409EFF'
		}
	},
	{
		text: '删除',
		style: {
			backgroundColor: '#F56C6C'
		}
	}
];

// 监听selected属性变化
watch(() => props.selected, (val) => {
	isSelected.value = val;
});

// 创建时初始化
onMounted(() => {
	isSelected.value = props.selected;
});

const editDisease = () => {
  // 打开编辑病害页面，并通过URL参数传递病害数据
  const itemData = encodeURIComponent(JSON.stringify(props.item));
  uni.navigateTo({
    url: appendBridgeQueryToUrl(
      `/pages/add-disease/add-disease?mode=${props.editMode}&id=${props.item.id}&data=${itemData}`
    )
  });
};

// 方法
const handleSwipeClick = (e) => {
	// 按钮点击事件，后续可实现功能
	if(e.index === 0){
		closeSwipe();
	}
	if(e.index === 1){
    // 打开编辑病害页面，并通过URL参数传递病害数据
    const itemData = encodeURIComponent(JSON.stringify(props.item));
    uni.navigateTo({
      url: appendBridgeQueryToUrl(
        `/pages/add-disease/add-disease?mode=edit&id=${props.item.id}&data=${itemData}`
      )
    });
	}
	if(e.index === 2){
		// 确认删除
		uni.showModal({
			title: '确认删除',
			content: '确定要删除这条病害记录吗？',
			success: (res) => {
				if (res.confirm) {
					// 创建删除数据对象
					const deleteData = {
						id: props.item.id,
					};
					
					// 使用事件发送删除请求
					console.log('准备发送deleteDisease事件，ID:', props.item.id);
					uni.$emit('deleteDisease', deleteData);
					
					uni.showToast({
						title: '删除成功',
						icon: 'success'
					});
				}
			}
		});
		closeSwipe();
	}
};

const handleItemClick = () => {
	if (props.selectMode) {
		isSelected.value = !isSelected.value;
		emit('select', {
			item: props.item,
			selected: isSelected.value
		});
	}
};

const closeSwipe = () => {
	if (swipeAction.value) {
		swipeAction.value.closeAll();
	}
};

const swipeChange = (e) => {
	if (e.open) {
		emit('swipe-opened', props.item.id);
	}
};

/*const getImage = computed(() => {
  if(props.item.images && props.item.images.length > 0){
    return readDiseaseImages(userInfo.username, idStorageInfo.buildingId, props.item.images[0]);
  }else{
    return '/static/image/disease.png';
  }
});*/

const hasImages = computed(() => {
  return props.item.images && props.item.images.length > 0;
});

const hasADImgs = computed(() => {
  return props.item.ADImgs && props.item.ADImgs.length > 0;
});

</script>

<style scoped>
.disease-item {
	position: relative;
	padding: 10rpx 10rpx 2rpx 10rpx;
	background-color: #FFFFFF;
	border-bottom: 1rpx solid #EEEEEE;
	display: flex;
	flex-direction: row;
	align-items: center;
	width: 100%;
	box-sizing: border-box;
	overflow: hidden;
}

.select-area {
	flex-shrink: 0;
	width: 40rpx;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 8rpx;
}

.select-circle {
	width: 24rpx;
	height: 24rpx;
	border-radius: 50%;
	border: 1px solid #cccccc;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
}

.selected {
	background-color: #0F4687;
	border-color: #0F4687;
}

.select-inner {
	position: absolute;
	width: 12rpx;
	height: 6rpx;
	border-left: 2rpx solid #ffffff;
	border-bottom: 2rpx solid #ffffff;
	transform: rotate(-45deg);
	top: 6rpx;
}

.disease-content {
	flex: 1;
	position: relative;
	min-width: 0;
}

.item-header {
	display: flex;
	align-items: center;
	margin-bottom: 8rpx;
	width: 100%;
}

.title {
	font-size: 20rpx;
	color: #333333;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	max-width: 70%;
	display: inline-block;
}

.content-container {
	display: flex;
	width: 100%;
	align-items: flex-start;
	box-sizing: border-box;
}

.left-column {
	flex: 1 1 0;
	min-width: 0;
	overflow: hidden;
}

.right-column {
	flex: 0 0 auto;
	min-width: 0;
	max-width: 48%;
	margin-left: 12rpx;
	overflow: visible;
}

.info-row {
	display: flex;
	font-size: 15rpx;
	color: #666666;
	margin-bottom: 8rpx;
	align-items: flex-start;
	min-width: 0;
}

.left-column .info-row {
	width: 100%;
}

/* 采集时间与标签：统一行高并垂直居中，避免 <text> 默认基线不一致导致时间偏上 */
.info-row--time {
	align-items: center;
}

.info-row--time .label,
.info-row--time .info-value {
	font-size: 15rpx;
	line-height: 1.5;
}

.right-column .info-row {
	justify-content: flex-end;
	align-items: baseline;
	width: 100%;
	flex-wrap: wrap;
}

.label {
	color: #999999;
	flex-shrink: 0;
}

.right-column .info-row .label,
.right-column .info-row > text:last-child {
	font-size: 15rpx;
	line-height: 1.5;
}

.right-column .info-row > text:last-child {
	flex: 0 1 auto;
	min-width: 0;
	word-break: break-all;
}

.description-text {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	max-width: 65%;
	display: inline-block;
}

.status {
	position: absolute;
	top: 0;
	right: 80rpx;
	font-size: 14rpx;
	color: #999999;
	padding: 2rpx 6rpx;
	background-color: #f5f5f5;
	border-radius: 4rpx;
}

.AD-icon {
	position: absolute;
	top: 0;
	right: 10rpx;
	width: 25rpx;
	height: 25rpx;
}

.image-icon{
  position: absolute;
  top: 0;
  right: 45rpx;
  width: 25rpx;
  height: 25rpx;
}

</style>