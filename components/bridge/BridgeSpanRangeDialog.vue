<template>
	<view class="bridge-span-dialog-host">
	<uni-popup ref="popupRef" type="center">
		<view class="bridge-span-popup">
			<view class="bridge-span-popup-title">
				<text class="bridge-span-popup-title-text">{{ popupTitle }}</text>
			</view>
			<view class="bridge-span-form">
				<view class="bridge-span-row">
					<text class="bridge-span-label">桥梁名称</text>
					<text class="bridge-span-value">{{ bridgeName }}</text>
				</view>
				<view class="bridge-span-row">
					<text class="bridge-span-label">桥梁编号</text>
					<text class="bridge-span-value">{{ bridgeCode }}</text>
				</view>
				<view class="bridge-span-row">
					<text class="bridge-span-label">桥跨编号</text>
					<view class="bridge-span-field-inline bridge-span-field-inline--compact">
						<text class="bridge-span-affix">第</text>
						<view class="bridge-span-input-with-clear bridge-span-input-with-clear--span-no">
							<input :value="spanEnd" class="bridge-span-input bridge-span-input--span-no" type="number"
								placeholder="" @input="onEndInput" />
							<image class="bridge-span-clear" src="/static/image/clear.png" mode="aspectFit"
								@tap.stop="clearEnd" />
						</view>
						<text class="bridge-span-affix">跨</text>
					</view>
				</view>
				<view class="bridge-span-row">
					<text class="bridge-span-label">桥跨类型</text>
					<view class="bridge-span-select" @tap.stop="openBridgeTypePopup">
						<text :class="['bridge-span-select-text', spanTypeName ? '' : 'is-placeholder']">
							{{ spanTypeName || '请选择桥跨类型' }}
						</text>
						<text class="bridge-span-select-arrow">›</text>
					</view>
				</view>
				<view class="bridge-span-row">
					<text class="bridge-span-label">桥跨跨径</text>
					<view class="bridge-span-field-inline bridge-span-field-inline--compact">
						<view class="bridge-span-input-with-clear bridge-span-input-with-clear--length">
							<input :value="spanLengthM" class="bridge-span-input bridge-span-input--length" type="digit"
								placeholder="" @input="onLengthInput" />
							<image class="bridge-span-clear" src="/static/image/clear.png" mode="aspectFit"
								@tap.stop="clearLength" />
						</view>
						<text class="bridge-span-affix bridge-span-unit">m</text>
					</view>
				</view>
			</view>
			<view class="bridge-span-popup-actions">
				<view class="bridge-span-btn-outline" hover-class="bridge-span-btn--hover" @tap.stop="emitCopyPrev">
					<text>从前一跨复制</text>
				</view>
				<view class="bridge-span-btn-outline" hover-class="bridge-span-btn--hover" @tap.stop="emitCopyNext">
					<text>从后一跨复制</text>
				</view>
				<view class="bridge-span-btn-outline" hover-class="bridge-span-btn--hover" @tap.stop="emitCancel">
					<text>取消</text>
				</view>
				<view class="bridge-span-btn-confirm" hover-class="bridge-span-btn--hover" @tap.stop="emitConfirm">
					<text>确定</text>
				</view>
			</view>
		</view>
	</uni-popup>
	<uni-popup ref="bridgeTypePopupRef" type="bottom">
		<view class="bridge-type-popup">
			<view class="bridge-type-popup-title">请选择桥跨类型</view>
			<scroll-view class="bridge-type-scroll" scroll-y="true">
				<view v-for="item in bridgeTypeOptions" :key="item.id" class="bridge-type-item" @tap="selectBridgeType(item)">
					<text class="bridge-type-item-text">{{ item.name }}</text>
				</view>
				<view v-if="!bridgeTypeOptions.length" class="bridge-type-empty">暂无桥型数据</view>
			</scroll-view>
		</view>
	</uni-popup>
	</view>
</template>

<script setup>
	import {
		ref
	} from 'vue';
	import {
		queryBridgeTypeOptions
	} from '@/utils/bridgeCatalogDb';

	const props = defineProps({
		popupTitle: {
			type: String,
			default: ''
		},
		bridgeName: {
			type: String,
			default: ''
		},
		bridgeCode: {
			type: String,
			default: ''
		},
		spanEnd: {
			type: String,
			default: ''
		},
		spanTypeName: {
			type: String,
			default: ''
		},
		spanLengthM: {
			type: String,
			default: ''
		}
	});

	const emit = defineEmits([
		'update:spanEnd',
		'update:spanTypeName',
		'update:spanLengthM',
		'confirm',
		'cancel',
		'copy-prev',
		'copy-next'
	]);

	const popupRef = ref(null);
	const bridgeTypePopupRef = ref(null);
	const bridgeTypeOptions = ref([]);

	const inputVal = (e) => {
		if (e?.detail?.value !== undefined) return String(e.detail.value);
		if (e?.target?.value !== undefined) return String(e.target.value);
		return '';
	};

	const onEndInput = (e) => {
		emit('update:spanEnd', inputVal(e));
	};

	const onLengthInput = (e) => {
		emit('update:spanLengthM', inputVal(e));
	};

	const clearEnd = () => {
		emit('update:spanEnd', '');
	};

	const clearLength = () => {
		emit('update:spanLengthM', '');
	};

	const openBridgeTypePopup = async () => {
		try {
			if (!bridgeTypeOptions.value.length) {
				bridgeTypeOptions.value = await queryBridgeTypeOptions();
			}
			bridgeTypePopupRef.value?.open?.();
		} catch (e) {
			console.error('读取桥型列表失败:', e);
			uni.showToast({
				title: '桥型读取失败',
				icon: 'none'
			});
		}
	};

	const selectBridgeType = (item) => {
		emit('update:spanTypeName', item?.name || '');
		bridgeTypePopupRef.value?.close?.();
	};

	const emitConfirm = () => {
		emit('confirm');
	};

	const emitCancel = () => {
		emit('cancel');
	};

	const emitCopyPrev = () => {
		emit('copy-prev');
	};

	const emitCopyNext = () => {
		emit('copy-next');
	};

	defineExpose({
		open: () => popupRef.value?.open?.(),
		close: () => popupRef.value?.close?.()
	});
</script>

<style scoped>
	/* 字号基准；表单三处控件统一行高（rpx，避免原生控件高度不一致） */
	.bridge-span-popup {
		--bs-fs: 16rpx;
		/* 与 BridgeInspectionToolbar「新增病害」等按钮同高 */
		--bs-btn-h: 40rpx;
		/* 编号 / 桥跨类型 / 跨径 三处统一行高（略低于 48rpx，避免显得过高） */
		--bs-field-h: 36rpx;
		--bs-form-pad-x: 24rpx;
		background-color: #fff;
		width: 60vw;
		max-width: 83vw;
		border-radius: 8rpx;
		overflow: hidden;
		box-sizing: border-box;
		font-size: var(--bs-fs);
	}

	.bridge-span-popup-title {
		background-color: #bdcbe0;
		padding: 12rpx 16rpx;
		text-align: center;
		box-sizing: border-box;
	}

	.bridge-span-popup-title-text {
		font-size: var(--bs-fs);
		color: #0f4687;
		font-weight: 500;
	}

	.bridge-span-form {
		padding: 20rpx var(--bs-form-pad-x) 8rpx;
		box-sizing: border-box;
	}

	.bridge-span-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		margin-bottom: 18rpx;
		font-size: var(--bs-fs);
	}

	.bridge-span-label {
		width: 108rpx;
		flex: 0 0 108rpx;
		padding-right: 8rpx;
		box-sizing: border-box;
		font-size: var(--bs-fs);
		color: #666666;
		line-height: 1.35;
	}

	.bridge-span-value {
		flex: 1;
		min-width: 0;
		font-size: var(--bs-fs);
		color: #333333;
		line-height: 1.35;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.bridge-span-field-inline {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 6rpx;
		font-size: var(--bs-fs);
		color: #333333;
	}

	.bridge-span-field-inline--compact {
		flex: 1;
		justify-content: flex-start;
		min-width: 0;
	}

	.bridge-span-affix {
		font-size: var(--bs-fs);
		color: #333333;
		flex-shrink: 0;
	}

	.bridge-span-unit {
		margin-left: 4rpx;
	}

	.bridge-span-input-with-clear {
		display: flex;
		flex-direction: row;
		align-items: center;
		border: 1rpx solid #cccccc;
		border-radius: 0;
		padding: 0 4rpx 0 6rpx;
		box-sizing: border-box;
		background: #fff;
		font-size: var(--bs-fs);
		height: var(--bs-field-h);
		min-height: var(--bs-field-h);
		max-height: var(--bs-field-h);
	}

	/* 桥跨编号：窄框，仅容纳少量数字 */
	.bridge-span-input-with-clear--span-no {
		flex: 0 0 auto;
		width: 84rpx;
		min-width: 84rpx;
		max-width: 84rpx;
		padding-left: 4rpx;
		padding-right: 2rpx;
	}

	/* 桥跨跨径：略宽于编号，仍明显窄于整行 */
	.bridge-span-input-with-clear--length {
		flex: 0 0 auto;
		width: 100rpx;
		min-width: 100rpx;
		max-width: 100rpx;
	}

	.bridge-span-input {
		flex: 1;
		min-width: 0;
		align-self: stretch;
		height: 100%;
		min-height: 0;
		line-height: var(--bs-field-h);
		border: none;
		padding: 0;
		font-size: var(--bs-fs);
		color: #333333;
		box-sizing: border-box;
		background: transparent;
	}

	.bridge-span-input--span-no {
		flex: 1;
		width: 100%;
		text-align: center;
	}

	.bridge-span-input--length {
		flex: 1;
		width: 100%;
		text-align: left;
	}

	.bridge-span-clear {
		width: 24rpx;
		height: 24rpx;
		flex-shrink: 0;
		margin-left: 2rpx;
	}

	.bridge-span-select {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		border: 1rpx solid #cccccc;
		border-radius: 0;
		padding: 0 4rpx 0 6rpx;
		box-sizing: border-box;
		background: #fff;
		font-size: var(--bs-fs);
		height: var(--bs-field-h);
		min-height: var(--bs-field-h);
		max-height: var(--bs-field-h);
		overflow: hidden;
	}

	.bridge-span-select-text {
		flex: 1;
		min-width: 0;
		font-size: var(--bs-fs);
		line-height: var(--bs-field-h);
		height: var(--bs-field-h);
		color: #333333;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.bridge-span-select-text.is-placeholder {
		color: #cccccc;
	}

	.bridge-span-select-arrow {
		font-size: var(--bs-fs);
		color: #a0aec0;
		line-height: var(--bs-field-h);
		flex-shrink: 0;
		margin-left: 6rpx;
	}

	/* 与表单整块左右边距一致；四钮单行，宽度随文案，首尾贴齐表单左右缘 */
	.bridge-span-popup-actions {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		align-items: center;
		justify-content: space-between;
		box-sizing: border-box;
		width: 100%;
		padding: 12rpx var(--bs-form-pad-x) 20rpx;
	}

	.bridge-span-btn-outline {
		flex: 0 0 auto;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #ffffff;
		color: #1677ff;
		border: 1rpx solid #1677ff;
		font-size: var(--bs-fs);
		min-height: var(--bs-btn-h);
		height: var(--bs-btn-h);
		padding: 0 10rpx;
		border-radius: 5rpx;
		box-sizing: border-box;
	}

	.bridge-span-btn-outline text,
	.bridge-span-btn-confirm text {
		font-size: var(--bs-fs);
		line-height: 1.2;
		text-align: center;
		color: inherit;
		white-space: nowrap;
	}

	.bridge-span-btn-confirm {
		flex: 0 0 auto;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #1677ff;
		color: #ffffff;
		font-size: var(--bs-fs);
		min-height: var(--bs-btn-h);
		height: var(--bs-btn-h);
		padding: 0 10rpx;
		border-radius: 5rpx;
		box-sizing: border-box;
		border: 1rpx solid #1677ff;
	}

	.bridge-span-btn--hover {
		opacity: 0.88;
	}

	.bridge-type-popup {
		background: #fff;
		border-radius: 16rpx 16rpx 0 0;
		max-height: 60vh;
		padding-bottom: env(safe-area-inset-bottom);
	}

	.bridge-type-popup-title {
		/* 与新增病害页「三级选择下拉」字体一致 */
		font-size: 20rpx;
		color: #333;
		text-align: center;
		padding: 16rpx 20rpx;
		border-bottom: 1rpx solid #eee;
	}

	.bridge-type-scroll {
		max-height: 50vh;
	}

	.bridge-type-item {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		/* 与新增病害页下拉项行高一致（56rpx） */
		height: 56rpx;
		padding: 0 24rpx;
		border-bottom: 1rpx solid #f0f0f0;
		box-sizing: border-box;
	}

	.bridge-type-item-text {
		font-size: 20rpx;
		color: #333;
		text-align: center;
		line-height: 56rpx;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.bridge-type-empty {
		padding: 32rpx;
		text-align: center;
		font-size: 16rpx;
		color: #999;
	}
</style>
