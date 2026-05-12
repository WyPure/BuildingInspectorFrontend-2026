<template>
	<view>
		<view class="head">
			<view class="head-text">
				病害定量数据
			</view>
		</view>

		<view class="quantitative-data form-row" v-show="showColumns[10] == 1">
			<view class="quantitative-data-left">
				<text class="picker-must">*</text>
				<text class="row-label">缺损数量</text>
			</view>
			<view class="quantitative-data-right">
				<view class="quantitative-data-right-value dq-qty-box">
					<input class="quantitative-data-right-value-input dq-qty-input" type="number"
						v-model.number="quantity" placeholder-style="color: #CCCCCC;" @blur="onQuantityBlur">
					<image src="/static/image/clear.png" class="clear-icon" @click="quantity = 1"></image>
				</view>
				<picker class="quantitative-data-right-unit dq-unit-picker" :range="quantityUnits"
					@change="quantityUnitChange">
					<view class="quantitative-data-right-unit-input" :style="units === '' ? 'color: #CCCCCC;' : ''">
						{{units || "条"}}
					</view>
					<view class="right-icon dq-unit-chev">&gt;</view>
				</picker>
			</view>
		</view>

		<view class="line-select form-row" v-show="showColumns[0] == 1">
			<view class="line-select-left">
				<text class="picker-must">*</text>
				<text class="row-label">裂缝特征</text>
			</view>
			<view class="line-select-right crack-tags">
				<uni-data-checkbox mode="tag" wrap v-model="crackTypeIndex"
					:localdata="crackTypeOptions"></uni-data-checkbox>
			</view>
		</view>
		<view class="line-select form-row" v-show="showColumns[0] == 1 && quantity < threshold">
			<view class="line-select-left">
				<text class="row-label">计算位置关系</text>
			</view>
			<view class="line-select-right">
				<button class="input-right-button" @click="calculate">计算位置关系</button>
			</view>
		</view>

		<!-- 使用v-for循环生成多组定量数据输入框 -->
		<view v-for="(diseaseData, index) in diseaseDataList" :key="index" class="">
			<!-- 如果缺损数量大于1，显示缺损编号 -->
			<view v-if="diseaseDataList.length > 1" class="disease-index-title">
				缺损-{{index + 1}}
				<view class="disease-index-title-delete" @click="deleteIndexDisease(index)">
					<image src="/static/image/delete.png" class="delete-icon"></image>
				</view>
			</view>


			<view class="location-description form-row" v-show="showColumns[8] == 1">
				<view class="location-description-left">
					<text class="row-label">距参考面1位置</text>
				</view>
				<view class="location-description-right">
					<view class="ref-surface-inline">
						<text class="ref-dist-char">距</text>
						<view class="location-description-right-position" @click="openReferenceSurfacePopup(1, index)">
							<view class="location-description-right-position-input"
								:style="!diseaseData.reference1Location ? 'color: #CCCCCC;' : ''">
								{{ diseaseData.reference1Location || "请选择" }}
							</view>
							<view class="right-icon">&gt;</view>
						</view>
						<view class="reference-start">
							<input type="number" placeholder="起点位置" v-model="diseaseData.reference1LocationStart"
								class="input-text" placeholder-style="color: #CCCCCC;"
								@blur="formatToTwoDecimals('reference1LocationStart', index)">
							<image src="/static/image/clear.png" class="clear-icon"
								@click="clearReferenceSurfaceStart(index, 1)"></image>
						</view>
						<view class="reference-end">
							<input type="number" placeholder="终点位置" v-model="diseaseData.reference1LocationEnd"
								class="input-text" placeholder-style="color: #CCCCCC;"
								@blur="formatToTwoDecimals('reference1LocationEnd', index)">
							<image src="/static/image/clear.png" class="clear-icon"
								@click="clearReferenceSurfaceEnd(index, 1)"></image>
						</view>
						<view class="quantitative-data-right-unit ref-surface-unit">
							<view class="quantitative-data-right-unit-input">m</view>
						</view>
					</view>
				</view>
			</view>

			<view class="location-description form-row" v-show="showColumns[9] == 1">
				<view class="location-description-left">
					<text class="row-label">距参考面2位置</text>
				</view>
				<view class="location-description-right">
					<view class="ref-surface-inline">
						<text class="ref-dist-char">距</text>
						<view class="location-description-right-position" @click="openReferenceSurfacePopup(2, index)">
							<view class="location-description-right-position-input"
								:style="!diseaseData.reference2Location ? 'color: #CCCCCC;' : ''">
								{{ diseaseData.reference2Location || "请选择" }}
							</view>
							<view class="right-icon">&gt;</view>
						</view>
						<view class="reference-start">
							<input type="number" placeholder="起点位置" v-model="diseaseData.reference2LocationStart"
								class="input-text" placeholder-style="color: #CCCCCC;"
								@blur="formatToTwoDecimals('reference2LocationStart', index)">
							<image src="/static/image/clear.png" class="clear-icon"
								@click="clearReferenceSurfaceStart(index, 2)"></image>
						</view>
						<view class="reference-end">
							<input type="number" placeholder="终点位置" v-model="diseaseData.reference2LocationEnd"
								class="input-text" placeholder-style="color: #CCCCCC;"
								@blur="formatToTwoDecimals('reference2LocationEnd', index)">
							<image src="/static/image/clear.png" class="clear-icon"
								@click="clearReferenceSurfaceEnd(index, 2)"></image>
						</view>
						<view class="quantitative-data-right-unit ref-surface-unit">
							<view class="quantitative-data-right-unit-input">m</view>
						</view>
					</view>
				</view>
			</view>

			<!-- 长度 - 根据模式显示不同的输入框 -->
			<view class="quantitative-data form-row" v-show="showColumns[1] == 1">
				<view class="quantitative-data-left">
					<text class="row-label">长度</text>
				</view>
				<view class="quantitative-data-right">
					<!-- 范围模式 -->
					<template v-if="diseaseData.useRangeMode">
						<view class="quantitative-data-right-range">
							<view class="quantitative-data-right-value">
								<input class="quantitative-data-right-value-input" placeholder="最小值" type="number"
									v-model="diseaseData.lengthRangeStart" placeholder-style="color: #CCCCCC;"
									@blur="formatToTwoDecimals('lengthRangeStart', index)">
								<!--								<view class="clear-input" @click="diseaseData.lengthRangeStart = ''">×</view>-->
								<image src="/static/image/clear.png" class="clear-icon"
									@click="diseaseData.lengthRangeStart = ''"></image>
							</view>
							<view class="range-separator">-</view>
							<view class="quantitative-data-right-value">
								<input class="quantitative-data-right-value-input" placeholder="最大值" type="number"
									v-model="diseaseData.lengthRangeEnd" placeholder-style="color: #CCCCCC;"
									@blur="formatToTwoDecimals('lengthRangeEnd', index)">
								<!--								<view class="clear-input" @click="diseaseData.lengthRangeEnd = ''">×</view>-->
								<image src="/static/image/clear.png" class="clear-icon"
									@click="diseaseData.lengthRangeEnd = ''"></image>
							</view>
						</view>
					</template>
					<!-- 普通模式 -->
					<template v-else>
						<view class="quantitative-data-right-value length-input">
							<input class="quantitative-data-right-value-input" placeholder="请填写L1" type="number"
								v-model="diseaseData.length1" placeholder-style="color: #CCCCCC;"
								@blur="formatToTwoDecimals('length1', index)">
							<!--							<view class="clear-input" @click="diseaseData.length1 = ''">×</view>-->
							<image src="/static/image/clear.png" class="clear-icon" @click="diseaseData.length1 = ''">
							</image>
						</view>
						<view class="quantitative-data-right-value length-input"
							v-if="crackTypeIndex === 4 || crackTypeIndex === 5">
							<input class="quantitative-data-right-value-input" placeholder="请填写L2" type="number"
								v-model="diseaseData.length2" placeholder-style="color: #CCCCCC;"
								@blur="formatToTwoDecimals('length2', index)">
							<image src="/static/image/clear.png" class="clear-icon" @click="diseaseData.length2 = ''">
							</image>
						</view>
						<view class="quantitative-data-right-value length-input" v-if="crackTypeIndex === 5">
							<input class="quantitative-data-right-value-input" placeholder="请填写L3" type="number"
								v-model="diseaseData.length3" placeholder-style="color: #CCCCCC;"
								@blur="formatToTwoDecimals('length3', index)">
							<image src="/static/image/clear.png" class="clear-icon" @click="diseaseData.length3 = ''">
							</image>
						</view>
					</template>
					<view class="quantitative-data-right-unit">
						<view class="quantitative-data-right-unit-input"> m
						</view>
					</view>
				</view>
			</view>

			<!-- 缝宽 - 根据模式显示不同的输入框 -->
			<view class="quantitative-data form-row" v-show="showColumns[2] == 1">
				<view class="quantitative-data-left">
					<text class="row-label">缝宽</text>
				</view>
				<view class="quantitative-data-right">
					<!-- 范围模式 -->
					<template v-if="diseaseData.useRangeMode">
						<view class="quantitative-data-right-range">
							<view class="quantitative-data-right-value">
								<input class="quantitative-data-right-value-input" placeholder="最小值" type="number"
									v-model="diseaseData.crackWidthRangeStart" placeholder-style="color: #CCCCCC;"
									@blur="formatToTwoDecimals('crackWidthRangeStart', index)">
								<!--                <view class="clear-input" @click="diseaseData.crackWidthRangeStart = ''">×</view>-->
								<image src="/static/image/clear.png" class="clear-icon"
									@click="diseaseData.crackWidthRangeStart = ''"></image>
							</view>
							<view class="range-separator">-</view>
							<view class="quantitative-data-right-value">
								<input class="quantitative-data-right-value-input" placeholder="最大值" type="number"
									v-model="diseaseData.crackWidthRangeEnd" placeholder-style="color: #CCCCCC;"
									@blur="formatToTwoDecimals('crackWidthRangeEnd', index)">
								<!--                <view class="clear-input" @click="diseaseData.crackWidthRangeEnd = ''">×</view>-->
								<image src="/static/image/clear.png" class="clear-icon"
									@click="diseaseData.crackWidthRangeEnd = ''"></image>
							</view>
						</view>
					</template>
					<!-- 普通模式 -->
					<template v-else>
						<view class="quantitative-data-right-value">
							<input class="quantitative-data-right-value-input" placeholder="请填写" type="number"
								v-model="diseaseData.crackWidth" placeholder-style="color: #CCCCCC;"
								@blur="formatToTwoDecimals('crackWidth', index)">
							<!--              <view class="clear-input" @click="diseaseData.crackWidth = ''">×</view>-->
							<image src="/static/image/clear.png" class="clear-icon"
								@click="diseaseData.crackWidth = ''"></image>
						</view>
					</template>
					<view class="quantitative-data-right-unit">
						<view class="quantitative-data-right-unit-input">
							mm
						</view>
					</view>
				</view>
			</view>

			<!-- 高度/深度 - 根据模式显示不同的输入框 -->
			<view class="quantitative-data form-row" v-show="showColumns[3] == 1">
				<view class="quantitative-data-left">
					<text class="row-label">高度/深度</text>
				</view>
				<view class="quantitative-data-right">
					<!-- 范围模式 -->
					<template v-if="diseaseData.useRangeMode">
						<view class="quantitative-data-right-range">
							<view class="quantitative-data-right-value">
								<input class="quantitative-data-right-value-input" placeholder="最小值" type="number"
									v-model="diseaseData.heightDepthRangeStart" placeholder-style="color: #CCCCCC;"
									@blur="formatToTwoDecimals('heightDepthRangeStart', index)">
								<!--								<view class="clear-input" @click="diseaseData.heightDepthRangeStart = ''">×</view>-->
								<image src="/static/image/clear.png" class="clear-icon"
									@click="diseaseData.heightDepthRangeStart = ''"></image>
							</view>
							<view class="range-separator">-</view>
							<view class="quantitative-data-right-value">
								<input class="quantitative-data-right-value-input" placeholder="最大值" type="number"
									v-model="diseaseData.heightDepthRangeEnd" placeholder-style="color: #CCCCCC;"
									@blur="formatToTwoDecimals('heightDepthRangeEnd', index)">
								<!--								<view class="clear-input" @click="diseaseData.heightDepthRangeEnd = ''">×</view>-->
								<image src="/static/image/clear.png" class="clear-icon"
									@click="diseaseData.heightDepthRangeEnd = ''"></image>
							</view>
						</view>
					</template>
					<!-- 普通模式 -->
					<template v-else>
						<view class="quantitative-data-right-value">
							<input class="quantitative-data-right-value-input" placeholder="请填写" type="number"
								v-model="diseaseData.heightDepth" placeholder-style="color: #CCCCCC;"
								@blur="formatToTwoDecimals('heightDepth', index)">
							<!--							<view class="clear-input" @click="diseaseData.heightDepth = ''">×</view>-->
							<image src="/static/image/clear.png" class="clear-icon"
								@click="diseaseData.heightDepth = ''"></image>
						</view>
					</template>
					<view class="quantitative-data-right-unit">
						<view class="quantitative-data-right-unit-input"> m
						</view>
					</view>
				</view>
			</view>

			<!-- 面积 - 根据模式显示不同的输入框 -->
			<view class="quantitative-data form-row" v-show="showColumns[4] == 1">
				<view class="quantitative-data-left">
					<text class="row-label">面积</text>
				</view>
				<view class="quantitative-data-right">
					<!-- 范围模式 -->
					<!--					<template v-if="diseaseData.useRangeMode">-->
					<view class="quantitative-data-right-range">
						<picker class="area-picker" :range="areaPicker" @change="(e) => onAreaChange(e, index)"
							v-if="diseaseData.useRangeMode">
							<view class="area-picker-input"
								:style="!diseaseData.areaIdentifier ? 'color: #CCCCCC;' : ''">
								{{diseaseData.areaIdentifier === 1 ? '平均' : diseaseData.areaIdentifier === 2 ? '总计' : '请选择'}}
							</view>
							<text class="picker-icon">&gt;</text>
						</picker>
						<view class="quantitative-data-right-value">
							<input class="quantitative-data-right-value-input" placeholder="请填写" type="number"
								v-model="diseaseData.areaLength" placeholder-style="color: #CCCCCC;"
								@blur="formatToTwoDecimals('areaLength', index)">
							<!--								<view class="clear-input" @click="diseaseData.areaLength = ''">×</view>-->
							<image src="/static/image/clear.png" class="clear-icon"
								@click="diseaseData.areaLength = ''"></image>
						</view>
						<view class="range-separator">×</view>
						<view class="quantitative-data-right-value">
							<input class="quantitative-data-right-value-input" placeholder="请填写" type="number"
								v-model="diseaseData.areaWidth" placeholder-style="color: #CCCCCC;"
								@blur="formatToTwoDecimals('areaWidth', index)">
							<!--								<view class="clear-input" @click="diseaseData.areaWidth = ''">×</view>-->
							<image src="/static/image/clear.png" class="clear-icon" @click="diseaseData.areaWidth = ''">
							</image>
						</view>
					</view>
					<!--					</template>-->
					<!-- 普通模式 -->
					<!--					<template v-else>
						<view class="quantitative-data-right-value">
							<input class="quantitative-data-right-value-input" placeholder="请填写" type="number"
								v-model="diseaseData.area">
							<view class="clear-input" @click="diseaseData.area = ''">×</view>
						</view>
					</template>-->
					<view class="quantitative-data-right-unit">
						<view class="quantitative-data-right-unit-input"> m² </view>
					</view>
				</view>
			</view>

			<!-- 体积 - 根据模式显示不同的输入框 -->
			<view class="quantitative-data form-row" v-show="showColumns[5] == 1">
				<view class="quantitative-data-left">
					<text class="row-label">变形/位移</text>
				</view>
				<view class="quantitative-data-right">
					<!-- 范围模式 -->
					<template v-if="diseaseData.useRangeMode">
						<view class="quantitative-data-right-range">
							<view class="quantitative-data-right-value">
								<input class="quantitative-data-right-value-input" placeholder="最小值" type="number"
									v-model="diseaseData.deformationRangeStart" placeholder-style="color: #CCCCCC;"
									@blur="formatToTwoDecimals('deformationRangeStart', index)">
								<!--								<view class="clear-input" @click="diseaseData.deformationRangeStart = ''">×</view>-->
								<image src="/static/image/clear.png" class="clear-icon"
									@click="diseaseData.deformationRangeStart = ''"></image>
							</view>
							<view class="range-separator">-</view>
							<view class="quantitative-data-right-value">
								<input class="quantitative-data-right-value-input" placeholder="最大值" type="number"
									v-model="diseaseData.deformationRangeEnd" placeholder-style="color: #CCCCCC;"
									@blur="formatToTwoDecimals('deformationRangeEnd', index)">
								<!--								<view class="clear-input" @click="diseaseData.deformationRangeEnd = ''">×</view>-->
								<image src="/static/image/clear.png" class="clear-icon"
									@click="diseaseData.deformationRangeEnd = ''"></image>
							</view>
						</view>
					</template>
					<!-- 普通模式 -->
					<template v-else>
						<view class="quantitative-data-right-value">
							<input class="quantitative-data-right-value-input" placeholder="请填写" type="number"
								v-model="diseaseData.deformation" placeholder-style="color: #CCCCCC;"
								@blur="formatToTwoDecimals('deformation', index)">
							<!--							<view class="clear-input" @click="diseaseData.deformation = ''">×</view>-->
							<image src="/static/image/clear.png" class="clear-icon"
								@click="diseaseData.deformation = ''"></image>
						</view>
					</template>
					<view class="quantitative-data-right-unit">
						<view class="quantitative-data-right-unit-input"> mm
						</view>
					</view>
				</view>
			</view>

			<!-- 角度 - 根据模式显示不同的输入框 -->
			<view class="quantitative-data form-row" v-show="showColumns[6] == 1">
				<view class="quantitative-data-left">
					<text class="row-label">角度</text>
				</view>
				<view class="quantitative-data-right">
					<!-- 范围模式 -->
					<template v-if="diseaseData.useRangeMode">
						<view class="quantitative-data-right-range">
							<view class="quantitative-data-right-value">
								<input class="quantitative-data-right-value-input" placeholder="最小值" type="number"
									v-model="diseaseData.angleRangeStart" placeholder-style="color: #CCCCCC;"
									@blur="formatToTwoDecimals('angleRangeStart', index)">
								<!--								<view class="clear-input" @click="diseaseData.angleRangeStart = ''">×</view>-->
								<image src="/static/image/clear.png" class="clear-icon"
									@click="diseaseData.angleRangeStart = ''"></image>
							</view>
							<view class="range-separator">-</view>
							<view class="quantitative-data-right-value">
								<input class="quantitative-data-right-value-input" placeholder="最大值" type="number"
									v-model="diseaseData.angleRangeEnd" placeholder-style="color: #CCCCCC;"
									@blur="formatToTwoDecimals('angleRangeEnd', index)">
								<!--								<view class="clear-input" @click="diseaseData.angleRangeEnd = ''">×</view>-->
								<image src="/static/image/clear.png" class="clear-icon"
									@click="diseaseData.angleRangeEnd = ''"></image>
							</view>
						</view>
					</template>
					<!-- 普通模式 -->
					<template v-else>
						<view class="quantitative-data-right-value">
							<input class="quantitative-data-right-value-input" placeholder="请填写" type="number"
								v-model="diseaseData.angle" placeholder-style="color: #CCCCCC;"
								@blur="formatToTwoDecimals('angle', index)">
							<!--							<view class="clear-input" @click="diseaseData.angle = ''">×</view>-->
							<image src="/static/image/clear.png" class="clear-icon" @click="diseaseData.angle = ''">
							</image>
						</view>
					</template>
					<view class="quantitative-data-right-unit">
						<view class="quantitative-data-right-unit-input"> 度
						</view>
					</view>
				</view>
			</view>

			<!-- 百分比 - 根据模式显示不同的输入框 -->
			<view class="quantitative-data form-row" v-show="showColumns[7] == 1">
				<view class="quantitative-data-left">
					<text class="row-label">比例</text>
				</view>
				<view class="quantitative-data-right">
					<!-- 范围模式 -->
					<!--					<template v-if="diseaseData.useRangeMode">-->
					<view class="quantitative-data-right-range">
						<view class="quantitative-data-right-value">
							<input class="quantitative-data-right-value-input" placeholder="请填写" type="number"
								v-model="diseaseData.numeratorRatio" placeholder-style="color: #CCCCCC;"
								@blur="formatToTwoDecimals('numeratorRatio', index)">
							<!--								<view class="clear-input" @click="diseaseData.numeratorRatio = ''">×</view>-->
							<image src="/static/image/clear.png" class="clear-icon"
								@click="diseaseData.numeratorRatio = ''"></image>
						</view>
						<view class="range-separator">/</view>
						<view class="quantitative-data-right-value ratio-denom">
							<input class="quantitative-data-right-value-input ratio-denom-input" placeholder="请填写"
								type="number" v-model="diseaseData.denominatorRatio"
								placeholder-style="color: #CCCCCC;" @blur="formatToTwoDecimals('denominatorRatio', index)">
							<image src="/static/image/clear.png" class="clear-icon"
								@click="diseaseData.denominatorRatio = '100'"></image>
						</view>
					</view>
				</view>
			</view>

			<uni-popup ref="referenceSurfacePopup" type="center">
				<view class="location-description-position-popup-content">
					<view class="location-description-position-popup-title">参考面选择</view>
					<view class="location-description-position-popup-input1">
						<input type="text" placeholder="请填写" class="location-description-popup-input"
							v-model="referenceSurfaceInput" />
						<button class="location-description-popup-button"
							@click="confirmreferenceSurfaceInput">确定</button>
					</view>
					<view class="location-description-position-popup-input3">
						<view v-for="(item, index) in referenceSurfaceOptions" :key="index"
							class="location-description-position-popup-input3-item"
							@click="selectReferenceSurfaceItem(item)">
							{{item}}
						</view>
					</view>
				</view>
			</uni-popup>

			<uni-popup ref="deleteIndexDiseasePopup" type="center">
				<view class="deleteIndexDisease-popup-content">
					<view class="popup-title">删除单条缺省记录</view>
					<view class="popup-content">
						您将删除当前选中的缺损记录，是否确定删除？
					</view>
					<view class="popup-button">
						<button class="popup-button-cancel" @click="closeDeleteIndexDiseasePopup">取消</button>
						<button class="popup-button-confirm" @click="confirmDeleteIndexDisease">确定</button>
					</view>
				</view>
			</uni-popup>

		</view>

	</view>
</template>

<script setup>
	// 添加一个数组来存储多个缺损的数据
	import {
		computed,
		onMounted,
		onUnmounted,
		ref,
		watch
	} from "vue";

	// 判断病害数据是否加载完成
	let isInitialized = false;

	const diseaseDataList = ref([]);

	// 缺损数量
	const quantity = ref(1);

	const crackTypeOptions = ref([{
			text: '纵向',
			value: 0
		},
		{
			text: '横向',
			value: 1
		},
		{
			text: '竖向',
			value: 2
		},
		{
			text: '斜向',
			value: 3
		},
		{
			text: 'L型',
			value: 4
		},
		{
			text: 'U型',
			value: 5
		}, {
			text: '网状',
			value: 6
		}
	])
	const crackTypeIndex = ref(0);

	const areaPicker = ref(['平均', '总计'])
	const onAreaChange = (e, diseaseIndex) => {
		const index = e.detail.value;
		// 更新指定缺损的areaIdentifier值
		diseaseDataList.value[diseaseIndex].areaIdentifier = index + 1; // 因为索引从0开始，而我们需要1和2的值
	}

  // 删除缺损记录弹窗引用
	const deleteIndexDiseasePopup = ref(null);

	// 添加当前编辑的缺损索引
	const currentDiseaseIndex = ref(0);

	// 参考面弹窗引用
	const referenceSurfacePopup = ref(null);

	// 当前选择的是参考面1还是参考面2
	const currentReferenceSurface = ref(1);

	// 参考面输入框的值
	const referenceSurfaceInput = ref('');

	// 参考面选项列表
	const referenceSurfaceOptions = ref([]);

	const positionProps = ref('')

	const selectedColumn = ref(0)

	const showColumns = ref([])

	/**
	 * DB/模板均未给出有效位图时的兜底（与裂缝特征默认分支一致），至少保证常见定量行可填；
	 * 勿再用「仅缺损数量」单列，否则所有病害看起来只剩一行。
	 */
	const DEFAULT_QUANT_SHOW_COLUMNS = Object.freeze(
		['1', '1', '1', '1', '0', '0', '0', '0', '1', '1', '1', '0']
	)

	/** 最近一次按病害类型解码得到的列（裂缝子类 watch 在此基础上叠裂缝模板，不再整表覆盖） */
	const quantColumnsFromType = ref([])

	/** 为 true 时忽略 select_column 位图，始终展示全部定量行（调 UI / 对照设计稿用）。发版前请改为 false */
	const SHOW_ALL_QUANT_ROWS = false

	const quantColShow = (bitIndex) => {
		if (SHOW_ALL_QUANT_ROWS) return true
		const v = showColumns.value[bitIndex]
		return v == 1 || v === '1'
	}

	const threshold = ref(1)

	const units = ref('')

	const quantityUnits = ref(['处', '条', '个'])

	const quantityUnitChange = (e) => {
		const index = e.detail.value;
		units.value = quantityUnits.value[index]
	}

	const onQuantityBlur = () => {
		const n = parseInt(String(quantity.value), 10)
		if (isNaN(n) || n < 1) {
			quantity.value = 1
		}
	}

	watch([quantity, diseaseDataList, crackTypeIndex], (newValues, oldValues) => {
		if (isInitialized) {
			uni.$emit('changeDiseaseData')
		}
	}, {
		deep: true
	})

	const calculate = () => {
		if (showColumns.value[0] === '1') {
			if (crackTypeIndex.value === 0 || crackTypeIndex.value === 1 || crackTypeIndex.value === 2 ||
				crackTypeIndex.value === 3) {
				diseaseDataList.value.forEach((diseaseData, index) => {
					// 计算参考面1的长度
					if (diseaseData.reference1LocationStart !== '' && diseaseData
						.reference1LocationEnd !== '' && diseaseData.reference2LocationStart !== '' &&
						diseaseData.reference2LocationEnd !== '') {
						console.log('计算长度')
						const x1 = parseFloat(diseaseData.reference1LocationStart);
						const y1 = parseFloat(diseaseData.reference2LocationStart);
						const x2 = parseFloat(diseaseData.reference1LocationEnd);
						const y2 = parseFloat(diseaseData.reference2LocationEnd);
						if (!isNaN(x1) && !isNaN(y1) && !isNaN(x2) && !isNaN(y2)) {
							const dx = x2 - x1;
							const dy = y2 - y1;
							diseaseData.length1 = Math.sqrt(dx * dx + dy * dy).toFixed(2);
						}
						if (crackTypeIndex.value === 3) {
							const dx = x2 - x1;
							const dy = y2 - y1;
							diseaseData.angle = (Math.atan2(dy, dx) * 180 / Math.PI).toFixed(2);
						}
					} else if (diseaseData.reference1LocationStart !== '' && diseaseData
						.reference2LocationStart !== '' && diseaseData.length1 !== '') {
						console.log('计算终点')
						if (crackTypeIndex.value === 0 || crackTypeIndex.value === 2) {
							diseaseData.reference1LocationEnd = ((parseFloat(diseaseData
								.reference1LocationStart)) + (parseFloat(diseaseData.length1))).toFixed(2);
							diseaseData.reference2LocationEnd = parseFloat(diseaseData.reference2LocationStart)
								.toFixed(2);
						} else if (crackTypeIndex.value === 1) {
							diseaseData.reference1LocationEnd = parseFloat(diseaseData.reference1LocationStart)
								.toFixed(2);
							diseaseData.reference2LocationEnd = (parseFloat(diseaseData
								.reference2LocationStart) + parseFloat(diseaseData.length1)).toFixed(2);
						} else if (crackTypeIndex.value === 3 && diseaseData.angle !== '') {
							diseaseData.reference1LocationEnd = (parseFloat(diseaseData
								.reference1LocationStart) + parseFloat(diseaseData.length1) * Math.cos(
								parseFloat(diseaseData.angle) / 180 * Math.PI)).toFixed(2);
							diseaseData.reference2LocationEnd = (parseFloat(diseaseData
								.reference2LocationStart) + parseFloat(diseaseData.length1) * Math.sin(
								parseFloat(diseaseData.angle) / 180 * Math.PI)).toFixed(2);
						}
					} else if (diseaseData.reference1LocationEnd !== '' && diseaseData
						.reference2LocationEnd !== '' && diseaseData.length1 !== '') {
						console.log('计算起点')
						if (crackTypeIndex.value === 0 || crackTypeIndex.value === 2) {
							diseaseData.reference1LocationStart = parseFloat(diseaseData
								.reference1LocationEnd) - parseFloat(diseaseData.length1).toFixed(2);
							diseaseData.reference2LocationStart = parseFloat(diseaseData.reference2LocationEnd)
								.toFixed(2);
						} else if (crackTypeIndex.value === 1) {
							diseaseData.reference1LocationStart = parseFloat(diseaseData.reference1LocationEnd)
								.toFixed(2);
							diseaseData.reference2LocationStart = (parseFloat(diseaseData
								.reference2LocationEnd) - parseFloat(diseaseData.length1)).toFixed(2);
						} else if (crackTypeIndex.value === 2 && diseaseData.angle !== '') {
							diseaseData.reference1LocationStart = (parseFloat(diseaseData
								.reference1LocationEnd) - parseFloat(diseaseData.length1) * Math.cos(
								parseFloat(diseaseData.angle) / 180 * Math.PI)).toFixed(2);
							diseaseData.reference2LocationStart = (parseFloat(diseaseData
								.reference2LocationEnd) - parseFloat(diseaseData.length1) * Math.sin(
								parseFloat(diseaseData.angle) / 180 * Math.PI)).toFixed(2);
						}
					}
				});
			}
		}
	};

	const CRACK_QUANT_TPL = {
		6: ['1', '0', '1', '1', '1', '0', '0', '0', '1', '1', '1', '0'],
		3: ['1', '1', '1', '1', '0', '0', '1', '0', '1', '1', '1', '0'],
		_default: ['1', '1', '1', '1', '0', '0', '0', '0', '1', '1', '1', '0'],
	}

	/** 裂缝子类模板：在「当前病害 select_column」基础上叠显，不把各病害差异抹平 */
	function applyCrackTemplateOverlay() {
		const base = quantColumnsFromType.value
		if (!base?.length) return
		if (base[0] !== '1' && base[0] !== 1) {
			showColumns.value = [...base]
			return
		}
		const k = crackTypeIndex.value
		const tpl =
			k === 6 ? CRACK_QUANT_TPL[6] : k === 3 ? CRACK_QUANT_TPL[3] : CRACK_QUANT_TPL._default
		showColumns.value = base.map((b, i) => (tpl[i] === '1' || tpl[i] === 1 ? '1' : b))
	}

	watch(() => crackTypeIndex.value, () => {
		console.log('crackTypeIndex改变------------', crackTypeIndex.value)
		applyCrackTemplateOverlay()
		if (isInitialized === true) {
			clearDiseaseData()
		}
	})

	// 添加onMounted处理可能的初始值
	onMounted(() => {
		updateDiseaseDataList(1);
		uni.$on('setPositionProps', setPositionProps)
		uni.$on('getDescription', getDescription);
		uni.$on('setQuantity', setQuantity);
		uni.$on('setDiseaseDataList', setDiseaseDataList);
		uni.$on('setCrackType', setCrackType);
		uni.$on('setSelectColumn', setSelectColumn)
		uni.$on('clearDiseaseData', clearDiseaseData)
		uni.$on('setThreshold', setThreshold)
		uni.$on('setUnits', setUnits)
		setTimeout(() => {
			isInitialized = true
			console.log('表单初始化完成，开始检测修改')
		}, 500)
	})
	onUnmounted(() => {
		uni.$off('setPositionProps');
		uni.$off('getDescription');
		uni.$off('setQuantity');
		uni.$off('setDiseaseDataList');
		uni.$off('setCrackType');
		uni.$off('setSelectColumn');
		uni.$off('clearDiseaseData');
		uni.$off('setThreshold');
		uni.$off('setUnits');
	})
	const setUnits = (emitUnits) => {
		units.value = emitUnits
	}
	const setThreshold = (thresholdnum) => {
		threshold.value = thresholdnum
	}
	const setSelectColumn = (emitSelectColumn) => {
		console.log('setSelectColumn:', emitSelectColumn)
		const rawStr =
			emitSelectColumn === null || emitSelectColumn === undefined || emitSelectColumn === ''
				? ''
				: String(emitSelectColumn).trim()
		const parsedInt = rawStr === '' ? NaN : parseInt(rawStr, 10)
		let n =
			emitSelectColumn === true
				? 1
				: Number.isFinite(parsedInt) && parsedInt >= 0
					? parsedInt
					: Number(emitSelectColumn)
		if (!Number.isFinite(n) || n < 0) n = 0
		selectedColumn.value = n
		let cols = n.toString(2).padStart(12, '0').split('').reverse()
		if (!cols.some((c) => c === '1')) {
			cols = [...DEFAULT_QUANT_SHOW_COLUMNS]
			selectedColumn.value = cols.reduce((acc, ch, i) => acc + (ch === '1' ? 2 ** i : 0), 0)
		}
		quantColumnsFromType.value = [...cols]
		applyCrackTemplateOverlay()
		console.log('showColumns:', showColumns.value)
		if (showColumns.value[0] == '1') {
			units.value = '条'
		} else {
			units.value = '处'
		}
	}
	const clearDiseaseData = () => {
		diseaseDataList.value = []
		updateDiseaseDataList(1)
		quantity.value = 1
	}

	const setCrackType = (crack) => {
		crackTypeIndex.value = crackTypeOptions.value.findIndex(item => item.text === crack)
	}

	const setQuantity = (num) => {
		quantity.value = num
	}

	const setDiseaseDataList = (list) => {
		diseaseDataList.value = list
	}

	const setPositionProps = (props) => {
		console.log('设置positionProps:', props)
		positionProps.value = props
	}

	//传递病害描述所需数据
	const getDescription = () => {
		const description = {
			crackType: crackType.value, // 裂缝特征
			showColumns: showColumns.value, //判断是否显示裂缝特征
			defects: diseaseDataList.value, // 病害定量数据数组
			counts: quantity.value, // 病害数量
			units: units.value, // 单位
			threshold: threshold.value, // 阈值
		};
		uni.$emit('setDescription2', description);
	}

	// 监听缺损数量变化，动态更新diseaseDataList
	watch(quantity, (newValue) => {
		const numValue = parseInt(newValue);
		if (isNaN(numValue) || numValue <= 0) {
			// 如果输入无效，设为默认值1
			updateDiseaseDataList(1);
		} else if (numValue >= threshold.value) {
			// 限制最大数量为阈值，并且使用范围输入模式
			quantity.value = numValue;
			updateDiseaseDataList(numValue);
		} else {
      console.log('从else进入',numValue)
			updateDiseaseDataList(numValue);
		}
	});

	// 更新缺损数据列表
	const updateDiseaseDataList = (count) => {
		// 保存现有数据
		const existingData = [...diseaseDataList.value];

		// 创建新的数据列表
		const newList = [];

		// 自动判断是否使用范围模式
		const useRangeMode = count >= threshold.value;
		console.log(`数量: ${count}, 使用范围模式: ${useRangeMode}`);

		// 如果数量大于等于阈值，只创建一条记录，使用范围模式
		if (useRangeMode) {
			// 如果已有数据，尝试保留第一条的值作为范围的起始值
			const firstItem = existingData.length > 0 ? existingData[0] : null;
			console.log('范围模式，使用第一条记录作为基础:', firstItem ? firstItem : 'null');

			newList.push({
				reference1Location: firstItem?.reference1Location || '',
				reference1LocationStart: firstItem?.reference1LocationStart || '',
				reference1LocationEnd: firstItem?.reference1LocationEnd || '',
				reference2Location: firstItem?.reference2Location || '',
				reference2LocationStart: firstItem?.reference2LocationStart || '',
				reference2LocationEnd: firstItem?.reference2LocationEnd || '',
				// 范围输入字段 - 保留现有的范围数据
				lengthRangeStart: firstItem?.lengthRangeStart || firstItem?.length || '',
				lengthRangeEnd: firstItem?.lengthRangeEnd || '',
				/*				widthRangeStart: firstItem?.widthRangeStart || firstItem?.width || '',
								widthRangeEnd: firstItem?.widthRangeEnd || '',*/
				heightDepthRangeStart: firstItem?.heightDepthRangeStart || firstItem?.heightDepth || '',
				heightDepthRangeEnd: firstItem?.heightDepthRangeEnd || '',
				crackWidthRangeStart: firstItem?.crackWidthRangeStart || firstItem?.crackWidth || '',
				crackWidthRangeEnd: firstItem?.crackWidthRangeEnd || '',
				areaLength: firstItem?.areaLength || '',
				areaWidth: firstItem?.areaWidth || '',
				areaIdentifier: firstItem?.areaIdentifier || '',
				deformationRangeStart: firstItem?.deformationRangeStart || firstItem?.deformation || '',
				deformationRangeEnd: firstItem?.deformationRangeEnd || '',
				angleRangeStart: firstItem?.angleRangeStart || firstItem?.angle || '',
				angleRangeEnd: firstItem?.angleRangeEnd || '',
				numeratorRatio: firstItem?.numeratorRatio || firstItem?.percentage || '',
				denominatorRatio: firstItem?.denominatorRatio || '100',
				// 保留原有字段为空
				length1: '',
				length2: '',
				length3: '',
				// width: '',
				heightDepth: '',
				crackWidth: '',
				// area: '',
				deformation: '',
				angle: '',
				// percentage: '',
				// crackTypeIndex: firstItem?.crackTypeIndex || 0,
				// developmentTrendIndex: firstItem?.developmentTrendIndex || 0,
				useRangeMode: true
			});

			console.log('更新后的范围模式数据:', newList[0]);
		} else {
			// 正常模式，为每个缺损创建一条记录
			for (let i = 0; i < count; i++) {
				// 如果有现有数据，保留它
				if (i < existingData.length) {
					// 如果之前是范围模式，需要转换回普通模式
					if (existingData[i].useRangeMode) {
						newList.push({
							reference1Location: existingData[i].reference1Location || '',
							reference1LocationStart: existingData[i].reference1LocationStart || '',
							reference1LocationEnd: existingData[i].reference1LocationEnd || '',
							reference2Location: existingData[i].reference2Location || '',
							reference2LocationStart: existingData[i].reference2LocationStart || '',
							reference2LocationEnd: existingData[i].reference2LocationEnd || '',
							// 使用Min值作为普通模式的值
							length1: existingData[i].lengthRangeStart || '',
							length2: existingData[i].lengthRangeEnd || '',
							length3: existingData[i].lengthRangeEnd || '',
							// width: existingData[i].widthRangeStart || '',
							heightDepth: existingData[i].heightDepthRangeStart || '',
							crackWidth: existingData[i].crackWidthRangeStart || '',
							areaLength: existingData[i].areaLength || '',
							areaWidth: existingData[i].areaWidth || '',
							areaIdentifier: existingData[i].areaIdentifier || '',
							deformation: existingData[i].deformationRangeStart || '',
							angle: existingData[i].angleRangeStart || '',
							// percentage: existingData[i].numeratorRatio || '',
							// crackTypeIndex: existingData[i].crackTypeIndex || 0,
							// developmentTrendIndex: existingData[i].developmentTrendIndex || 0,
							numeratorRatio: existingData[i].numeratorRatio || '',
							denominatorRatio: existingData[i].denominatorRatio || '100',
							useRangeMode: false
						});
					} else {
						// 保持原有数据不变
						newList.push(existingData[i]);
					}
				} else {
					// 创建新的数据对象
					newList.push({
						reference1Location: '',
						reference1LocationStart: '',
						reference1LocationEnd: '',
						reference2Location: '',
						reference2LocationStart: '',
						reference2LocationEnd: '',
						length1: '',
						length2: '',
						length3: '',
						// width: '',
						crackWidth: '',
						heightDepth: '',
						areaLength: '',
						areaWidth: '',
						areaIdentifier: '',
						deformation: '',
						angle: '',
						numeratorRatio: '',
						denominatorRatio: '100',
						// percentage: '',
						// crackTypeIndex: 0,
						// developmentTrendIndex: 0,
						useRangeMode: false
					});
				}
			}
		}

		diseaseDataList.value = newList;
	};

  // 删除的索引
  const deleteIndex = ref(-1);

  // 打开删除的病害弹窗
	const deleteIndexDisease = (index) => {
		deleteIndex.value = index;
    deleteIndexDiseasePopup.value[0].open();
	};

  // 确认弹窗删除
  const confirmDeleteIndexDisease = () =>{
    diseaseDataList.value.splice(deleteIndex.value, 1);
    quantity.value--;
    closeDeleteIndexDiseasePopup();
  }

  // 关闭删除弹窗
  const closeDeleteIndexDiseasePopup = () => {
    deleteIndexDiseasePopup.value[0].close();
    deleteIndex.value = -1;
  }

	// 打开参考面选择弹窗
	const openReferenceSurfacePopup = (surfaceNumber = 1, diseaseIndex = 0) => {
		console.log('打开参考面选择弹窗:', surfaceNumber, diseaseIndex)
		// 设置当前正在编辑的是参考面1还是参考面2，以及缺损索引
		currentReferenceSurface.value = surfaceNumber;
		currentDiseaseIndex.value = diseaseIndex;

		// 清空输入框
		referenceSurfaceInput.value = '';

		// 解析props中的参考面选项
		if (positionProps.value !== '') {
			const options = parsePropsForRef(positionProps.value, `ref${surfaceNumber}`);
			if (options && options.length > 0) {
				referenceSurfaceOptions.value = options;
				console.log(`解析到参考面${surfaceNumber}选项:`, options);
			} else {
				// 如果没有找到对应的参考面选项，使用默认选项
				setDefaultReferenceSurfaceOptions(surfaceNumber);
			}
		} else {
			// 如果没有找到props，使用默认选项
			setDefaultReferenceSurfaceOptions(surfaceNumber);
		}

		// 打开弹窗
		referenceSurfacePopup.value[0].open();
	};

	// 设置默认参考面选项
	const setDefaultReferenceSurfaceOptions = (surfaceNumber) => {
		if (surfaceNumber === 1) {
			referenceSurfaceOptions.value = [];
		} else {
			referenceSurfaceOptions.value = [];
		}
		console.log(`使用默认参考面${surfaceNumber}选项:`, referenceSurfaceOptions.value);
	};

	// 解析props字符串中指定ref的选项
	const parsePropsForRef = (propsString, refKey) => {
		console.log('解析props字符串中指定ref的选项:', propsString, refKey)
		if (!propsString) return [];

		// 尝试解析格式为 "ref1:=小桩号面、大桩号面&&ref2:=左腹板、右腹板、内腹板、外腹板" 的字符串
		const refParts = propsString.split('&&');

		for (const refPart of refParts) {
			if (refPart.startsWith(refKey + ':=')) {
				const parts = refPart.split(':=');
				if (parts.length === 2) {
					const values = parts[1].split('、');
					return values.filter(value => value.trim() !== '');
				}
			}
		}
		return [];
	};

	// 确认参考面输入框的值
	const confirmreferenceSurfaceInput = () => {
		if (!referenceSurfaceInput.value.trim()) {
			uni.showToast({
				title: '请输入参考面',
				icon: 'none'
			});
			return;
		}

		// 根据当前编辑的是参考面1还是参考面2，设置相应的值
		if (currentReferenceSurface.value === 1) {
			diseaseDataList.value[currentDiseaseIndex.value].reference1Location = referenceSurfaceInput.value.trim();
		} else {
			diseaseDataList.value[currentDiseaseIndex.value].reference2Location = referenceSurfaceInput.value.trim();
		}

		// 关闭弹窗
		referenceSurfacePopup.value[0].close();
	};

	// 选择参考面列表中的项
	const selectReferenceSurfaceItem = (item) => {
		// 根据当前编辑的是参考面1还是参考面2，设置相应的值
		if (currentReferenceSurface.value === 1) {
			diseaseDataList.value[currentDiseaseIndex.value].reference1Location = item;
		} else {
			diseaseDataList.value[currentDiseaseIndex.value].reference2Location = item;
		}

		// 关闭弹窗
		referenceSurfacePopup.value[0].close();
	};

	const clearReferenceSurfaceStart = (diseaseIndex, surfaceNumber) => {
		if (surfaceNumber === 1) {
			diseaseDataList.value[diseaseIndex].reference1LocationStart = '';
		} else {
			diseaseDataList.value[diseaseIndex].reference2LocationStart = '';
		}
	};

	const clearReferenceSurfaceEnd = (diseaseIndex, surfaceNumber) => {
		if (surfaceNumber === 1) {
			diseaseDataList.value[diseaseIndex].reference1LocationEnd = '';
		} else {
			diseaseDataList.value[diseaseIndex].reference2LocationEnd = '';
		}
	};

	const crackType = computed(() => {
		return crackTypeOptions.value[crackTypeIndex.value].text;
	})

	// 格式化数值为2位小数
	const formatToTwoDecimals = (fieldName, diseaseIndex) => {
		const value = diseaseDataList.value[diseaseIndex][fieldName];
		if (value && value !== '') {
			const numValue = parseFloat(value);
			if (!isNaN(numValue)) {
				diseaseDataList.value[diseaseIndex][fieldName] = numValue.toFixed(2);
			}
		}
	};

	defineExpose({
		quantity: quantity,
		crackType: crackType,
		diseaseDataList: diseaseDataList,
		units: units,
	});
</script>

<style scoped>
	.head {
		background-color: #BDCBE0;
	}

	.head-text {
		padding: 4rpx 10rpx;
		font-size: 18rpx;
	}

	.picker-must {
		color: #ff0000;
		margin-right: 4rpx;
	}

	/* 与病害定性数据区块行风格一致：左标签、右控件、浅分割线 */
	.form-row {
		padding: 12rpx 16rpx;
		border-bottom: 1rpx solid #eeeeee;
	}

	.row-label {
		font-size: 20rpx;
		color: #666666;
	}

	.location-description {
		font-size: 20rpx;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
	}

	.location-description-left {
		flex-shrink: 0;
		max-width: 38%;
		padding-right: 12rpx;
	}

	.location-description-right {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: flex-end;
		flex: 1;
		min-width: 0;
	}

	.ref-surface-inline {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		align-items: center;
		justify-content: flex-end;
		flex: 1;
		min-width: 0;
		gap: 8rpx;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	.ref-dist-char {
		flex-shrink: 0;
		font-size: 20rpx;
		color: #333333;
	}

	.location-description-right-position {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		border: 1rpx solid #d9d9d9;
		border-radius: 6rpx;
		padding: 6rpx 10rpx;
		min-width: 108rpx;
		max-width: 200rpx;
		flex-shrink: 0;
		background-color: #ffffff;
	}

	.reference-start,
	.reference-end {
		flex: 0 0 auto;
		width: 124rpx;
		min-width: 112rpx;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		border: 1rpx solid #d9d9d9;
		border-radius: 6rpx;
		padding: 6rpx 8rpx;
		background-color: #ffffff;
	}

	.ref-surface-unit {
		margin-left: 0;
		flex-shrink: 0;
	}

	.right-icon {
		margin-left: 8rpx;
		color: #cccccc;
		font-size: 20rpx;
	}

	.quantitative-data {
		font-size: 20rpx;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
	}

	.quantitative-data-left {
		display: flex;
		flex-direction: row;
		align-items: center;
		flex-shrink: 0;
		max-width: 40%;
		padding-right: 12rpx;
	}

	.quantitative-data-right {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: flex-end;
		flex: 1;
		min-width: 0;
		flex-wrap: wrap;
		gap: 8rpx;
	}

	.quantitative-data-right-value {
		display: flex;
		flex-direction: row;
		align-items: center;
		border: 1rpx solid #d9d9d9;
		border-radius: 6rpx;
		padding: 6rpx 10rpx;
		background-color: #ffffff;
	}

	.quantitative-data-right-value-input {
		min-width: 88rpx;
		width: 100rpx;
		font-size: 18rpx;
		color: #333333;
	}

	.ratio-denom-input {
		width: 112rpx;
	}

	.quantitative-data-right-unit {
		margin-left: 4rpx;
		padding: 4rpx 0;
		flex-shrink: 0;
	}

	.quantitative-data-right-unit-input {
		font-size: 20rpx;
		color: #333333;
	}

	.dq-qty-box {
		min-width: 140rpx;
	}

	.dq-qty-input {
		flex: 1;
		min-width: 0;
		width: 80rpx;
	}

	.dq-unit-picker {
		border: none;
		display: flex;
		flex-direction: row;
		align-items: center;
		width: auto;
		min-width: 52rpx;
		padding: 0 4rpx;
	}

	.dq-unit-chev {
		margin-left: 4rpx;
	}

	.line-select {
		font-size: 20rpx;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: flex-start;
	}

	.line-select-left {
		display: flex;
		flex-direction: row;
		align-items: center;
		flex-shrink: 0;
		max-width: 40%;
		padding-right: 12rpx;
	}

	.line-select-right {
		flex: 1;
		min-width: 0;
		display: flex;
		justify-content: flex-end;
	}

	.crack-tags {
		justify-content: flex-end;
	}

	/* 裂缝特征：白底蓝框 / 选中实心蓝底白字（与设计图一致） */
	::v-deep .uni-data-checklist {
		width: 100%;
	}

	::v-deep .uni-data-checklist .checklist-group {
		display: flex !important;
		flex-direction: row !important;
		flex-wrap: wrap !important;
		justify-content: flex-end !important;
		width: 100% !important;
	}

	::v-deep .uni-data-checklist .checklist-box.is--tag {
		margin: 0 10rpx 10rpx 0 !important;
		padding: 8rpx 16rpx !important;
		border-radius: 6rpx !important;
		border: 1rpx solid #1677ff !important;
		background-color: #ffffff !important;
	}

	::v-deep .uni-data-checklist .checklist-box.is--tag .checklist-text {
		margin: 0 !important;
		font-size: 18rpx !important;
		color: #1677ff !important;
	}

	::v-deep .uni-data-checklist .checklist-box.is--tag.is-checked {
		background-color: #1677ff !important;
		border-color: #1677ff !important;
	}

	::v-deep .uni-data-checklist .checklist-box.is--tag.is-checked .checklist-text {
		color: #ffffff !important;
	}

	::v-deep .uni-data-checklist .checklist-box .checklist-content {
		display: flex !important;
		align-items: center !important;
		justify-content: center !important;
	}

	view {
		box-sizing: border-box;
	}

	.location-description-right-position-input {
		flex: 1;
		font-size: 18rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}



	/*位置描述弹窗*/
	/*位置描述中位置弹窗样式*/
	.location-description-position-popup-content {
		background-color: #fff;
		width: 600rpx;
		height: 300rpx;
		border-radius: 8rpx;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
	}

	.location-description-position-popup-input1 {
		margin-top: 10rpx;
		display: flex;
		flex-direction: row;
		align-items: center;
		width: 100%;
		justify-content: space-between;
		padding: 0rpx 30rpx;
	}

	.location-description-popup-input {
		border-bottom: 1rpx solid #eee;
		flex: 1;
		margin-right: 10rpx;
	}


	.location-description-popup-button {
		background-color: #0F4687;
		color: white;
		min-width: 56rpx;
		width: auto;
		height: 40rpx;
		line-height: 40rpx;
		font-size: 16rpx;
		text-align: center;
		border-radius: 5rpx;
		padding: 0 10rpx;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		/* 防止按钮被压缩 */
	}


	.location-description-position-popup-input3 {
		margin-top: 10rpx;
		font-size: 20rpx;
		padding: 0rpx 30rpx;
	}

	.location-description-position-popup-input3-item {
		margin-bottom: 10rpx;
	}

	.disease-index-title {
		padding: 8rpx 16rpx;
		font-size: 20rpx;
		color: #333333;
		background-color: #f5f5f5;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
	}

	.disease-index-title-delete {
		position: absolute;
		right: 16rpx;
		display: flex;
		align-items: center;
	}

	.delete-icon {
		width: 20rpx;
		height: 20rpx;
	}

	/* 范围输入相关样式 */
	.quantitative-data-right-range {
		display: flex;
		flex-direction: row;
		align-items: center;
		flex-wrap: wrap;
		gap: 6rpx;
	}

	.range-separator {
		margin: 0 5rpx;
		color: #333333;
		font-size: 20rpx;
		font-weight: bold;
	}

	.clear-input {
		opacity: 0.5;
	}

	.input-text {
		font-size: 18rpx;
	}

	.reference-start .input-text,
	.reference-end .input-text {
		flex: 1;
		min-width: 0;
	}

	.length-input {
		margin-left: 0;
	}

	.location-description-position-popup-title {
		background-color: #BDCBE0;
		font-size: 20rpx;
		padding: 8rpx 0rpx;
		text-align: center;
		/* 添加水平居中 */
	}

	.clear-icon {
		width: 18rpx;
		height: 18rpx;
		opacity: 0.55;
		flex-shrink: 0;
	}

	.area-picker {
		border: 1px solid #ccc;
		display: flex;
		margin-right: 10rpx;
		padding: 4rpx 5px;
		align-items: center;
	}

	.area-picker-input {
		flex: 1;
		margin-right: 20rpx;
		white-space: nowrap;
		/* 不换行 */
	}

	.picker-icon {
		color: #CCCCCC;
		font-size: 20rpx;
	}

	.input-right-button {
		background-color: #0F4687;
		border-radius: 5rpx;
		color: #fff;
		margin-left: auto;
		height: 40rpx;
		line-height: 40rpx;
		padding: 0 10rpx;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 16rpx;
	}

  .deleteIndexDisease-popup-content{
    background-color: #fff;
    width: 500rpx;
    height: 250rpx;
    border-radius: 8rpx;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .popup-title {
    background-color: #BDCBE0;
    font-size: 20rpx;
    padding: 8rpx 0;
    text-align: center;
  }
  .popup-content {
    padding: 20rpx;
    font-size: 20rpx;
    text-align: center;
    margin-top: 30rpx;
  }
  .popup-button {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 20rpx;
  }

  .popup-button button {
    height: 40rpx;
    line-height: 40rpx;
    padding: 0 10rpx;
    border-radius: 5rpx;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    font-size: 16rpx;
  }

  .popup-button-cancel {
    background-color: #fff;
    color: #1677FF;
    border: 1px solid #1677FF;
    font-size: 16rpx;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 10rpx;
  }

  .popup-button-confirm {
    background-color: #1677FF;
    color: #fff;
    margin-left: 10rpx;
  }
</style>