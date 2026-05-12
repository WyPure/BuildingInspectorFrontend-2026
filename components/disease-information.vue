<template>
	<view>
		<view class="head">
			<view class="head-text">
				病害基础信息
			</view>
		</view>

		<!-- 构件名称：点击行打开「选择构件类型」弹窗（三级），样式对齐桥跨弹窗 -->
		<view class="component-name">
			<view class="picker" @tap.stop="openComponentTypeDialog">
				<view class="picker-titleAndContent">
					<view class="picker-left">
						<text class="picker-must">*</text>
						<view class="picker-title">
							构件名称
						</view>
					</view>
					<view class="picker-right">
						<view class="picker-content" :style="componentNamePicker === '' ? 'color: #CCCCCC;' : ''">
							{{ componentNamePicker || '请选择构件名称'}}
						</view>
						<text class="picker-icon">&gt;</text>

						<view class="component-name-input" v-show="componentNamePicker === '其他'">
							<input class="component-code-input" v-model="componentNameInput" placeholder="请输入构件名称"
								placeholder-style="color: #CCCCCC;" @click.stop />
							<image src="/static/image/clear.png" class="clear-icon"
								@click.stop="componentNameInput = '' "></image>
						</view>

					</view>
				</view>
			</view>
		</view>

		<view class="picker" @click="openComponentCodePopup">
			<view class="picker-titleAndContent">
				<view class="picker-left">
					<text class="picker-must">*</text>
					<view class="picker-title">
						构件编号
					</view>
				</view>
				<view class="picker-right">
					<view class="picker-content" :style="componentCodeInput === '' ? 'color: #CCCCCC;' : ''">
						{{ componentCodeInput || '请输入构件编号'}}
					</view>
					<text class="picker-icon">&gt;</text>
				</view>
			</view>
		</view>

		<!-- 病害名称：须先完成构件名称；选「其他」时在弹窗中填写具体名称 -->
		<view class="picker" :class="{ 'picker--disabled-soft': !isComponentReadyForDiseaseSelection }">
			<view class="picker-titleAndContent">
				<view class="picker-left">
					<text class="picker-must">*</text>
					<view class="picker-title">
						病害名称
					</view>
				</view>
				<view class="picker-right picker-right-tap" @tap.stop="onDiseaseNameRowTap">
					<view class="picker-content picker-content--ellipsis" :style="!diseaseNameRowDisplay ? 'color: #CCCCCC;' : ''">
						<text class="picker-ellipsis-text">{{ diseaseNameRowDisplay || '请选择病害名称' }}</text>
					</view>
					<text class="picker-icon">&gt;</text>
				</view>
			</view>
		</view>

		<view class="picker" @click="openComponentPositionPopup">
			<view class="picker-titleAndContent">
				<view class="picker-left">
					<text class="picker-must">*</text>
					<view class="picker-title">
						病害位置
					</view>
				</view>
				<view class="picker-right">
					<view class="picker-content" :style="!typePicker || position === '' ? 'color: #CCCCCC;' : ''">
						{{ !typePicker ? '-' : (position === '' ? '请输入病害位置' : `${positionSegmentFlag === 'yes' && positionNumber !== '' ? `第${positionNumber}号` : ''}${position}`) }}
					</view>
					<text class="picker-icon">&gt;</text>
				</view>
			</view>
		</view>

		<view class="picker">
			<view class="picker-titleAndContent">
				<view class="picker-left">
					<text class="picker-must">&ensp;</text>
					<view class="picker-title">
						里程桩号
					</view>
				</view>
				<view class="picker-right">
					<text class="left-icon">K</text>
					<view class="input-content">
						<input class="input-content-input" v-model="mileageStation1" placeholder="请填写"
							placeholder-style="color: #CCCCCC;" />
						<image src="/static/image/clear.png" class="clear-icon" @click="mileageStation1 = ''"></image>
					</view>
					<text class="mid-icon">+</text>
					<view class="input-content">
						<input class="input-content-input" v-model="mileageStation2" placeholder="请填写" placeholder-style="color: #CCCCCC;">
						<image src="/static/image/clear.png" class="clear-icon" @click="mileageStation2 = ''"></image>
					</view>
				</view>
			</view>
		</view>

		<uni-popup ref="componentCodePopup" type="center" @change="handlePopupChange">
			<view class="componentCode-popup-content">
				<view class="popup-title">编辑构件编号</view>
				<view class="code-popup-form">
				<view class="code-popup-row">
					<view class="code-popup-label">构件编号</view>
					<view class="code-popup-value">
						<input type="text" placeholder="请填写" v-model="componentCodePopupInput"
							placeholder-style="color: #CCCCCC;" disabled />
						<image src="/static/image/clear.png" class="clear-icon"
							@click.stop="clearComponentCodePopup()"></image>
					</view>
				</view>
				<view class="code-popup-row code-popup-row--format-strip">
					<view class="code-popup-label">格式输入</view>
					<!-- 与下一行同一套 grid 列定义，保证四数字格与四单选纵向对齐 -->
					<view class="code-code-grid">
						<picker class="code-part-box code-prefix-box code-grid-lead" :range="codePicker"
							@change="onCodeChange">
							<view class="code-prefix-text" :style="!codeFirstPart ? 'color: #CCCCCC;' : ''">
								{{ codeFirstPart || 'L' }}
							</view>
							<text class="picker-icon">&gt;</text>
						</picker>
						<!-- 与前缀、与数字之间的「-」列同宽 -->
						<view class="code-grid-gap-ph"></view>
						<view class="code-grid-num">
							<view class="code-part-box">
								<input type="number" v-model="codeSecondPart" placeholder="0"
									placeholder-style="color: #CCCCCC;" />
								<image src="/static/image/clear.png" class="clear-icon"
									@click.stop="codeSecondPart = ''"></image>
							</view>
						</view>
						<text class="code-grid-sep">-</text>
						<view class="code-grid-num">
							<view class="code-part-box">
								<input type="number" v-model="codeThirdPart" placeholder="0"
									placeholder-style="color: #CCCCCC;" />
								<image src="/static/image/clear.png" class="clear-icon"
									@click.stop="codeThirdPart = ''"></image>
							</view>
						</view>
						<text class="code-grid-sep">-</text>
						<view class="code-grid-num">
							<view class="code-part-box">
								<input type="number" v-model="codeFourthPart" placeholder="0"
									placeholder-style="color: #CCCCCC;" />
								<image src="/static/image/clear.png" class="clear-icon"
									@click.stop="codeFourthPart = ''"></image>
							</view>
						</view>
						<text class="code-grid-sep">-</text>
						<view class="code-grid-num">
							<view class="code-part-box">
								<input type="number" v-model="codeFifthPart" placeholder="0"
									placeholder-style="color: #CCCCCC;" />
								<image src="/static/image/clear.png" class="clear-icon"
									@click.stop="codeFifthPart = ''"></image>
							</view>
						</view>
					</view>
				</view>
				<view class="code-popup-row code-popup-row--special">
					<view class="code-popup-label">特殊符号(`)</view>
					<view class="code-code-grid">
						<view class="code-grid-lead-spacer"></view>
						<view class="code-grid-gap-ph"></view>
						<view class="code-grid-radio">
							<view :class="['code-special-check', { active: checkboxSecondPart }]"
								@click.stop="toggleCodeSpecial('second')"></view>
						</view>
						<view class="code-grid-gap-ph"></view>
						<view class="code-grid-radio">
							<view :class="['code-special-check', { active: checkboxThirdPart }]"
								@click.stop="toggleCodeSpecial('third')"></view>
						</view>
						<view class="code-grid-gap-ph"></view>
						<view class="code-grid-radio">
							<view :class="['code-special-check', { active: checkboxFourthPart }]"
								@click.stop="toggleCodeSpecial('fourth')"></view>
						</view>
						<view class="code-grid-gap-ph"></view>
						<view class="code-grid-radio">
							<view :class="['code-special-check', { active: checkboxFifthPart }]"
								@click.stop="toggleCodeSpecial('fifth')"></view>
						</view>
					</view>
				</view>
				<view class="code-popup-row">
					<view class="code-popup-label">构件材质</view>
					<picker class="code-popup-material-picker" mode="selector" :range="componentMaterialOptions"
						:value="codePopupMaterialPickerIndex" @change="onCodePopupMaterialChange">
						<view class="code-popup-material-value">
							<text class="code-popup-material-text" :class="{ 'is-placeholder': !codePopupMaterial }">
								{{ codePopupMaterial || '请选择构件材质' }}
							</text>
							<text class="picker-icon">&gt;</text>
						</view>
					</picker>
				</view>
				<view class="code-popup-row">
					<view class="code-popup-label">构件所属</view>
					<view class="code-ownership-list">
						<view class="code-ownership-item" @click.stop="codeOwnership = 'prev'">
							<view :class="['code-radio', { active: codeOwnership === 'prev' }]"></view>
							<text>与前跨共用</text>
						</view>
						<view class="code-ownership-item" @click.stop="codeOwnership = 'self'">
							<view :class="['code-radio', { active: codeOwnership === 'self' }]"></view>
							<text>仅本跨</text>
						</view>
						<view class="code-ownership-item" @click.stop="codeOwnership = 'next'">
							<view :class="['code-radio', { active: codeOwnership === 'next' }]"></view>
							<text>与后跨共用</text>
						</view>
					</view>
				</view>
				<view class="code-popup-row recent-code-row">
					<view class="code-popup-label">最近使用</view>
					<view class="recent-code-list">
						<view v-for="(item, rIdx) in recentComponentCodeRecords.slice(0, 5)" :key="recentRecordKey(item, rIdx)"
							class="recent-code-item" @click.stop="applyRecentComponentCode(item)">
							{{ recentRecordLabel(item) }}
						</view>
					</view>
				</view>
				</view>
				<view class="popup-button popup-button--component-code">
					<button class="popup-button-cancel" @click="closeComponentCodePopup">取消</button>
					<button class="popup-button-confirm" @click="confirmComponentCode">确定</button>
				</view>
			</view>
		</uni-popup>

		<uni-popup ref="positionPopup" type="center" @change="onPositionPopupChange">
			<view class="position-popup-content">
				<view class="position-popup-title">编辑病害位置</view>
				<view class="position-popup-form">
					<view class="position-popup-row">
						<text class="position-popup-label">病害位置</text>
						<view class="position-popup-combined">
							{{ combinedPosition || '请选择病害位置' }}
						</view>
					</view>
					<view class="position-popup-row">
						<text class="position-popup-label">节段标志</text>
						<view class="position-popup-segment-flags">
							<view class="position-popup-radio-item" @tap.stop="setPositionPopupSegmentFlag('yes')">
								<view :class="['code-radio', { active: positionPopupSegmentFlag === 'yes' }]"></view>
								<text>是</text>
							</view>
							<view class="position-popup-radio-item" @tap.stop="setPositionPopupSegmentFlag('no')">
								<view :class="['code-radio', { active: positionPopupSegmentFlag === 'no' }]"></view>
								<text>否</text>
							</view>
						</view>
					</view>
					<view class="position-popup-row">
						<text class="position-popup-label">节段位置</text>
						<view class="position-popup-index-row">
						<text>第</text>
							<view class="position-popup-index-input"
								:class="{ 'is-disabled': positionPopupSegmentFlag !== 'yes' }">
							<input type="number" class="position-number-input" v-model="positionNumberPopup"
								:disabled="positionPopupSegmentFlag !== 'yes'"
								placeholder="请填写" placeholder-style="color: #CCCCCC;">
							<image src="/static/image/clear.png" class="clear-icon"
								@click.stop="positionPopupSegmentFlag === 'yes' && (positionNumberPopup = '')"></image>
						</view>
						<text>号</text>
					</view>
				</view>
				<view class="position-popup-row">
					<text class="position-popup-label">位置名称</text>
					<view class="position-popup-name-row">
						<picker class="position-popup-picker" :range="diseasePosition" @change="positionPickerPopupChange">
							<view class="position-popup-picker-text"
								:style="!positionPickerPopup ? 'color: #CCCCCC;' : ''">
								{{positionPickerPopup || '请选择病害位置'}}
							</view>
							<text class="picker-icon">&gt;</text>
						</picker>
						<view class="position-popup-other-input" v-show="positionPickerPopup === '其他'">
							<input type="text" v-model="positionInputPopup" placeholder="请输入位置名称"
								placeholder-style="color: #CCCCCC;">
							<image src="/static/image/clear.png" class="clear-icon"
								@click.stop="positionInputPopup = '' "></image>
						</view>
					</view>
				</view>
				</view>
				<view class="popup-button">
					<button class="popup-button-cancel" @click="closePositionPopup">取消</button>
					<button class="popup-button-confirm" @click="confirmPositionCode">确定</button>
				</view>
			</view>
		</uni-popup>

		<!-- 选择构件类型（居中），样式对齐 BridgeSpanRangeDialog -->
	<uni-popup ref="componentTypeDialogRef" type="center">
		<view class="cmp-type-popup">
			<view class="cmp-type-popup-title">
				<text class="cmp-type-popup-title-text">选择构件类型</text>
			</view>
			<view class="cmp-type-form">
				<view class="cmp-type-row">
					<text class="cmp-type-label">结构</text>
					<view class="cmp-type-select" @tap.stop="openCascadeSheet('component')">
						<text :class="['cmp-type-select-text', !dialogStructureName ? 'is-placeholder' : '']">
							{{ dialogStructureName || '请选择结构名称' }}
						</text>
						<text class="cmp-type-select-arrow">›</text>
					</view>
				</view>
				<view class="cmp-type-row">
					<text class="cmp-type-label">部件</text>
					<view class="cmp-type-select" @tap.stop="openCascadeSheet('component')">
						<text :class="['cmp-type-select-text', !dialogPartName ? 'is-placeholder' : '']">
							{{ dialogPartName || '请选择部件名称' }}
						</text>
						<text class="cmp-type-select-arrow">›</text>
					</view>
				</view>
				<view class="cmp-type-row cmp-type-row--child">
					<text class="cmp-type-label">子部件</text>
					<view class="cmp-type-field-inline">
						<template v-if="isDialogChildOther">
							<view class="cmp-type-other-trigger" @tap.stop="openCascadeSheet('component')">
								<text class="cmp-type-other-tag-text">{{ dialogChildName }}</text>
								<text class="cmp-type-other-tag-arrow">›</text>
							</view>
							<view class="cmp-type-other-name-input" @tap.stop>
								<input class="cmp-type-other-name-input-field" v-model="componentNameInput"
									placeholder="请填写构件名称" placeholder-style="color: #CCCCCC;"
									@tap.stop />
								<image src="/static/image/clear.png" class="cmp-type-other-clear" mode="aspectFit"
									@tap.stop="componentNameInput = ''" />
							</view>
						</template>
						<template v-else>
							<view class="cmp-type-select" @tap.stop="openCascadeSheet('component')">
								<text :class="['cmp-type-select-text', !dialogChildName ? 'is-placeholder' : '']">
									{{ dialogChildName || '请选择构件名称' }}
								</text>
								<text class="cmp-type-select-arrow">›</text>
							</view>
						</template>
					</view>
				</view>
			</view>
			<view class="cmp-type-popup-actions">
				<view class="cmp-type-btn-outline" hover-class="cmp-type-btn--hover" @tap.stop="closeComponentTypeDialog">
					<text>取消</text>
				</view>
				<view class="cmp-type-btn-confirm" hover-class="cmp-type-btn--hover" @tap.stop="confirmComponentTypeDialog">
					<text>确定</text>
				</view>
			</view>
		</view>
	</uni-popup>

	<!-- 选择病害类型（居中），与选择构件类型同套样式 -->
	<uni-popup ref="diseaseTypeDialogRef" type="center">
		<view class="cmp-type-popup">
			<view class="cmp-type-popup-title">
				<text class="cmp-type-popup-title-text">选择病害类型</text>
			</view>
			<view class="cmp-type-form">
				<view class="cmp-type-row">
					<text class="cmp-type-label">病害类型</text>
					<view class="cmp-type-select" @tap.stop="openCascadeSheet('disease')">
						<text :class="['cmp-type-select-text', !dialogDiseaseCategoryLabel ? 'is-placeholder' : '']">
							{{ dialogDiseaseCategoryLabel || '请选择病害分类' }}
						</text>
						<text class="cmp-type-select-arrow">›</text>
					</view>
				</view>
				<view class="cmp-type-row">
					<text class="cmp-type-label">病害子类</text>
					<view class="cmp-type-select" @tap.stop="openCascadeSheet('disease')">
						<text :class="['cmp-type-select-text', !dialogDiseaseGroupName ? 'is-placeholder' : '']">
							{{ dialogDiseaseGroupName || '请选择病害名称' }}
						</text>
						<text class="cmp-type-select-arrow">›</text>
					</view>
				</view>
				<view class="cmp-type-row cmp-type-row--child">
					<text class="cmp-type-label">病害名称</text>
					<view class="cmp-type-field-inline">
						<template v-if="isDialogDiseaseTypeOther">
							<view class="cmp-type-other-trigger" @tap.stop="openCascadeSheet('disease')">
								<text class="cmp-type-other-tag-text">{{ dialogDiseaseTypeNameOnly }}</text>
								<text class="cmp-type-other-tag-arrow">›</text>
							</view>
							<view class="cmp-type-other-name-input" @tap.stop>
								<input class="cmp-type-other-name-input-field" v-model="typeInput"
									placeholder="请填写病害名称" placeholder-style="color: #CCCCCC;"
									@tap.stop />
								<image src="/static/image/clear.png" class="cmp-type-other-clear" mode="aspectFit"
									@tap.stop="typeInput = ''" />
							</view>
						</template>
						<template v-else>
							<view class="cmp-type-select" @tap.stop="openCascadeSheet('disease')">
								<text :class="['cmp-type-select-text', !dialogDiseaseTypeLine ? 'is-placeholder' : '']">
									{{ dialogDiseaseTypeLine ? dialogDiseaseTypeNameOnly : '请选择病害名称' }}
								</text>
								<text class="cmp-type-select-arrow">›</text>
							</view>
						</template>
					</view>
				</view>
			</view>
			<view class="cmp-type-popup-actions">
				<view class="cmp-type-btn-outline" hover-class="cmp-type-btn--hover" @tap.stop="closeDiseaseTypeDialog">
					<text>取消</text>
				</view>
				<view class="cmp-type-btn-confirm" hover-class="cmp-type-btn--hover" @tap.stop="confirmDiseaseTypeDialog">
					<text>确定</text>
				</view>
			</view>
		</view>
	</uni-popup>

	<!-- 三列联动底部面板：点击任意输入栏均打开，一次性选完三级 -->
	<uni-popup ref="componentTypeListRef" type="bottom" class="cmp-type-level-sheet-popup">
		<view class="cascade-wrap">
			<view class="cascade-header">
				<view class="cascade-cancel-btn" @tap.stop="componentTypeListRef?.close?.()">取消</view>
				<view class="cascade-title">{{ cascadeKind === 'component' ? '选择构件类型' : '选择病害类型' }}</view>
				<view class="cascade-confirm-btn" @tap.stop="confirmCascadeSheet">完成</view>
			</view>
			<picker-view
				class="cascade-picker"
				:value="cascadeSel"
				@change="onCascadePickerChange"
				indicator-class="cascade-indicator"
				indicator-style="height: 56rpx;"
			>
				<picker-view-column class="cascade-picker-col">
					<view v-for="(item, i) in cascadeCol0" :key="'pv0-' + i" class="cascade-picker-item">
						{{ item }}
					</view>
				</picker-view-column>
				<picker-view-column class="cascade-picker-col">
					<view v-for="(item, i) in cascadeCol1" :key="'pv1-' + i" class="cascade-picker-item">
						{{ item }}
					</view>
				</picker-view-column>
				<picker-view-column class="cascade-picker-col">
					<view v-for="(item, i) in cascadeCol2" :key="'pv2-' + i" class="cascade-picker-item">
						{{ item }}
					</view>
				</picker-view-column>
			</picker-view>
		</view>
	</uni-popup>
	</view>
</template>

<script setup>
	// 保存结构数据
	import {
		computed,
		nextTick,
		onMounted,
		onUnmounted,
		ref,
		watch
	} from "vue";
  import {useObject} from "@/store/object";
  import {lastComponentNameStore} from "@/store/lastComponentNameStore";

	const props = defineProps({
		structureData: {
			type: Object,
		},
		selectedGrandObject: {
			type: String,
		}
	});

  const objectInfo = useObject();

	let isInitializing = false;

	// 直接赋值（静态副本）
	const structureData = ref(null)

	const selectedGrandObject = ref('')

	// 保存构件名称的父亲，即picker的第二级
	const parentObjectName = ref(''); // 默认值
	// 保存构件名称的第一级，即picker的第一级 //上部结构、下部结构、桥面系、附属设施
	const grandObjectName = ref('');
	// 部件类型列表picker中的第二级 - 动态生成
	const biObjectNameOptions = ref([]);
	// 缺损类型列表 - 动态生成
	const diseaseTypeOptions = ref([]);

	// 构件名称picker选择的值
	const componentNamePicker = ref('');
	const componentId = ref('');
	// 部件类型索引
	const biObjectindex = ref(-1);

	// 构件名称input输入框
	const componentNameInput = ref('');

	// 构件编号 - 改为输入框
	const componentCodeInput = ref('');

	// 病害类型：三级（病害分类 → 原分组 groupName → 原病害类型 code#name）
	const diseaseTypeMultiArray = ref([[], [], []]);
	const diseaseTypeMultiIndex = ref([-1, -1, -1]);
	const diseaseTypeDialogRef = ref(null);
	const dialogDiseaseMultiIndex = ref([-1, -1, -1]);
	const dialogDiseaseGroupOptions = ref([]);
	const dialogDiseaseTypeOptions = ref([]);
	/** 当前构件下全部病害类型（去重），供弹窗联动与分类筛选 */
	const masterDiseaseTypesCache = ref([]);
	/** 底部列表：'' | 'component' | 'disease' */
	const listSheetKind = ref('');
	/** 病害类型（一级分类）固定选项，与产品图一致 */
	const DISEASE_TOP_CATEGORY_OPTIONS = [
		'耐久性缺损',
		'结构性缺损',
		'增大截面加固构造结构性缺损',
		'粘贴钢板加固构造结构性缺损',
		'粘贴纤维复合材料加固构造结构性缺损',
		'增设体外预应力加固构造结构性缺损',
	];
	const sortDiseaseGroupNames = (arr) => {
		arr.sort((a, b) => {
			const aHasOther = a.includes('其他');
			const bHasOther = b.includes('其他');
			if (aHasOther && !bHasOther) return 1;
			if (!aHasOther && bHasOther) return -1;
			return 0;
		});
	};
	/** SQLite/路由参数常为 string，模板 id 为 number；严格 === 会找不到病害类型从而不 emit 定量位图 */
	const matchDiseaseTypeId = (rowId, needle) => {
		if (needle === undefined || needle === null || needle === '') return false;
		if (rowId === undefined || rowId === null) return false;
		if (rowId === needle) return true;
		const a = Number(rowId);
		const b = Number(needle);
		if (Number.isFinite(a) && Number.isFinite(b) && a === b) return true;
		return String(rowId) === String(needle);
	};
	const getDiseaseTopCategory = (item) => {
		if (!item) return DISEASE_TOP_CATEGORY_OPTIONS[1];
		const explicit = item.diseaseTopCategory || item.diseaseCategory || item.topCategory;
		if (explicit && DISEASE_TOP_CATEGORY_OPTIONS.includes(explicit)) return explicit;
		const g = `${item.groupName || ''}${item.name || ''}${item.code || ''}`;
		if (/体外预应力|体外索/.test(g)) return DISEASE_TOP_CATEGORY_OPTIONS[5];
		if (/纤维复合|粘贴纤维|碳纤维|玻璃纤维|CFRP|GFRP/.test(g)) return DISEASE_TOP_CATEGORY_OPTIONS[4];
		if (/粘贴钢板|钢板加固/.test(g)) return DISEASE_TOP_CATEGORY_OPTIONS[3];
		if (/增大截面/.test(g)) return DISEASE_TOP_CATEGORY_OPTIONS[2];
		if (/耐久|碳化|氯离子|碱骨料|冻融|化学侵蚀|防护涂层|涂层老化|钢筋锈胀|腐蚀环境|化学腐蚀/.test(g)) {
			return DISEASE_TOP_CATEGORY_OPTIONS[0];
		}
		return DISEASE_TOP_CATEGORY_OPTIONS[1];
	};
	const collectDiseaseTypesForCurrentComponent = () => {
		if (typeMultiIndex.value[1] < 0 || !biObjectNameOptions.value || !biObjectNameOptions.value.length) {
			return [];
		}
		if (typeMultiIndex.value[1] >= biObjectNameOptions.value.length) return [];
		const selectedBiObject = biObjectNameOptions.value[typeMultiIndex.value[1]];
		if (!selectedBiObject) return [];

		const list = [];
		const seen = new Set();
		const push = (item) => {
			if (!item || item.id === undefined || item.id === null) return;
			const id = item.id;
			if (seen.has(id)) return;
			seen.add(id);
			list.push(item);
		};

		if (componentNamePicker.value === '其他') {
			if (structureData.value?.children) {
				const structurePart = structureData.value.children.find(
					(ch) => ch.name === grandObjectName.value
				);
				if (structurePart?.children) {
					structurePart.children.forEach((secondLevel) => {
						secondLevel.diseaseTypes?.forEach(push);
						secondLevel.children?.forEach((thirdLevel) => {
							thirdLevel.diseaseTypes?.forEach(push);
						});
					});
				}
			}
		} else {
			selectedBiObject.diseaseTypes?.forEach(push);
			if (typeMultiIndex.value[2] >= 0 && selectedBiObject.children &&
				typeMultiIndex.value[2] < selectedBiObject.children.length) {
				const selectedThirdLevel = selectedBiObject.children[typeMultiIndex.value[2]];
				selectedThirdLevel?.diseaseTypes?.forEach(push);
			}
		}
		return list;
	};
	// 创建一个数组来存储所有的病害类型一级选项
	let groupNamesArray = [];
	// 创建一个数组来存储所有病害类型二级选项
	let allDiseaseTypes = [];

	// 缺损类型
	const type = ref('');
	const typeindex = ref(-1);
	// 添加病害类型picker和input变量
	const typePicker = ref('');
	const typeInput = ref('');

	const isTypePickerOtherLike = (pickerVal) => {
		const p = String(pickerVal || '').split('#')[1] || '';
		return !!(p && (p.includes('其他') || p.includes('其它')));
	};

	/** 构件名称（及「其他」时自定义名）与构件 id、第三级索引就绪后，才允许选病害 */
	const isComponentReadyForDiseaseSelection = computed(() => {
		const pick = String(componentNamePicker.value || '').trim();
		if (!pick) return false;
		if (pick === '其他' || pick === '其它') {
			if (!String(componentNameInput.value || '').trim()) return false;
		} else {
			const i2 = typeMultiIndex.value[2];
			const col2 = typeMultiArray.value[2];
			if (!Array.isArray(col2) || col2.length === 0) return false;
			if (i2 < 0 || i2 >= col2.length) return false;
		}
		const id = componentId.value;
		if (id === undefined || id === null || id === '') return false;
		return true;
	});

	/** 主列表病害名称一行展示文案 */
	const diseaseNameRowDisplay = computed(() => {
		const raw = String(typePicker.value || '').trim();
		if (!raw) return '';
		const parts = raw.split('#');
		const label = (parts[1] || parts[0] || '').trim();
		if (isTypePickerOtherLike(typePicker.value)) {
			const custom = String(typeInput.value || '').trim();
			return custom ? `${label}：${custom}` : label;
		}
		return label || raw;
	});

	const onDiseaseNameRowTap = () => {
		if (!isComponentReadyForDiseaseSelection.value) {
			uni.showToast({
				title: '请先选择构件名称',
				icon: 'none'
			});
			return;
		}
		openDiseaseTypeDialog();
	};

	// 病害位置
	const position = ref('');
	// 病害位置序号（节段位置，仅节段标志为「是」时有效）
	const positionNumber = ref('');
	/** 节段标志：'yes' 可填节段位置；'no' 不可填并清空节段序号 */
	const positionSegmentFlag = ref('no');
	/** 病害位置弹窗内节段标志草稿 */
	const positionPopupSegmentFlag = ref('no');

	// 添加病害位置picker和input变量
	const positionPicker = ref('');
	const positionInput = ref('');

	const diseasePosition = ref([]);

	const diseasePositionItems = ref([]);
	const diseasePositionSelectedItem = ref(null);

	// 为三级选择器添加的数据和方法
	const structureTypes = ref([]);
	const typeMultiArray = ref([
		structureTypes.value,
		[],
		[]
	]);
	const typeMultiIndex = ref([0, 0, 0]);

	//构件编号弹窗里的输入框
	const componentCodePopupInput = ref('');
	/** 最近构件编号：存完整快照（编号格式 + 材质 + 所属），v2 键；兼容旧版仅字符串数组 */
	const RECENT_COMPONENT_CODE_RECORDS_KEY = 'recentComponentCodeRecords_v2';
	const RECENT_COMPONENT_CODE_STORAGE_KEY_LEGACY = 'recentComponentCodes';
	const codePicker = ref(['L', 'R', '无前缀']);
	const codeFirstPart = ref('');
	const codeSecondPart = ref('');
	const codeThirdPart = ref('');
	const codeFourthPart = ref('');
	const codeFifthPart = ref('');

	const checkboxSecondPart = ref(false);
	const checkboxThirdPart = ref(false);
	const checkboxFourthPart = ref(false);
	const checkboxFifthPart = ref(false);
	const codeOwnership = ref('self');
	const recentComponentCodeRecords = ref([]);

	/** 构件材质（确定后写入 component 对象） */
	const componentMaterialOptions = [
		'混凝土构件',
		'预应力混凝土构件',
		'钢构件',
		'钢-混构件',
		'圬工构件',
	];
	const componentMaterial = ref('');
	const codePopupMaterial = ref('');
	const codePopupMaterialDirty = ref(false);

	//构件编号弹窗
	const componentCodePopup = ref(null);
	// 病害位置弹窗
	const positionPopup = ref(null);
	// 构件名称三级选择（弹窗 + 底部列表）
	const componentTypeDialogRef = ref(null);
	const componentTypeListRef = ref(null);
	const dialogMultiIndex = ref([0, 0, 0]);
	const dialogCol0Options = ref([]);
	const dialogCol1Options = ref([]);
	const dialogCol2Options = ref([]);
	const levelPickerTitle = ref('');
	const levelPickerOptions = ref([]);
	const levelPickerKind = ref(0);

	// 三列联动底部面板状态
	const cascadeKind = ref(''); // 'component' | 'disease'
	const cascadeCol0 = ref([]);
	const cascadeCol1 = ref([]);
	const cascadeCol2 = ref([]);
	const cascadeSel = ref([0, 0, 0]);

	//病害位置弹窗的输入项
	const positionNumberPopup = ref('');
	const positionInputPopup = ref('');
	const positionPickerPopup = ref('');
	const combinedPosition = ref('')

	const prioritizeBridgeDeck = (items = []) => {
		const list = Array.isArray(items) ? [...items] : [];
		const idx = list.findIndex(item => item === '桥面系');
		if (idx > 0) {
			const [bridgeDeck] = list.splice(idx, 1);
			list.unshift(bridgeDeck);
		}
		return list;
	}

	/** 原生 multiSelector 对 range 的就地赋值往往不同步，整体换新引用才能立刻显示正确列数据 */
	const flushTypeMultiRange = () => {
		const m = typeMultiArray.value;
		typeMultiArray.value = [
			Array.isArray(m[0]) ? [...m[0]] : [],
			Array.isArray(m[1]) ? [...m[1]] : [],
			Array.isArray(m[2]) ? [...m[2]] : [],
		];
	};

	const syncDialogPickerState = () => {
		if (!structureData.value?.children?.length) {
			dialogCol0Options.value = [];
			dialogCol1Options.value = [];
			dialogCol2Options.value = [];
			return;
		}
		dialogCol0Options.value = prioritizeBridgeDeck(
			structureData.value.children.map((c) => c.name)
		);
		let i0 = dialogMultiIndex.value[0];
		if (i0 < 0 || i0 >= dialogCol0Options.value.length) i0 = 0;
		dialogMultiIndex.value[0] = i0;
		const stName = dialogCol0Options.value[i0];
		const structurePart = structureData.value.children.find((c) => c.name === stName);
		dialogCol1Options.value = structurePart?.children?.map((c) => c.name) ?? [];
		let i1 = dialogMultiIndex.value[1];
		if (i1 < 0 || (dialogCol1Options.value.length && i1 >= dialogCol1Options.value.length)) i1 = 0;
		dialogMultiIndex.value[1] = dialogCol1Options.value.length ? i1 : 0;
		const second = structurePart?.children?.[dialogMultiIndex.value[1]];
		const thirdRaw = second?.children;
		dialogCol2Options.value = Array.isArray(thirdRaw) ?
			thirdRaw.filter((item) => item.status === '0').map((item) => item.name) : [];
		let i2 = dialogMultiIndex.value[2];
		if (i2 < 0 || (dialogCol2Options.value.length && i2 >= dialogCol2Options.value.length)) i2 = 0;
		dialogMultiIndex.value[2] = dialogCol2Options.value.length ? i2 : 0;
	};

	const dialogStructureName = computed(() => {
		const arr = dialogCol0Options.value;
		const i = dialogMultiIndex.value[0];
		if (!arr.length || i < 0 || i >= arr.length) return '';
		return arr[i] || '';
	});
	const dialogPartName = computed(() => {
		const arr = dialogCol1Options.value;
		const i = dialogMultiIndex.value[1];
		if (!arr.length || i < 0 || i >= arr.length) return '';
		return arr[i] || '';
	});
	const dialogChildName = computed(() => {
		const arr = dialogCol2Options.value;
		const i = dialogMultiIndex.value[2];
		if (!arr.length || i < 0 || i >= arr.length) return '';
		return arr[i] || '';
	});

	const isDialogChildOther = computed(() => {
		const n = dialogChildName.value;
		return n === '其他' || n === '其它';
	});

	const openComponentTypeDialog = () => {
		if (!structureData.value?.children?.length) {
			uni.showToast({
				title: '结构数据未就绪',
				icon: 'none'
			});
			return;
		}
		dialogMultiIndex.value = [...typeMultiIndex.value];
		syncDialogPickerState();
		listSheetKind.value = '';
		componentTypeListRef.value?.close?.();
		componentTypeDialogRef.value?.open?.();
	};

	const closeComponentTypeDialog = () => {
		listSheetKind.value = '';
		componentTypeListRef.value?.close?.();
		componentTypeDialogRef.value?.close?.();
	};

	const confirmComponentTypeDialog = () => {
		if (isDialogChildOther.value && !String(componentNameInput.value || '').trim()) {
			uni.showToast({
				title: '请填写构件名称',
				icon: 'none'
			});
			return;
		}
		typeMultiIndex.value = [...dialogMultiIndex.value];
		initMultiPickerColumns();
		applyComponentNameFromIndices();
		closeComponentTypeDialog();
	};

	/** 弹窗子类/名称数据：与改造前一致——子类=全量 groupName，名称=组内二级病害；第一栏「病害类型」暂不参与筛选 */
	const rebuildDialogDiseaseOptions = () => {
		const master = masterDiseaseTypesCache.value.length ?
			masterDiseaseTypesCache.value :
			collectDiseaseTypesForCurrentComponent();
		masterDiseaseTypesCache.value = master;
		const d = dialogDiseaseMultiIndex.value;
		if (!master.length) {
			dialogDiseaseGroupOptions.value = [];
			dialogDiseaseTypeOptions.value = [];
			return;
		}
		const groups = [...new Set(master.map((t) => t.groupName).filter(Boolean))];
		sortDiseaseGroupNames(groups);
		dialogDiseaseGroupOptions.value = groups;
		if (d[1] < 0 || d[1] >= groups.length) {
			dialogDiseaseTypeOptions.value = [];
			return;
		}
		const gname = groups[d[1]];
		const types = master.filter((t) => t.groupName === gname);
		dialogDiseaseTypeOptions.value = types.map((t) => `${t.code}#${t.name}`);
	};

	const syncDiseaseTypeDialogLists = () => {
		rebuildDialogDiseaseOptions();
		const d0 = dialogDiseaseMultiIndex.value[0];
		let d1 = dialogDiseaseMultiIndex.value[1];
		let d2 = dialogDiseaseMultiIndex.value[2];
		if (!dialogDiseaseGroupOptions.value.length) {
			d1 = -1;
			d2 = -1;
		} else {
			if (d1 >= 0) {
				d1 = Math.min(d1, dialogDiseaseGroupOptions.value.length - 1);
			}
			if (d1 >= 0 && dialogDiseaseTypeOptions.value.length) {
				d2 = d2 < 0 ? -1 : Math.min(d2, dialogDiseaseTypeOptions.value.length - 1);
			} else {
				d2 = -1;
			}
		}
		dialogDiseaseMultiIndex.value = [d0, d1, d2];
	};

	const dialogDiseaseCategoryLabel = computed(() => {
		const i = dialogDiseaseMultiIndex.value[0];
		if (i < 0 || i >= DISEASE_TOP_CATEGORY_OPTIONS.length) return '';
		return DISEASE_TOP_CATEGORY_OPTIONS[i] || '';
	});
	const dialogDiseaseGroupName = computed(() => {
		const arr = dialogDiseaseGroupOptions.value;
		const i = dialogDiseaseMultiIndex.value[1];
		if (!arr.length || i < 0 || i >= arr.length) return '';
		return arr[i] || '';
	});
	const dialogDiseaseTypeLine = computed(() => {
		const arr = dialogDiseaseTypeOptions.value;
		const i = dialogDiseaseMultiIndex.value[2];
		if (!arr.length || i < 0 || i >= arr.length) return '';
		return arr[i] || '';
	});

	/** 弹窗内病害名称展示用（去掉 code# 前缀中的 code） */
	const dialogDiseaseTypeNameOnly = computed(() => {
		const line = String(dialogDiseaseTypeLine.value || '');
		const parts = line.split('#');
		return (parts[1] || parts[0] || '').trim();
	});

	/** 弹窗内第三级是否为「其他/其它」病害（与底部级联一致） */
	const isDialogDiseaseTypeOther = computed(() => isTypePickerOtherLike(dialogDiseaseTypeLine.value));

	const openDiseaseTypeDialog = () => {
		if (!isComponentReadyForDiseaseSelection.value) {
			uni.showToast({
				title: '请先选择构件名称',
				icon: 'none'
			});
			return;
		}
		const master = collectDiseaseTypesForCurrentComponent();
		masterDiseaseTypesCache.value = master;
		if (!master.length) {
			uni.showToast({
				title: '当前构件暂无可选病害',
				icon: 'none'
			});
			return;
		}
		dialogDiseaseMultiIndex.value = [...diseaseTypeMultiIndex.value];
		syncDiseaseTypeDialogLists();
		listSheetKind.value = '';
		componentTypeListRef.value?.close?.();
		diseaseTypeDialogRef.value?.open?.();
	};

	const closeDiseaseTypeDialog = () => {
		listSheetKind.value = '';
		componentTypeListRef.value?.close?.();
		diseaseTypeDialogRef.value?.close?.();
	};

	/** 同步评定标度显隐：一级分类 + 当前病害名称（名称中含「结构性缺损/耐久性缺损」子串即归入对应大类） */
	const emitDiseaseAssessmentTopCategory = () => {
		const ci = diseaseTypeMultiIndex.value[0];
		const firstCol = (ci >= 0 && ci < DISEASE_TOP_CATEGORY_OPTIONS.length) ?
			DISEASE_TOP_CATEGORY_OPTIONS[ci] : '';
		const tp = typePicker.value;
		let nameLine = '';
		if (tp && typeof tp === 'string') {
			const parts = tp.split('#');
			nameLine = (parts[1] || parts[0] || '').trim();
		} else {
			nameLine = String(type.value || '').trim();
		}
		const s = [firstCol, nameLine].filter(Boolean).join(' ').trim();
		uni.$emit('setDiseaseAssessmentTopCategory', s);
	};

	const applyDiseaseTypeSelection = () => {
		const index = diseaseTypeMultiIndex.value[2];
		if (index >= 0 && index < diseaseTypeOptions.value.length) {
			typePicker.value = diseaseTypeOptions.value[index];
			typeindex.value = index;

			console.log('病害类型选择变更为:', typePicker.value);
			if (isTypePickerOtherLike(typePicker.value)) {
				// 「其他」具体名称在「选择病害类型」弹窗内填写，此处不再清空 typeInput
			} else {
				type.value = typePicker.value;
				typeInput.value = '';
			}
			const selectedDiseaseType = allDiseaseTypes[typeindex.value];
			console.log('selectedDiseaseType获取选中的病害类型对象:', selectedDiseaseType);
			const selectColVal =
				selectedDiseaseType?.selectColumn ?? selectedDiseaseType?.select_column ?? 0;
			if (selectedDiseaseType?.threshold) {
				uni.$emit('setThreshold', selectedDiseaseType.threshold);
			}
			if (selectedDiseaseType?.maxScale && selectedDiseaseType?.minScale) {
				const minScale = parseInt(selectedDiseaseType.minScale) || 1;
				const maxScale = parseInt(selectedDiseaseType.maxScale) || 4;
				uni.$emit('changeScale', {
					minScale: minScale,
					maxScale: maxScale
				});
				console.log('更新评定标度范围:', minScale, '至', maxScale);
			}
			console.log('病害类型选择变更为:', typePicker.value);
			// 先下发定量列位图再清空缺损行，避免 clear 触发的 watch 与空 showColumns 竞态
			uni.$emit('setSelectColumn', selectColVal);
			uni.$emit('clearDiseaseData');
			if (selectedDiseaseType?.code != null) {
				uni.$emit('setDiseaseHelp', selectedDiseaseType.code);
			}
		}
		emitDiseaseAssessmentTopCategory();
		console.log('确定病害类型 diseaseTypeMultiIndex:', diseaseTypeMultiIndex.value);
	};

	const confirmDiseaseTypeDialog = () => {
		const d = dialogDiseaseMultiIndex.value;
		if (d[1] < 0 || d[2] < 0) {
			uni.showToast({
				title: '请选择病害子类和病害名称',
				icon: 'none'
			});
			return;
		}
		if (isDialogDiseaseTypeOther.value && !String(typeInput.value || '').trim()) {
			uni.showToast({
				title: '请填写病害名称',
				icon: 'none'
			});
			return;
		}
		diseaseTypeMultiIndex.value = [...dialogDiseaseMultiIndex.value];
		updateDiseaseTypeOptions();
		applyDiseaseTypeSelection();
		closeDiseaseTypeDialog();
	};

	const openDiseaseTypeLevelPicker = (kind) => {
		syncDiseaseTypeDialogLists();
		if (kind === 1 && !dialogDiseaseGroupOptions.value.length) {
			uni.showToast({
				title: '暂无病害子类',
				icon: 'none'
			});
			return;
		}
		if (kind === 2 && dialogDiseaseMultiIndex.value[1] < 0) {
			uni.showToast({
				title: '请先选择病害子类',
				icon: 'none'
			});
			return;
		}
		if (kind === 2 && !dialogDiseaseTypeOptions.value.length) {
			uni.showToast({
				title: '当前子类下暂无病害名称',
				icon: 'none'
			});
			return;
		}
		listSheetKind.value = 'disease';
		if (kind === 0) {
			levelPickerTitle.value = '请选择病害分类';
			levelPickerOptions.value = [...DISEASE_TOP_CATEGORY_OPTIONS];
		} else if (kind === 1) {
			levelPickerTitle.value = '请选择病害子类';
			levelPickerOptions.value = [...dialogDiseaseGroupOptions.value];
		} else {
			levelPickerTitle.value = '请选择病害名称';
			levelPickerOptions.value = [...dialogDiseaseTypeOptions.value];
		}
		levelPickerKind.value = kind;
		componentTypeListRef.value?.open?.();
	};

	const selectDiseaseTypeLevelOption = (index) => {
		const kind = levelPickerKind.value;
		const len = levelPickerOptions.value.length;
		const idx = len ? Math.max(0, Math.min(index, len - 1)) : 0;
		const prev = [...dialogDiseaseMultiIndex.value];
		const prevArr = dialogDiseaseTypeOptions.value;
		const prevI2 = prev[2];
		const prevLine =
			kind === 2 && prevArr.length && prevI2 >= 0 && prevI2 < prevArr.length ?
				(prevArr[prevI2] || '') : dialogDiseaseTypeLine.value;
		if (kind === 0) {
			// 第一栏仅占位展示，不改变子类/名称已选数据
			dialogDiseaseMultiIndex.value = [len ? idx : -1, prev[1], prev[2]];
		} else if (kind === 1) {
			dialogDiseaseMultiIndex.value = [prev[0], len ? idx : -1, -1];
		} else {
			dialogDiseaseMultiIndex.value = [prev[0], prev[1], len ? idx : -1];
		}
		syncDiseaseTypeDialogLists();
		if (kind === 2 && isDialogDiseaseTypeOther.value) {
			const newLine = dialogDiseaseTypeLine.value;
			if (newLine !== prevLine || !isTypePickerOtherLike(prevLine)) {
				typeInput.value = '';
			}
		}
		componentTypeListRef.value?.close?.();
	};

	const openComponentLevelPicker = (kind) => {
		listSheetKind.value = 'component';
		if (!structureData.value?.children?.length) {
			uni.showToast({
				title: '结构数据未就绪',
				icon: 'none'
			});
			return;
		}
		syncDialogPickerState();
		if (kind === 0) {
			levelPickerTitle.value = '请选择结构名称';
			levelPickerOptions.value = [...dialogCol0Options.value];
		} else if (kind === 1) {
			if (!dialogCol0Options.value.length) {
				uni.showToast({
					title: '请先选择结构',
					icon: 'none'
				});
				return;
			}
			levelPickerTitle.value = '请选择部件名称';
			levelPickerOptions.value = [...dialogCol1Options.value];
		} else {
			if (!dialogCol0Options.value.length) {
				uni.showToast({
					title: '请先选择结构',
					icon: 'none'
				});
				return;
			}
			levelPickerTitle.value = '请选择构件名称';
			levelPickerOptions.value = [...dialogCol2Options.value];
		}
		levelPickerKind.value = kind;
		componentTypeListRef.value?.open?.();
	};

	const selectListSheetOption = (index) => {
		if (listSheetKind.value === 'disease') {
			selectDiseaseTypeLevelOption(index);
			return;
		}
		const kind = levelPickerKind.value;
		const len = levelPickerOptions.value.length;
		const idx = len ? Math.max(0, Math.min(index, len - 1)) : 0;
		dialogMultiIndex.value[kind] = len ? idx : 0;
		if (kind === 0) {
			dialogMultiIndex.value[1] = 0;
			dialogMultiIndex.value[2] = 0;
		} else if (kind === 1) {
			dialogMultiIndex.value[2] = 0;
		}
		syncDialogPickerState();
		const n = dialogChildName.value;
		if (n !== '其他' && n !== '其它') {
			componentNameInput.value = '';
		}
		componentTypeListRef.value?.close?.();
	};

	// ── 三列联动面板 ──────────────────────────────────────
	/** 返回对应列当前选中行的 scroll-into-view id，用于自动滚动 */
	const cascadeScrollId = (col) => {
		const i = cascadeSel.value[col];
		return i >= 0 ? `cas${col}-${i}` : '';
	};

	/** 根据当前 cascadeSel 重建构件三列数据（选第0列后级联更新1/2列） */
	const rebuildCascadeComponent = () => {
		if (!structureData.value?.children?.length) {
			cascadeCol0.value = [];
			cascadeCol1.value = [];
			cascadeCol2.value = [];
			cascadeSel.value = [0, 0, 0];
			return;
		}
		const col0 = prioritizeBridgeDeck(structureData.value.children.map(c => c.name));
		const i0 = col0.length ? Math.max(0, Math.min(cascadeSel.value[0], col0.length - 1)) : 0;

		const stNode = structureData.value.children.find(c => c.name === col0[i0]);
		const col1 = (stNode?.children ?? []).map(c => c.name);
		const i1 = col1.length ? Math.max(0, Math.min(cascadeSel.value[1], col1.length - 1)) : 0;

		const partNode = (stNode?.children ?? []).find(c => c.name === col1[i1]);
		const col2 = (partNode?.children ?? []).map(c => c.name);
		const i2 = col2.length ? Math.max(0, Math.min(cascadeSel.value[2], col2.length - 1)) : 0;

		cascadeCol0.value = col0;
		cascadeCol1.value = col1;
		cascadeCol2.value = col2;
		cascadeSel.value = [i0, i1, i2];
	};

	/** 根据当前 cascadeSel 重建病害三列数据 */
	const rebuildCascadeDisease = () => {
		cascadeCol0.value = [...DISEASE_TOP_CATEGORY_OPTIONS];
		const i0 = Math.max(0, Math.min(cascadeSel.value[0], DISEASE_TOP_CATEGORY_OPTIONS.length - 1));

		const master = masterDiseaseTypesCache.value.length
			? masterDiseaseTypesCache.value
			: collectDiseaseTypesForCurrentComponent();
		masterDiseaseTypesCache.value = master;

		const groups = [...new Set(master.map(t => t.groupName).filter(Boolean))];
		sortDiseaseGroupNames(groups);
		cascadeCol1.value = groups;
		const i1 = groups.length ? Math.max(0, Math.min(cascadeSel.value[1], groups.length - 1)) : 0;

		const gname = groups[i1];
		const types = gname ? master.filter(t => t.groupName === gname).map(t => `${t.code}#${t.name}`) : [];
		cascadeCol2.value = types;
		const i2 = types.length ? Math.max(0, Math.min(cascadeSel.value[2], types.length - 1)) : 0;

		cascadeSel.value = [i0, i1, i2];
	};

	/** 点击任意输入栏时打开三列联动面板，带入当前已选状态 */
	const openCascadeSheet = (kind) => {
		cascadeKind.value = kind;
		if (kind === 'component') {
			if (!structureData.value?.children?.length) {
				uni.showToast({ title: '结构数据未就绪', icon: 'none' });
				return;
			}
			const cur = dialogMultiIndex.value;
			cascadeSel.value = [Math.max(0, cur[0] ?? 0), Math.max(0, cur[1] ?? 0), Math.max(0, cur[2] ?? 0)];
			rebuildCascadeComponent();
		} else {
			if (!isComponentReadyForDiseaseSelection.value) {
				uni.showToast({
					title: '请先选择构件名称',
					icon: 'none'
				});
				return;
			}
			const master = collectDiseaseTypesForCurrentComponent();
			if (!master.length) {
				uni.showToast({ title: '当前构件暂无可选病害', icon: 'none' });
				return;
			}
			masterDiseaseTypesCache.value = master;
			const cur = dialogDiseaseMultiIndex.value;
			cascadeSel.value = [Math.max(0, cur[0] ?? 0), Math.max(0, cur[1] ?? 0), Math.max(0, cur[2] ?? 0)];
			rebuildCascadeDisease();
		}
		listSheetKind.value = '';
		componentTypeListRef.value?.open?.();
	};

	/** 点击某列某项：更新选中并级联刷新后续列 */
	const selectCascadeLevel = (col, idx) => {
		const sel = [...cascadeSel.value];
		sel[col] = idx;
		if (col === 0) { sel[1] = 0; sel[2] = 0; }
		else if (col === 1) { sel[2] = 0; }
		cascadeSel.value = sel;
		if (cascadeKind.value === 'component') {
			rebuildCascadeComponent();
		} else {
			rebuildCascadeDisease();
		}
	};

	/** picker-view 滚轮变更：根据变化列做级联重置 */
	const onCascadePickerChange = (e) => {
		const v = e?.detail?.value;
		if (!Array.isArray(v) || v.length < 3) return;
		const prev = [...cascadeSel.value];
		let next = [Number(v[0] ?? 0), Number(v[1] ?? 0), Number(v[2] ?? 0)];
		if (next[0] !== prev[0]) {
			next[1] = 0;
			next[2] = 0;
		} else if (next[1] !== prev[1]) {
			next[2] = 0;
		}
		cascadeSel.value = next;
		if (cascadeKind.value === 'component') {
			rebuildCascadeComponent();
		} else {
			rebuildCascadeDisease();
		}
	};

	/** 面板「确定」：将选中结果写回弹窗状态，并根据类型直接应用 */
	const confirmCascadeSheet = () => {
		componentTypeListRef.value?.close?.();
		if (cascadeKind.value === 'component') {
			dialogMultiIndex.value = [...cascadeSel.value];
			syncDialogPickerState();
			// 若选了「其他/其它」，保留居中弹窗让用户填写名称
			if (isDialogChildOther.value) return;
			confirmComponentTypeDialog();
		} else {
			const [d0, d1, d2] = cascadeSel.value;
			if (d1 < 0 || d2 < 0) {
				uni.showToast({ title: '请选择病害子类和病害名称', icon: 'none' });
				return;
			}
			const prevLine = dialogDiseaseTypeLine.value;
			dialogDiseaseMultiIndex.value = [d0, d1, d2];
			syncDiseaseTypeDialogLists();
			const newLine = dialogDiseaseTypeLine.value;
			if (isDialogDiseaseTypeOther.value) {
				if (newLine !== prevLine || !isTypePickerOtherLike(prevLine)) {
					typeInput.value = '';
				}
				return;
			}
			confirmDiseaseTypeDialog();
		}
	};

	const getObjectRootByName = (grandName) => {
		return objectInfo.getData()?.children?.find(item => item.name === grandName);
	}

	const getObjectSecondLevelByName = (grandName, parentName) => {
		return getObjectRootByName(grandName)?.children?.find(item => item.name === parentName);
	}

	const getObjectThirdLevelByName = (grandName, parentName, componentName) => {
		return getObjectSecondLevelByName(grandName, parentName)?.children?.find(item => item.name === componentName);
	}

	// 里程桩号
	const mileageStation1 = ref('');
	const mileageStation2 = ref('');

	watch([componentNamePicker, componentId, componentNameInput, componentCodeInput, componentMaterial, typePicker, typeInput, position,
		positionNumber, positionSegmentFlag
	], () => {
		if (isInitializing) {
			uni.$emit('changeDiseaseData')
		}
	})

	const setPositionPopupSegmentFlag = (v) => {
		positionPopupSegmentFlag.value = v;
		if (v !== 'yes') {
			positionNumberPopup.value = '';
		}
	};

	const openComponentPositionPopup = () => {
		positionPopupSegmentFlag.value = positionSegmentFlag.value;
		if (positionPopupSegmentFlag.value === 'yes' && positionNumber.value) {
			positionNumberPopup.value = positionNumber.value;
		} else {
			positionNumberPopup.value = '';
		}
		if (position.value && positionNumber.value && positionSegmentFlag.value === 'yes') {
			combinedPosition.value = '第' + positionNumber.value + '号' + position.value;
		} else if (position.value) {
			combinedPosition.value = position.value;
		} else {
			combinedPosition.value = '';
		}
		if (position.value) positionPickerPopup.value = position.value;
		positionPopup.value.open();
	}

	const positionPickerPopupChange = (e) => {
		const index = e.detail.value;
		positionPickerPopup.value = diseasePosition.value[index];
	}
	const clearPositionPopupDraft = () => {
		positionNumberPopup.value = '';
		positionInputPopup.value = '';
		positionPickerPopup.value = '';
		combinedPosition.value = '';
	}
	const onPositionPopupChange = (e) => {
		if (e?.show === false) {
			clearPositionPopupDraft();
		}
	}
	const closePositionPopup = () => {
		positionPopup.value.close();
		clearPositionPopupDraft();
	}
	const confirmPositionCode = () => {
		if (positionPickerPopup.value === '其他') {
			position.value = positionInputPopup.value;
		} else {
			position.value = positionPickerPopup.value;
		}
		positionSegmentFlag.value = positionPopupSegmentFlag.value;
		if (positionSegmentFlag.value !== 'yes') {
			positionNumber.value = '';
		} else {
			positionNumber.value = positionNumberPopup.value;
		}
		positionPopup.value.close();
		onDiseasePositionChange();
		clearPositionPopupDraft();
	}
	watch(
		[positionNumberPopup, positionPickerPopup, positionInputPopup, positionPopupSegmentFlag],
		() => {
			if (positionPickerPopup.value === '其他') {
				if (positionPopupSegmentFlag.value === 'yes' && positionNumberPopup.value) {
					combinedPosition.value = '第' + positionNumberPopup.value + '号' + positionInputPopup.value;
				} else {
					combinedPosition.value = positionInputPopup.value || '';
				}
			} else if (positionPopupSegmentFlag.value === 'yes' && positionNumberPopup.value) {
				combinedPosition.value = '第' + positionNumberPopup.value + '号' + positionPickerPopup.value;
			} else {
				combinedPosition.value = positionPickerPopup.value || '';
			}
		}
	)

	// 使用watch监听prop变化
	watch(() => props.structureData, (newVal) => {
		console.log('structureData 更新:', newVal)
		if (newVal) {
			structureData.value = JSON.parse(JSON.stringify(newVal))
			if (structureData.value && structureData.value.children) {
				// 更新第一列数据为structureData中的children的name数组
				const firstColumnData = prioritizeBridgeDeck(structureData.value.children.map(item => item.name));
				structureTypes.value = firstColumnData;
				typeMultiArray.value[0] = firstColumnData;

				// 如果第一列索引超出范围，重置为0
				if (typeMultiIndex.value[0] >= typeMultiArray.value[0].length) {
					typeMultiIndex.value[0] = 0;
				}
			}
			if (props.selectedGrandObject) {
				const gi = structureTypes.value.findIndex(item => item === props.selectedGrandObject);
				typeMultiIndex.value[0] = gi !== -1 ? gi : 0;
			} else if (typeMultiIndex.value[0] < 0 ||
				typeMultiIndex.value[0] >= (typeMultiArray.value[0]?.length ?? 0)) {
				typeMultiIndex.value[0] = 0;
			}
			initMultiPickerColumns()

      // TODO：选择最近的componentName
      const lastComponentName = lastComponentNameStore();
      if (props.selectedGrandObject === lastComponentName.grandObjectName) {

        // 处理第二级：找不到就置 0
        const parentIndex = typeMultiArray.value[1].findIndex(item => item === lastComponentName.parentObjectName);
        typeMultiIndex.value[1] = parentIndex !== -1 ? parentIndex : 0;

        // 只有第二级成功找到（index !== -1），才处理第三级
        if (parentIndex !== -1) {
          updateThirdColumn();
          const objectIndex = typeMultiArray.value[2].findIndex(item => item === lastComponentName.objectName);
          typeMultiIndex.value[2] = objectIndex !== -1 ? objectIndex : 0;
        }
      }
		}
	}, {
		immediate: true,
		deep: true
	})

	const codePopupMaterialPickerIndex = computed(() => {
		const i = componentMaterialOptions.indexOf(codePopupMaterial.value);
		return i >= 0 ? i : 0;
	});

	const onCodePopupMaterialChange = (e) => {
		const idx = Number(e?.detail?.value ?? 0);
		const opt = componentMaterialOptions[idx];
		if (opt) {
			codePopupMaterial.value = opt;
			codePopupMaterialDirty.value = true;
		}
	};

	//打开构件编号弹窗
	const openComponentCodePopup = () => {
		componentCodePopup.value.open();
		parseComponentCode(componentCodeInput.value);
		codePopupMaterial.value = componentMaterial.value;
		codePopupMaterialDirty.value = false;
	}
	//关闭构件编号弹窗
	const handlePopupChange = (e) => {
		if (e?.show) {
			return;
		}
		clearComponentCodePopup();
	}
	const clearComponentCodePopup = () => {
		codeFirstPart.value = 'L';
		codeSecondPart.value = '';
		codeThirdPart.value = '';
		codeFourthPart.value = '';
		codeFifthPart.value = '';
		checkboxSecondPart.value = false;
		checkboxThirdPart.value = false;
		checkboxFourthPart.value = false;
		checkboxFifthPart.value = false;
		componentCodePopupInput.value = '';
		codeOwnership.value = 'self';
		codePopupMaterial.value = '';
		codePopupMaterialDirty.value = false;
	}

	/** 仅重置「格式输入」相关字段，不清空材质/所属（解析编号字符串时用） */
	const resetComponentCodePopupParseState = () => {
		codeSecondPart.value = '';
		codeThirdPart.value = '';
		codeFourthPart.value = '';
		codeFifthPart.value = '';
		checkboxSecondPart.value = false;
		checkboxThirdPart.value = false;
		checkboxFourthPart.value = false;
		checkboxFifthPart.value = false;
		codeFirstPart.value = 'L';
		componentCodePopupInput.value = '';
	}
	// 构件编号弹窗选择L R
	const onCodeChange = (e) => {
		const index = e.detail.value;
		codeFirstPart.value = codePicker.value[index];
	}
	// 构件编号弹窗确定
	const confirmComponentCode = () => {
		componentCodeInput.value = componentCodePopupInput.value;
		if (codePopupMaterialDirty.value) {
			componentMaterial.value = codePopupMaterial.value;
		}
		saveRecentComponentRecord();
		closeComponentCodePopup();
		clearComponentCodePopup();
	}
	// 构件编号弹窗取消
	const closeComponentCodePopup = () => {
		componentCodePopup.value.close();
	}
	const toggleCodeSpecial = (part) => {
		if (part === 'second' && codeSecondPart.value !== '') checkboxSecondPart.value = !checkboxSecondPart.value;
		if (part === 'third' && codeThirdPart.value !== '') checkboxThirdPart.value = !checkboxThirdPart.value;
		if (part === 'fourth' && codeFourthPart.value !== '') checkboxFourthPart.value = !checkboxFourthPart.value;
		if (part === 'fifth' && codeFifthPart.value !== '') checkboxFifthPart.value = !checkboxFifthPart.value;
	}
	const buildFormattedComponentCode = () => {
		const prefix = codeFirstPart.value === '无前缀' ? '' : codeFirstPart.value;
		const appendSpecial = (value, checked) => value === '' ? '' : `${value}${checked ? '`' : ''}`;
		const numberParts = [
			appendSpecial(codeSecondPart.value, checkboxSecondPart.value),
			appendSpecial(codeThirdPart.value, checkboxThirdPart.value),
			appendSpecial(codeFourthPart.value, checkboxFourthPart.value),
			appendSpecial(codeFifthPart.value, checkboxFifthPart.value)
		].filter(Boolean);
		if (!prefix && !numberParts.length) return '';
		if (!numberParts.length) return prefix;
		return [prefix, ...numberParts].filter(Boolean).join('-');
	}
	const parseComponentCode = (value) => {
		const raw = String(value || '').trim();
		if (!raw) {
			clearComponentCodePopup();
			return;
		}
		resetComponentCodePopupParseState();
		componentCodePopupInput.value = raw;
		const parts = raw.split('-');
		const maybePrefix = parts[0];
		const hasPrefix = /^[A-Za-z]+$/.test(maybePrefix);
		codeFirstPart.value = hasPrefix ? maybePrefix.toUpperCase() : '无前缀';
		const numberParts = hasPrefix ? parts.slice(1) : parts;
		const parsedParts = numberParts.slice(0, 4).map(part => {
			const text = String(part || '');
			return {
				value: text.replace(/`/g, ''),
				hasSpecial: text.includes('`')
			};
		});
		codeSecondPart.value = parsedParts[0]?.value || '';
		checkboxSecondPart.value = parsedParts[0]?.hasSpecial || false;
		codeThirdPart.value = parsedParts[1]?.value || '';
		checkboxThirdPart.value = parsedParts[1]?.hasSpecial || false;
		codeFourthPart.value = parsedParts[2]?.value || '';
		checkboxFourthPart.value = parsedParts[2]?.hasSpecial || false;
		codeFifthPart.value = parsedParts[3]?.value || '';
		checkboxFifthPart.value = parsedParts[3]?.hasSpecial || false;
	}

	const OWNERSHIP_SET = new Set(['prev', 'self', 'next'])

	function normalizeRecentRecord(raw) {
		if (raw == null) return null
		if (typeof raw === 'string') {
			const fullCode = String(raw).trim()
			return fullCode ? {
				structured: false,
				fullCode,
				material: '',
				ownership: 'self'
			} : null
		}
		if (typeof raw === 'object') {
			const fullCode = String(raw.fullCode || '').trim()
			if (!fullCode) return null
			const ownership = OWNERSHIP_SET.has(raw.ownership) ? raw.ownership : 'self'
			const material = String(raw.material || '').trim()
			return {
				structured: !!raw.structured,
				fullCode,
				material,
				ownership,
				first: raw.first,
				second: raw.second,
				third: raw.third,
				fourth: raw.fourth,
				fifth: raw.fifth,
				cb2: !!raw.cb2,
				cb3: !!raw.cb3,
				cb4: !!raw.cb4,
				cb5: !!raw.cb5
			}
		}
		return null
	}

	const recentRecordLabel = (raw) => normalizeRecentRecord(raw)?.fullCode || ''

	const recentRecordKey = (raw, idx) => {
		const r = normalizeRecentRecord(raw)
		return r ? `${idx}_${r.fullCode}` : `empty_${idx}`
	}

	const applyStructuredRecentRecord = (rec) => {
		const rawFirst = rec.first != null && rec.first !== '' ? String(rec.first) : 'L'
		codeFirstPart.value = rawFirst === '无前缀' ? '无前缀' : rawFirst
		codeSecondPart.value = rec.second != null ? String(rec.second) : ''
		codeThirdPart.value = rec.third != null ? String(rec.third) : ''
		codeFourthPart.value = rec.fourth != null ? String(rec.fourth) : ''
		codeFifthPart.value = rec.fifth != null ? String(rec.fifth) : ''
		checkboxSecondPart.value = !!rec.cb2
		checkboxThirdPart.value = !!rec.cb3
		checkboxFourthPart.value = !!rec.cb4
		checkboxFifthPart.value = !!rec.cb5
		codeOwnership.value = rec.ownership || 'self'
		codePopupMaterial.value = rec.material || ''
		codePopupMaterialDirty.value = !!String(rec.material || '').trim()
		componentCodePopupInput.value = rec.fullCode || buildFormattedComponentCode()
	}

	const loadRecentComponentCodes = () => {
		try {
			// 清除旧格式缓存，不再迁移
			uni.removeStorageSync(RECENT_COMPONENT_CODE_STORAGE_KEY_LEGACY);
			const stored = uni.getStorageSync(RECENT_COMPONENT_CODE_RECORDS_KEY);
			recentComponentCodeRecords.value = Array.isArray(stored) ?
				stored.map(normalizeRecentRecord).filter(Boolean).slice(0, 5) :
				[];
		} catch (error) {
			console.error('读取最近构件编号失败:', error);
			recentComponentCodeRecords.value = [];
		}
	}

	const saveRecentComponentRecord = () => {
		const fullCode = String(componentCodePopupInput.value || '').trim();
		if (!fullCode) return;
		const record = {
			structured: true,
			fullCode,
			material: String(codePopupMaterial.value || '').trim(),
			ownership: OWNERSHIP_SET.has(codeOwnership.value) ? codeOwnership.value : 'self',
			first: codeFirstPart.value,
			second: codeSecondPart.value,
			third: codeThirdPart.value,
			fourth: codeFourthPart.value,
			fifth: codeFifthPart.value,
			cb2: !!checkboxSecondPart.value,
			cb3: !!checkboxThirdPart.value,
			cb4: !!checkboxFourthPart.value,
			cb5: !!checkboxFifthPart.value
		};
		const next = [
			record,
			...recentComponentCodeRecords.value
				.map(normalizeRecentRecord)
				.filter(Boolean)
				.filter((r) => r.fullCode !== fullCode)
		].slice(0, 5);
		recentComponentCodeRecords.value = next;
		uni.setStorageSync(RECENT_COMPONENT_CODE_RECORDS_KEY, next);
	}

	const applyRecentComponentCode = (raw) => {
		const rec = normalizeRecentRecord(raw);
		if (!rec) return;
		if (rec.structured) {
			applyStructuredRecentRecord(rec);
			return;
		}
		parseComponentCode(rec.fullCode);
		if (rec.material) {
			codePopupMaterial.value = rec.material;
			codePopupMaterialDirty.value = true;
		}
		if (rec.ownership && OWNERSHIP_SET.has(rec.ownership)) {
			codeOwnership.value = rec.ownership;
		}
	}
	// 监听 input2 的四个部分，只要有变化就自动拼接
	watch(
		[codeFirstPart, codeSecondPart, codeThirdPart, codeFourthPart, codeFifthPart, checkboxSecondPart, checkboxThirdPart, checkboxFourthPart, checkboxFifthPart],
		() => {
			componentCodePopupInput.value = buildFormattedComponentCode();
		}
	)

	// 添加onMounted处理可能的初始值
	onMounted(() => {
		console.log('组件挂载完成，当前structureData:', props.structureData)
		loadRecentComponentCodes();
		// 如果父组件在挂载前已传递数据
		if (props.structureData) {
			structureData.value = JSON.parse(JSON.stringify(props.structureData))
			if (structureData.value && structureData.value.children) {
				// 更新第一列数据为structureData中的children的name数组
				const firstColumnData = prioritizeBridgeDeck(structureData.value.children.map(item => item.name));
				structureTypes.value = firstColumnData;
				typeMultiArray.value[0] = firstColumnData;

				// 如果第一列索引超出范围，重置为0
				if (typeMultiIndex.value[0] >= typeMultiArray.value[0].length) {
					typeMultiIndex.value[0] = 0;
				}
			}
			if (props.selectedGrandObject) {
				const gi = structureTypes.value.findIndex(item => item === props.selectedGrandObject);
				typeMultiIndex.value[0] = gi !== -1 ? gi : 0;
			} else if (typeMultiIndex.value[0] < 0 ||
				typeMultiIndex.value[0] >= (typeMultiArray.value[0]?.length ?? 0)) {
				typeMultiIndex.value[0] = 0;
			}
			initMultiPickerColumns()
		}
		uni.$on('setComponentName', onComponentNameChangeByEmit);
		uni.$on('setComponentCode', (emitParam) => {
			componentCodeInput.value = emitParam
		});
		uni.$on('setComponentMaterial', (emitParam) => {
			componentMaterial.value = String(emitParam || '').trim();
		});
		uni.$on('setDiseaseType', onDiseaseTypeChangeByEmit);
		uni.$on('setDiseasePosition', setDiseasePosition);
		uni.$on('setPositionNumber', (emitParam) => {
			positionNumber.value = emitParam;
		});
		uni.$on('setPositionSegmentFlag', (emitParam) => {
			const v = emitParam === true || emitParam === 'yes' || emitParam === 1 || emitParam === '1';
			positionSegmentFlag.value = v ? 'yes' : 'no';
		});
		uni.$on('setMileageStation', setMileageStation)

		uni.$on('getDescription', getDescription);
		// 标记初始化完成（可以延迟确保所有初始数据已加载）
		setTimeout(() => {
			isInitializing = true
			console.log('表单初始化完成，开始检测修改')
		}, 500)
	})

	onUnmounted(() => {
		// 移除监听事件
		uni.$off('setComponentName')
		uni.$off('setComponentCode')
		uni.$off('setComponentMaterial')
		uni.$off('setDiseaseType')
		uni.$off('setDiseasePosition')
		uni.$off('setPositionNumber')
		uni.$off('setPositionSegmentFlag')
		uni.$off('getDescription')
		uni.$off('setMileageStation')
	})

	const setMileageStation = (emitParam) => {
		mileageStation1.value = emitParam.mileageStation1
		mileageStation2.value = emitParam.mileageStation2
	}

	const onComponentNameChangeByEmit = (emitComponent) => {
		grandObjectName.value = emitComponent.grandObjectName;
		console.log('设置病害所属大类:', grandObjectName.value);

		// 初始化typeMultiIndex的第一维
		const parentIndex = structureTypes.value.findIndex(item => item === grandObjectName.value);
		if (parentIndex !== -1) {
			typeMultiIndex.value[0] = parentIndex;

			// 初始化第二维数据，传入true表示需要更新保存的数据
			initMultiPickerColumns();

			// 确保第二维数据已经初始化完成
			if (typeMultiArray.value[1] && typeMultiArray.value[1].length > 0) {
				// 如果有parentObjectName（第二级），设置它
				if (emitComponent.parentObjectName) {
					parentObjectName.value = emitComponent.parentObjectName;
					console.log('设置部件父级名称:', parentObjectName.value);

					// 查找第二级索引
					const secondLevelIndex = typeMultiArray.value[1].findIndex(item => item ===
						parentObjectName.value);
					console.log('第二级索引:', secondLevelIndex);
					if (secondLevelIndex !== -1) {
						typeMultiIndex.value[1] = secondLevelIndex;

						// 更新第三列
						updateThirdColumn();

						// 如果有构件名称（第三级），设置它
						if (emitComponent.biObjectName) {
							const biObjectName = emitComponent.biObjectName;
							const biObjectNameInput = emitComponent.biObjectInput;

							// 先设置componentNamePicker，这是我们用来显示的值
							componentNamePicker.value = emitComponent.biObjectName;

							// 尝试在第三级列表中找到匹配项
							if (typeMultiArray.value[2] && typeMultiArray.value[2].length > 0) {
								const thirdLevelIndex = typeMultiArray.value[2].findIndex(item =>
									item === componentNamePicker.value);
								if (thirdLevelIndex !== -1 && componentNamePicker.value !== '其他') {
									typeMultiIndex.value[2] = thirdLevelIndex;
									console.log('成功设置构件名称(第三级):', componentNamePicker.value);

									// 更新biObjectindex
									if (typeMultiIndex.value[1] >= 0 && typeMultiIndex.value[1] <
										biObjectNameOptions.value.length) {
										biObjectindex.value = typeMultiIndex.value[1];
										console.log('成功设置biObjectindex:', biObjectindex.value);
									}
								} else if (componentNamePicker.value === '其他') {
									typeMultiIndex.value[2] = typeMultiArray.value[2].findIndex(item => item === '其他');
									// 如果在第三级中找不到匹配项，可能是自定义名称
									componentNameInput.value = biObjectNameInput;
									console.log('设置自定义构件名称:', biObjectName);
								}
								const selectedSecondLevel = biObjectNameOptions.value[typeMultiIndex.value[1]];
								if (selectedSecondLevel && selectedSecondLevel.children &&
									Array.isArray(selectedSecondLevel.children) &&
									typeMultiIndex.value[2] < selectedSecondLevel.children.length) {

									const selectedThirdLevel = selectedSecondLevel.children.find(item => item.name ===
										componentNamePicker.value);
									if (selectedThirdLevel && selectedThirdLevel.id) {
										const objectThirdLevel = getObjectThirdLevelByName(
											grandObjectName.value,
											selectedSecondLevel.name,
											componentNamePicker.value
										);
										componentId.value = objectThirdLevel?.id || selectedThirdLevel.id;
										console.log('找到第三级组件ID:', componentId.value);
									}
								}
							} else {
								// 第三级列表为空，设置为自定义名称
								componentNameInput.value = biObjectNameInput;
								console.log('第三级列表为空，设置自定义构件名称:', biObjectName);
							}
						}
					}
				}
			}
		}
		updateDiseaseTypeOptions();
		updateDiseasePositionOptions();
	}

	const setDiseasePosition = (emitPosition) => {
		/*		const {
					positionPicker: emitPositionPicker,
					positionInput: emitPositionInput,
					diseasePosition: emitDiseasePosition
				} = emitObj;
				positionPicker.value = emitPositionPicker || '';
				positionInput.value = emitPositionInput || '';
				diseasePosition.value = emitDiseasePosition || [];
				diseasePositionItems.value = emitDiseasePosition || [];

				uni.$emit('setPositionProps', positionPicker.value !== '' ? positionPicker.value : positionInput
				.value);*/

		const index = diseasePositionItems.value.findIndex(item => item.name === emitPosition)
		if (index >= 0 && index < diseasePosition.value.length) {
			positionPicker.value = diseasePosition.value[index];

			// 如果选择了"其他"，清空positionInput，等待用户输入
			if (positionPicker.value === '其他') {
				positionInput.value = emitPosition;
			} else {
				// 否则直接更新position值
				position.value = positionPicker.value;
			}

			// 更新diseasePositionSelectedItem为diseasePositionItems中对应的项
			diseasePositionSelectedItem.value = diseasePositionItems.value[index];
			console.log('病害位置选择变更为:', positionPicker.value);
			console.log('更新病害位置选中item为:', diseasePositionSelectedItem.value);
			uni.$emit('setPositionProps', diseasePositionSelectedItem.value.props);
		} else {
			positionPicker.value = '其他';
			positionInput.value = emitPosition;
		}
	}

	//传递病害描述所需数据
	const getDescription = () => {
		const description = {
			componentName: getComponentName(), // 获取当前选择的构件名称
			componentCode: componentCodeInput.value, // 构件编号
			type: type.value, // 病害类型
			position: position.value, // 病害位置
			positionNumber: positionNumber.value, // 节段位置（序号）
			segmentFlag: positionSegmentFlag.value === 'yes',
			mileageStation1: mileageStation1.value, // 病害位置里程桩号（公里）
			mileageStation2: mileageStation2.value, // 病害位置里程桩号（米）
		};
		uni.$emit('setDescription1', description);
	}

	// 添加一个函数来获取当前选择的构件名称,可能为picker中直接选取，也可能为其他时自行输入
	const getComponentName = () => {
		let componentName = '';
		if (componentNamePicker.value === '其他') {
			// 如果选择了"其他"并且输入了自定义名称
			componentName = componentNameInput.value;
		} else {
			componentName = componentNamePicker.value;
		}
		return componentName;
	}

	// 初始化三级选择器的列数据（仅更新列表内容，不修改任何要保存的值）
	const initMultiPickerColumns = () => {

		// 根据第一列当前选中项更新第二列的数据
		const structureType = typeMultiArray.value[0][typeMultiIndex.value[0]];

		// 不修改 grandObjectName 等保存值

		// 如果结构数据已加载，则初始化部件类型列表
		if (structureData.value && structureData.value.children) {
			// 找到对应的结构部分（上部结构、下部结构、桥面系）
			const structurePart = structureData.value.children.find(
				item => item.name === structureType
			);

			if (structurePart && structurePart.children) {
				// 提取部件类型名称列表
				biObjectNameOptions.value = structurePart.children;

				// 更新二列数据
				typeMultiArray.value[1] = [...structurePart.children.map(item => item.name)];

				// 如果第二列已经有值且索引超出范围，重置为0
				if (typeMultiIndex.value[1] >= typeMultiArray.value[1].length) {
					typeMultiIndex.value[1] = 0;
				}

				// 更新第三列数据
				updateThirdColumn();
			} else {
				console.log('未找到对应的结构部分或其子项');
				typeMultiArray.value[1] = [];
				typeMultiArray.value[2] = [];
			}
		} else {
			console.log('结构数据尚未加载完成');
		}
		nextTick(() => {
			flushTypeMultiRange();
		});
	}

	// 更新第三列数据
	const updateThirdColumn = () => {
		try {
			// 检查是否有第二列选择
			if (typeMultiIndex.value[1] < 0 || !biObjectNameOptions.value || biObjectNameOptions.value.length === 0) {
				typeMultiArray.value[2] = [];
				return;
			}

			// 检查是否选择了超出范围的选项
			if (typeMultiIndex.value[1] >= biObjectNameOptions.value.length) {
				typeMultiArray.value[2] = [];
				return;
			}

			// 获取选中的第二级对象
			const selectedSecondLevel = biObjectNameOptions.value[typeMultiIndex.value[1]];
			if (!selectedSecondLevel || !selectedSecondLevel.children || !Array.isArray(selectedSecondLevel.children)) {
				typeMultiArray.value[2] = [];
				return;
			}

			// 提取第三级名称列表
			const thirdLevelNames = selectedSecondLevel.children
				.filter(item => item.status === '0')
				.map(item => item.name);
			typeMultiArray.value[2] = [...thirdLevelNames];

			// 如果第三列索引超出范围，重置为0
			if (typeMultiIndex.value[2] >= typeMultiArray.value[2].length) {
				typeMultiIndex.value[2] = 0;
			}
		} finally {
			nextTick(() => {
				flushTypeMultiRange();
			});
		}
	}


	// 添加一个新函数来更新构件名称相关的值
	const updateComponentNameValues = () => {
		// 更新grandObjectName
		grandObjectName.value = structureTypes.value[typeMultiIndex.value[0]];

		// 如果第二级索引有效，设置parentObjectName
		if (typeMultiIndex.value[1] >= 0 && typeMultiIndex.value[1] < typeMultiArray.value[1].length) {
			parentObjectName.value = typeMultiArray.value[1][typeMultiIndex.value[1]];
		}
	}

	/** 根据当前 typeMultiIndex / typeMultiArray 写入构件名称、构件 id 及关联病害选项（原 multiSelector 的 change 逻辑） */
	const applyComponentNameFromIndices = () => {
		updateComponentNameValues();

		let selectedComponentName = '';

		if (typeMultiIndex.value[2] >= 0 && typeMultiArray.value[2].length > 0) {
			selectedComponentName = typeMultiArray.value[2][typeMultiIndex.value[2]];
			const selectedSecondLevel = biObjectNameOptions.value[typeMultiIndex.value[1]];
			if (selectedSecondLevel && selectedSecondLevel.children &&
				Array.isArray(selectedSecondLevel.children) &&
				typeMultiIndex.value[2] < selectedSecondLevel.children.length) {

				const selectedThirdLevel = selectedSecondLevel.children.find(item => item.name ===
					selectedComponentName);
				if (selectedThirdLevel && selectedThirdLevel.id) {
					const objectThirdLevel = getObjectThirdLevelByName(
						grandObjectName.value,
						selectedSecondLevel.name,
						selectedComponentName
					);
					console.log('找到第三级组件:', objectThirdLevel || selectedThirdLevel);
					componentId.value = objectThirdLevel?.id || selectedThirdLevel.id;
					console.log('找到第三级组件ID:', componentId.value);
				}
			}
		} else if (typeMultiIndex.value[1] >= 0 && typeMultiArray.value[1].length > 0) {
			selectedComponentName = typeMultiArray.value[1][typeMultiIndex.value[1]];
		}

		componentNamePicker.value = selectedComponentName;

		if (typeMultiIndex.value[1] >= 0 && typeMultiIndex.value[1] < biObjectNameOptions.value.length) {
			biObjectindex.value = typeMultiIndex.value[1];
		} else {
			biObjectindex.value = -1;
		}

		diseaseTypeMultiIndex.value = [-1, -1, -1];
		updateDiseaseTypeOptions();
		updateDiseasePositionOptions();
		typePicker.value = '';
		positionPicker.value = '';
		typeInput.value = '';
		positionInput.value = '';
		positionNumber.value = '';
		positionSegmentFlag.value = 'no';
		uni.$emit('setDiseaseAssessmentTopCategory', '');
	}

	// 根据构件更新病害选项：子类=原一级(groupName)，名称=原二级；第一栏病害类型仅占位不参与筛选
	const updateDiseaseTypeOptions = () => {
		const master = collectDiseaseTypesForCurrentComponent();
		masterDiseaseTypesCache.value = master;

		if (typeMultiIndex.value[1] < 0 || !biObjectNameOptions.value || !biObjectNameOptions.value.length) {
			diseaseTypeOptions.value = [];
			groupNamesArray = [];
			allDiseaseTypes = [];
			diseaseTypeMultiArray.value = [[], [], []];
			return;
		}

		if (typeMultiIndex.value[1] >= biObjectNameOptions.value.length) {
			diseaseTypeOptions.value = [];
			groupNamesArray = [];
			allDiseaseTypes = [];
			diseaseTypeMultiArray.value = [[], [], []];
			return;
		}

		if (!master.length) {
			diseaseTypeOptions.value = [];
			groupNamesArray = [];
			allDiseaseTypes = [];
			diseaseTypeMultiArray.value = [[], [], []];
			return;
		}

		const gi = diseaseTypeMultiIndex.value[1];
		const ti = diseaseTypeMultiIndex.value[2];

		groupNamesArray = [...new Set(master.map((t) => t.groupName).filter(Boolean))];
		sortDiseaseGroupNames(groupNamesArray);

		if (gi < 0 || gi >= groupNamesArray.length) {
			allDiseaseTypes = [];
			diseaseTypeOptions.value = [];
			diseaseTypeMultiArray.value = [[...DISEASE_TOP_CATEGORY_OPTIONS], [...groupNamesArray], []];
			return;
		}

		const selectedGroupName = groupNamesArray[gi];
		allDiseaseTypes = master.filter((t) => t.groupName === selectedGroupName);
		diseaseTypeOptions.value = allDiseaseTypes.map((item) => `${item.code}#${item.name}`);
		diseaseTypeMultiArray.value = [
			[...DISEASE_TOP_CATEGORY_OPTIONS],
			[...groupNamesArray],
			[...diseaseTypeOptions.value],
		];

		if (ti < 0 || ti >= diseaseTypeOptions.value.length) {
			console.log('病害类型索引待选:', { gi, ti, len: diseaseTypeOptions.value.length });
		}

		console.log('groupNamesArray', groupNamesArray);
		console.log('最终缺损类型选项更新为:', diseaseTypeOptions.value);
	}

	// 更新病害位置选项
	const updateDiseasePositionOptions = () => {
		console.log('开始更新病害位置选项');
		// 检查是否选择了构件
		if (typeMultiIndex.value[1] < 0 || !biObjectNameOptions.value || biObjectNameOptions.value.length === 0) {
			diseasePosition.value = [];
			return;
		}

		// 获取选中的第二级对象
		const selectedSecondLevel = biObjectNameOptions.value[typeMultiIndex.value[1]];
		if (!selectedSecondLevel) {
			diseasePosition.value = [];
			return;
		}

		// 如果有第三级选择，使用第三级对象
		if (typeMultiArray.value[2].length > 0 && typeMultiIndex.value[2] >= 0) {
			// 获取选中的第三级对象
			if (selectedSecondLevel.children && Array.isArray(selectedSecondLevel.children) &&
				typeMultiIndex.value[2] < selectedSecondLevel.children.length) {

				const selectedThirdLevel = selectedSecondLevel.children[typeMultiIndex.value[2]];

				// 检查是否有子组件
				if (selectedThirdLevel && selectedThirdLevel.children && Array.isArray(selectedThirdLevel.children)) {
					// 提取子组件名称
					diseasePosition.value = selectedThirdLevel.children.map(item => item.name);
					diseasePositionItems.value = selectedThirdLevel.children;
					console.log('更新病害位置item选项', diseasePositionItems.value);
					console.log('更新病害位置选项为第三级子组件:', diseasePosition.value);
					return;
				}
			}
		}

		// 如果都没有，使用默认值为空
		diseasePosition.value = [];
		console.log('使用默认病害位置选项');
	};

	// 确认病害位置选择
	const onDiseasePositionChange = () => {
		const index = diseasePositionItems.value.findIndex(item => item.name === position.value)
		if (index >= 0 && index < diseasePosition.value.length) {
			positionPicker.value = diseasePosition.value[index];

			// 如果选择了"其他"，清空positionInput，等待用户输入
			if (positionPicker.value === '其他') {
				positionInput.value = '';
			} else {
				// 否则直接更新position值
				position.value = positionPicker.value;
			}

			// 更新diseasePositionSelectedItem为diseasePositionItems中对应的项
			diseasePositionSelectedItem.value = diseasePositionItems.value[index];
			console.log('病害位置选择变更为:', positionPicker.value);
			console.log('更新病害位置选中item为:', diseasePositionSelectedItem.value);
			uni.$emit('setPositionProps', diseasePositionSelectedItem.value.props);
		}
	}

	// 编辑模式填充病害类型处理方法
	const onDiseaseTypeChangeByEmit = (diseaseObj) => {
		const {
			diseaseTypeInput: diseaseTypeInput,
			diseaseType: diseaseType,
			diseaseTypeCode: diseaseTypeCode,
			diseaseTypeId: diseaseTypeId,
			diseaseTypeGroupName: diseaseTypeGroupName,
		} = diseaseObj;
		// diseaseTypeOptions.value = typeOptions || [];
		// const index = diseaseTypeOptions.value.findIndex(item => item === diseaseType);
		const master = collectDiseaseTypesForCurrentComponent();
		masterDiseaseTypesCache.value = master;
		let dt = master.find((item) => matchDiseaseTypeId(item.id, diseaseTypeId));
		if (dt) {
			groupNamesArray = [...new Set(master.map((t) => t.groupName).filter(Boolean))];
			sortDiseaseGroupNames(groupNamesArray);
			const gLabel = diseaseTypeGroupName || dt.groupName;
			let gi = groupNamesArray.indexOf(gLabel);
			if (gi < 0) gi = 0;
			const selectedGroupName = groupNamesArray[gi];
			const typesInGroup = master.filter((t) => t.groupName === selectedGroupName);
			let ti = typesInGroup.findIndex((item) => matchDiseaseTypeId(item.id, diseaseTypeId));
			if (ti < 0) ti = 0;
			const ci = DISEASE_TOP_CATEGORY_OPTIONS.indexOf(getDiseaseTopCategory(dt));
			diseaseTypeMultiIndex.value = [ci >= 0 ? ci : -1, gi, ti];
		} else {
			diseaseTypeMultiIndex.value = [-1, -1, -1];
		}
		updateDiseaseTypeOptions();
		emitDiseaseAssessmentTopCategory();
		typePicker.value = diseaseTypeCode + '#' + diseaseType;
		typeindex.value = diseaseTypeMultiIndex.value[2];
		// 如果选择了"其他"，清空typeInput，等待用户输入
		if (isTypePickerOtherLike(typePicker.value)) {
			typeInput.value = diseaseTypeInput;
		} else {
			// 否则直接更新type值
			type.value = typePicker.value;
		}
		// 获取选中的病害类型对象
		const selectedDiseaseType =
			dt || allDiseaseTypes.find((item) => matchDiseaseTypeId(item.id, diseaseTypeId));
		if (selectedDiseaseType && selectedDiseaseType.threshold) {
			uni.$emit('setThreshold', selectedDiseaseType.threshold)
		}
		if (selectedDiseaseType && selectedDiseaseType.maxScale && selectedDiseaseType.minScale) {
			// 根据maxScale和minScale更新评定标度选项
			const minScale = parseInt(selectedDiseaseType.minScale) || 1;
			const maxScale = parseInt(selectedDiseaseType.maxScale) || 4;

			uni.$emit('changeScale', {
				minScale: minScale,
				maxScale: maxScale
			});
			console.log('更新评定标度范围:', minScale, '至', maxScale);
		}
		const selectColEmit =
			selectedDiseaseType?.selectColumn ?? selectedDiseaseType?.select_column ?? 0;
		uni.$emit('setSelectColumn', selectColEmit);

		console.log('病害类型选择变更为:', typePicker.value);
		if (selectedDiseaseType?.code != null) {
			uni.$emit('setDiseaseHelp', selectedDiseaseType.code);
		}
	}

	// 监听typePicker和typeInput的变化，更新type
	watch([typePicker, typeInput], ([newTypePicker, newTypeInput]) => {
		const part = newTypePicker?.split?.('#')?.[1];
		if (part && (part.includes('其他') || part.includes('其它')) && newTypeInput) {
			type.value = newTypeInput;
		} else {
			type.value = newTypePicker;
		}
	}, {
		deep: true
	});

	// 监听positionPicker和positionInput的变化，更新position
	watch([positionPicker, positionInput], ([newPositionPicker, newPositionInput]) => {
		if (newPositionPicker === '其他' && newPositionInput) {
			position.value = newPositionInput;
		} else if (newPositionPicker !== '其他') {
			position.value = newPositionPicker;
		}
	}, {
		deep: true
	});

	const getAncestors = () => {
		let ancestors = null;
		if (typeMultiIndex.value[2] >= 0 && !isThirdLevelOther()) {
			const selectedSecondLevel = biObjectNameOptions.value[typeMultiIndex.value[1]];
			if (selectedSecondLevel && selectedSecondLevel.children &&
				Array.isArray(selectedSecondLevel.children) &&
				typeMultiIndex.value[2] < selectedSecondLevel.children.length) {

				const selectedThirdLevel = selectedSecondLevel.children[typeMultiIndex.value[2]];
				if (selectedThirdLevel && selectedThirdLevel.name) {
					// ancestors = selectedThirdLevel.ancestors;
					const objectThirdLevel = getObjectThirdLevelByName(
						grandObjectName.value,
						parentObjectName.value,
						componentNamePicker.value
					);
          ancestors = objectThirdLevel?.ancestors ?? selectedThirdLevel.ancestors;
					console.log('找到第三级组件ancestors:', ancestors);
				}
			}
		}
		return ancestors;
	}

	// 添加isThirdLevelOther辅助函数，用于判断是否选择了"其他"选项
	const isThirdLevelOther = () => {
		if (typeMultiIndex.value[1] < 0 || typeMultiIndex.value[2] < 0) {
			return true;
		}

		const selectedSecondLevel = biObjectNameOptions.value[typeMultiIndex.value[1]];
		if (!selectedSecondLevel || !selectedSecondLevel.children || !Array.isArray(selectedSecondLevel.children)) {
			return true;
		}

		return typeMultiIndex.value[2] >= selectedSecondLevel.children.length;
	};

	const diseaseTypeObj = computed(() => {
		return allDiseaseTypes[typeindex.value];
	});

	const component = computed(() => {
		// 获取构件名称
		const componentName = getComponentName();

		const ancestors = getAncestors();
		return {
			createBy: "",
			createTime: '',
			updateTime: '',
			id: null, // 第一级id设为null
			code: componentCodeInput.value, // 使用输入的构件编号
			name: componentCodeInput.value + '#' + componentName, // 使用第三级选择的值或输入框中的值#构件编号
			biObjectId: componentId.value,
			status: "0",
			delFlag: "0",
			componentMaterial: componentMaterial.value,
			biObject: {
				id: componentId.value,
				name: componentNamePicker.value, // 使用第三级选择的值
				count: 0,
				ancestors: ancestors
			},
			parentObjectName: parentObjectName.value, // 使用第二级选择的值
			grandObjectName: grandObjectName.value // 使用第一级选择的值
		}
	});

	const getBiObjctName = computed(() => {
		return getComponentName()
	});

	defineExpose({
		getBiObjctName,
		diseaseTypeObj,
		component,
		componentCodeInput,
		componentMaterial,
		position,
		type,
		positionNumber,
		positionSegmentFlag,
		mileageStation1,
		mileageStation2
	});
</script>

<style scoped>
	/*picker公用*/
	.picker-content {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
	}

	.input-content {
    display: flex;
    flex-direction: row;
    align-items: center;
    border: 1rpx solid #EEEEEE;
    padding: 4rpx 4rpx;
	}
  .input-content-input{
    width: 80rpx;
    font-size: 18rpx;
  }

	.left-icon {
		margin-right: 5rpx;
	}

	.mid-icon {
		margin: 0 5rpx;
	}

	.head {
		background-color: #BDCBE0;
	}

	.head-text {
		padding: 4rpx 10rpx;
		font-size: 18rpx;
	}

	.picker {
		font-size: 20rpx;
	}

	/* 构件未就绪时弱化病害行，点击仍由逻辑提示 */
	.picker--disabled-soft .picker-content,
	.picker--disabled-soft .picker-icon {
		opacity: 0.45;
	}

	.picker-content--ellipsis {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: row;
		justify-content: flex-end;
		align-items: center;
	}

	.picker-ellipsis-text {
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		text-align: right;
	}

	.picker-titleAndContent {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
		padding: 14rpx 12rpx;
		border-bottom: 1rpx solid #eee;
	}

	.picker-title {
		color: #666666;
		font-size: 20rpx;
	}

	.picker-right {
		display: flex;
		flex-direction: row;
		align-items: center;
	}

	.picker-right-tap {
		display: flex;
		flex-direction: row;
		align-items: center;
		flex: 1;
		min-width: 0;
		justify-content: flex-end;
	}

	.picker-left {
		display: flex;
		flex-direction: row;
		align-items: center;
	}

	.picker-content {
		color: #333333;
		font-size: 20rpx;
		margin-right: 10rpx;
	}

	.picker-icon {
		color: #CCCCCC;
		font-size: 20rpx;
	}

	.picker-must {
		color: #FF0000;
	}

	.component-name-input {
		display: flex;
		flex-direction: row;
		align-items: center;
		width: 180rpx;
		border: 1rpx solid #eee;
		padding: 0 4rpx;
	}

	/* 深度穿透组件样式 */
	::v-deep .uni-data-checklist .checklist-box {
		min-height: 20rpx !important;
		min-width: 60rpx !important;
		display: flex !important;
		align-items: center !important;
		justify-content: center !important;
	}

	/* 单独处理文本容器 */
	::v-deep .uni-data-checklist .checklist-box .checklist-content {
		line-height: 1 !important;
		/* 重置行高 */
		display: flex !important;
		align-items: center !important;
		justify-content: center !important;
		width: 100% !important;
		/* 确保文本容器占满父级 */
	}

	/* 构件编号输入框样式 */
	.input-right {
		display: flex;
		flex-direction: row;
		align-items: center;
		width: 180rpx;
		border: 1rpx solid #eee;
		padding: 0 4rpx;
	}

	.component-code-input {
		font-size: 20rpx;
		text-align: right;
		padding-right: 10rpx;
	}

	.clear-input {
		opacity: 0.5;
	}

	.clear-icon {
		width: 16rpx;
		height: 14rpx;
		opacity: 0.5;
		flex-shrink: 0;
	}

	.componentCode-popup-content {
		/* 格式输入 / 特殊符号：前缀宽与间隔宽一致，便于两行四列对齐 */
		--code-strip-leading: 58rpx;
		--code-strip-gap: 10rpx;
		background-color: #fff;
		width: 560rpx;
		max-width: 72vw;
		max-height: 94vh;
		border-radius: 0;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border: 1rpx solid #2a7ddf;
	}

	.code-popup-form {
		display: flex;
		flex-direction: column;
		gap: 16rpx;
		padding: 16rpx 16rpx 12rpx;
		box-sizing: border-box;
		flex: 1;
		min-height: 0;
		overflow-y: auto;
	}

	.popup-title {
		background-color: #BDCBE0;
		font-size: 16rpx;
		padding: 10rpx 0 9rpx;
		text-align: center;
		color: #1f2d3d;
		border-bottom: 1rpx solid #2a7ddf;
	}

	.code-popup-row {
		display: flex;
		align-items: center;
		padding: 0;
		box-sizing: border-box;
		gap: 10rpx;
	}

	/* 效果图：格式条较高，标签与首行对齐 */
	.code-popup-row--format-strip {
		align-items: flex-start;
	}

	.code-popup-row--special {
		align-items: center;
	}

	/* 必须用 view：App 端 text 作 flex 子项常忽略 flex-basis，这里统一用 view 保证宽度稳定 */
	.code-popup-label {
		font-size: 15rpx;
		color: #666666;
		width: 96rpx;
		max-width: 96rpx;
		flex: 0 0 96rpx;
		flex-shrink: 0;
		line-height: 40rpx;
		min-height: 40rpx;
		padding: 0;
		box-sizing: border-box;
		text-align: left;
		white-space: nowrap;
	}

	.code-popup-row--format-strip .code-popup-label {
		padding-top: 8rpx;
		line-height: 1.35;
		min-height: 0;
		align-self: flex-start;
	}

	.code-popup-row--special .code-popup-label {
		padding-top: 0;
		line-height: 40rpx;
		min-height: 40rpx;
	}

	.code-popup-row.recent-code-row {
		align-items: flex-start;
	}

	.code-popup-row.recent-code-row .code-popup-label {
		padding-top: 2rpx;
		line-height: 1.4;
		min-height: 0;
		align-self: flex-start;
	}

	.code-popup-value {
		display: flex;
		flex: 1;
		min-width: 0;
		align-items: center;
		border: 1rpx solid #d7dde6;
		border-radius: 2rpx;
		margin-left: 0;
		padding: 0 10rpx;
		/* 与病害位置弹窗内输入框一致 */
		height: 40rpx;
		background: #fff;
	}

	.code-popup-value input {
		flex: 1;
		padding: 0;
		font-size: 15rpx;
		color: #333;
	}

	.code-popup-material-picker {
		flex: 1;
		min-width: 0;
		margin-left: 0;
	}

	.code-popup-material-value {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		height: 40rpx;
		padding: 0 10rpx;
		box-sizing: border-box;
		border: 1rpx solid #d7dde6;
		border-radius: 2rpx;
		background: #fff;
	}

	.code-popup-material-text {
		flex: 1;
		min-width: 0;
		font-size: 15rpx;
		color: #333;
		line-height: 40rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.code-popup-material-text.is-placeholder {
		color: #CCCCCC;
	}

	/* 格式输入 / 特殊符号：同一 grid 模板，四列数字与四列单选严格同宽对齐 */
	.code-code-grid {
		flex: 1;
		min-width: 0;
		margin-left: 0;
		display: grid;
		grid-template-columns:
			var(--code-strip-leading)
			var(--code-strip-gap)
			minmax(0, 1fr)
			var(--code-strip-gap)
			minmax(0, 1fr)
			var(--code-strip-gap)
			minmax(0, 1fr)
			var(--code-strip-gap)
			minmax(0, 1fr);
		align-items: center;
		column-gap: 0;
	}

	.code-grid-lead {
		width: 100%;
		min-width: 0;
		box-sizing: border-box;
		align-self: stretch;
		display: flex;
		align-items: center;
	}

	.code-grid-lead-spacer {
		box-sizing: border-box;
		width: 100%;
		min-height: 1rpx;
	}

	.code-grid-num {
		min-width: 0;
		display: flex;
		align-items: center;
	}

	.code-grid-num .code-part-box {
		width: 100%;
		max-width: none;
		flex: 1;
		min-width: 0;
	}

	.code-grid-sep {
		text-align: center;
		font-size: 15rpx;
		font-weight: 800;
		color: #475569;
		line-height: 40rpx;
		align-self: center;
		padding: 0 2rpx;
	}

	.code-grid-gap-ph {
		min-height: 20rpx;
		pointer-events: none;
	}

	.code-grid-radio {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 0;
	}

	.code-part-box {
		border: 1rpx solid #d7dde6;
		display: flex;
		align-items: center;
		justify-content: flex-start;
		position: relative;
		height: 40rpx;
		padding: 0 4rpx;
		min-width: 0;
		background-color: #fff;
		border-radius: 2rpx;
		box-sizing: border-box;
		flex: 1 1 0;
	}

	.code-prefix-box {
		padding-right: 10rpx;
	}

	.code-prefix-text {
		flex: 1;
		margin-right: 4rpx;
		white-space: nowrap;
		color: #333;
		font-size: 15rpx;
	}

	.code-part-box input {
		width: 100%;
		font-size: 15rpx;
		text-align: center;
		color: #333;
		padding-right: 20rpx;
		box-sizing: border-box;
	}

	.code-grid-num .code-part-box input {
		padding-right: 14rpx;
		font-size: 14rpx;
	}

	/* 格式输入内删除图标固定在每个输入框右侧 */
	.code-grid-num .code-part-box .clear-icon {
		position: absolute;
		right: 4rpx;
		top: 50%;
		transform: translateY(-50%);
		width: 16rpx;
		height: 16rpx;
		z-index: 2;
	}

	.code-special-check,
	.code-radio {
		width: 20rpx;
		height: 20rpx;
		border-radius: 50%;
		border: 2rpx solid #cfd4dc;
		background-color: #fff;
		position: relative;
		box-sizing: border-box;
	}

	.code-special-check.active,
	.code-radio.active {
		border-color: #1d6fe9;
		background-color: #1d6fe9;
	}

	.code-special-check.active::after,
	.code-radio.active::after {
		content: '';
		position: absolute;
		left: 4rpx;
		top: 0rpx;
		width: 5rpx;
		height: 9rpx;
		border-right: 2rpx solid #fff;
		border-bottom: 2rpx solid #fff;
		transform: rotate(45deg);
	}

	.code-ownership-list {
		flex: 1;
		min-width: 0;
		margin-left: 0;
		display: flex;
		flex-direction: column;
		gap: 12rpx;
		padding-top: 0;
	}

	.code-ownership-item {
		display: flex;
		align-items: center;
		gap: 10rpx;
		font-size: 15rpx;
		color: #333;
		line-height: 1;
	}

	.recent-code-list {
		flex: 1;
		min-width: 0;
		margin-left: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 8rpx 14rpx;
		align-items: center;
		align-content: flex-start;
		min-height: 24rpx;
	}

	.recent-code-item {
		font-size: 14rpx;
		color: #1d6fe9;
		white-space: nowrap;
		padding: 4rpx 0;
		line-height: 1.5;
		text-decoration: none;
	}

	.popup-button {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin-top: 0;
		gap: 12rpx;
		padding: 12rpx 14rpx 16rpx;
		border-top: 1rpx solid #eef2f7;
		background: #fff;
	}

	/* 构件编号弹窗：去掉按钮区顶部分割线 */
	.popup-button--component-code {
		border-top: none;
	}

	.popup-button button {
		min-width: 82rpx;
		height: 40rpx;
		line-height: 40rpx;
		font-size: 16rpx;
		padding: 0 10rpx;
		border-radius: 5rpx;
		margin: 0;
		box-sizing: border-box;
		display: flex;
		justify-content: center;
		align-items: center;
		text-align: center;
	}

	.popup-button button::after {
		border: none !important;
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

	.position-popup-content {
		background-color: #fff;
		width: 500rpx;
		max-width: 78vw;
		min-height: 332rpx;
		border-radius: 0;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border: 1rpx solid #2a7ddf;
	}

	.position-popup-title {
		background-color: #BDCBE0;
		font-size: 16rpx;
		padding: 8rpx 0 7rpx;
		text-align: center;
		color: #1f2d3d;
		border-bottom: 1rpx solid #2a7ddf;
	}

	.position-popup-form {
		padding: 12rpx 0 6rpx;
		flex: 1;
	}

	.position-popup-row {
		display: flex;
		align-items: center;
		padding: 14rpx 20rpx 0;
		box-sizing: border-box;
	}

	.position-popup-label {
		width: 92rpx;
		flex: 0 0 92rpx;
		font-size: 15rpx;
		color: #666666;
		line-height: 40rpx;
	}

	.position-popup-combined {
		flex: 1;
		margin-left: 12rpx;
		font-size: 15rpx;
		color: #333;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.position-popup-index-row,
	.position-popup-name-row {
		flex: 1;
		margin-left: 12rpx;
		display: flex;
		align-items: center;
		font-size: 15rpx;
		color: #666;
		min-width: 0;
	}

	.position-popup-index-input,
	.position-popup-picker,
	.position-popup-other-input {
		height: 40rpx;
		border: 1rpx solid #d7dde6;
		border-radius: 2rpx;
		background-color: #fff;
		box-sizing: border-box;
		display: flex;
		align-items: center;
	}

	.position-popup-index-input {
		width: 106rpx;
		margin: 0 8rpx;
		padding: 0 8rpx;
	}

	.position-popup-index-input.is-disabled {
		opacity: 0.45;
		background-color: #f5f6f8;
	}

	.position-popup-segment-flags {
		flex: 1;
		margin-left: 12rpx;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 28rpx;
	}

	.position-popup-radio-item {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 8rpx;
		font-size: 15rpx;
		color: #333;
	}

	.position-popup-picker {
		width: 220rpx;
		flex: 0 0 220rpx;
		padding: 0 10rpx;
		justify-content: space-between;
	}

	.position-popup-picker-text {
		flex: 1;
		font-size: 15rpx;
		color: #333;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.position-popup-other-input {
		width: 140rpx;
		margin-left: 10rpx;
		padding: 0 8rpx;
	}

	.position-popup-other-input input,
	.position-popup-index-input input {
		flex: 1;
		font-size: 15rpx;
		color: #333;
	}

	.position-number-input {
		width: 100%;
		font-size: 15rpx;
		text-align: center;
	}

	.clear-icon {
		width: 18rpx;
		height: 18rpx;
	}

	/* 选择构件类型弹窗：与 BridgeSpanRangeDialog 对齐 */
	.cmp-type-popup {
		--bs-fs: 16rpx;
		--bs-btn-h: 40rpx;
		--bs-field-h: 36rpx;
		--bs-form-pad-x: 24rpx;
		background-color: #fff;
		width: 66.6667vw;
		max-width: 92vw;
		border-radius: 8rpx;
		overflow: hidden;
		box-sizing: border-box;
		font-size: var(--bs-fs);
	}

	.cmp-type-popup-title {
		background-color: #bdcbe0;
		padding: 12rpx 16rpx;
		text-align: center;
		box-sizing: border-box;
	}

	.cmp-type-popup-title-text {
		font-size: var(--bs-fs);
		color: #0f4687;
		font-weight: 500;
	}

	.cmp-type-form {
		padding: 20rpx var(--bs-form-pad-x) 8rpx;
		box-sizing: border-box;
	}

	.cmp-type-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		margin-bottom: 18rpx;
		font-size: var(--bs-fs);
	}

	.cmp-type-row--child .cmp-type-field-inline {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 8rpx;
	}

	/* 子部件选「其他」：标签文案 + ›（可点重选）+ 输入框 */
	.cmp-type-other-trigger {
		flex: 0 0 auto;
		display: flex;
		flex-direction: row;
		align-items: center;
		height: var(--bs-field-h);
		min-height: var(--bs-field-h);
		padding: 0 10rpx 0 8rpx;
		box-sizing: border-box;
	}

	.cmp-type-other-tag-text {
		font-size: var(--bs-fs);
		color: #333333;
		line-height: var(--bs-field-h);
		white-space: nowrap;
	}

	.cmp-type-other-tag-arrow {
		font-size: 26rpx;
		line-height: var(--bs-field-h);
		color: #a0aec0;
		margin-left: 4rpx;
		font-weight: 500;
	}

	.cmp-type-other-name-input {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: row;
		align-items: center;
		border: 1rpx solid #cccccc;
		border-radius: 0;
		padding: 0 4rpx 0 6rpx;
		box-sizing: border-box;
		background: #fff;
		height: var(--bs-field-h);
		min-height: var(--bs-field-h);
		max-height: var(--bs-field-h);
	}

	.cmp-type-other-name-input-field {
		flex: 1;
		min-width: 0;
		height: 100%;
		font-size: var(--bs-fs);
		color: #333333;
		line-height: var(--bs-field-h);
		border: none;
		padding: 0;
		box-sizing: border-box;
		background: transparent;
	}

	.cmp-type-other-clear {
		width: 24rpx;
		height: 24rpx;
		flex-shrink: 0;
		margin-left: 2rpx;
		opacity: 0.55;
	}

	.cmp-type-label {
		width: 108rpx;
		flex: 0 0 108rpx;
		padding-right: 8rpx;
		box-sizing: border-box;
		font-size: var(--bs-fs);
		color: #666666;
		line-height: 1.35;
	}

	.cmp-type-select {
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

	.cmp-type-select-text {
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

	.cmp-type-select-text.is-placeholder {
		color: #a0aec0;
	}

	.cmp-type-select-arrow {
		font-size: 26rpx;
		line-height: var(--bs-field-h);
		color: #a0aec0;
		flex-shrink: 0;
		margin-left: 6rpx;
		font-weight: 500;
	}

	.cmp-type-popup-actions {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
		align-items: center;
		justify-content: center;
		gap: 20rpx;
		box-sizing: border-box;
		width: 100%;
		padding: 12rpx var(--bs-form-pad-x) 20rpx;
	}

	.cmp-type-btn-outline {
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
		padding: 0 24rpx;
		border-radius: 5rpx;
		box-sizing: border-box;
	}

	.cmp-type-btn-outline text,
	.cmp-type-btn-confirm text {
		font-size: var(--bs-fs);
		line-height: 1.2;
		text-align: center;
		color: inherit;
		white-space: nowrap;
	}

	.cmp-type-btn-confirm {
		flex: 0 0 auto;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #1677ff;
		color: #ffffff;
		font-size: var(--bs-fs);
		min-height: var(--bs-btn-h);
		height: var(--bs-btn-h);
		padding: 0 24rpx;
		border-radius: 5rpx;
		box-sizing: border-box;
		border: 1rpx solid #1677ff;
	}

	.cmp-type-btn--hover {
		opacity: 0.88;
	}

	/* ── 三列联动底部面板 ── */
	.cascade-wrap {
		background: #fff;
		border-radius: 16rpx 16rpx 0 0;
		padding-bottom: env(safe-area-inset-bottom);
		--cascade-lift: 12rpx;
	}

	.cascade-header {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		padding: 8rpx 18rpx;
		border-bottom: 1rpx solid #e9e9e9;
		background: #fff;
	}

	.cascade-cancel-btn {
		font-size: 20rpx;
		line-height: 44rpx;
		color: #666;
		padding: 0 6rpx;
	}

	.cascade-title {
		font-size: 20rpx;
		line-height: 44rpx;
		color: #333;
		font-weight: 500;
		flex: 1;
		text-align: center;
	}

	.cascade-confirm-btn {
		font-size: 20rpx;
		line-height: 44rpx;
		color: #1677FF;
		padding: 0 6rpx;
	}

	.cascade-picker {
		width: 100%;
		/* 统一用 rpx：适配不同尺寸设备；高度给 5 行（更紧凑） */
		height: 360rpx;
		background: #fff;
		/* 滚轮整体上移一点，同时底部补回同等空间，总高度不变 */
		margin-top: calc(var(--cascade-lift) * -1);
		padding-bottom: var(--cascade-lift);
	}

	.cascade-picker-col {
		flex: 1;
	}

	.cascade-picker-item {
		/* 必须与 indicator-style 完全一致，否则会出现上下留白/行距异常 */
		height: 56rpx;
		line-height: 56rpx;
		text-align: center;
		font-size: 20rpx;
		color: #333;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		padding: 0 16rpx;
		box-sizing: border-box;
	}

	/* 选中指示器（两条线），模拟 iOS picker 中间高亮 */
	:deep(.cascade-indicator) {
		border-top: 1rpx solid #e6e6e6;
		border-bottom: 1rpx solid #e6e6e6;
	}

	/* 底部列表叠在居中弹窗之上（居中弹窗仍在，仅列表可操作）；uni-popup 默认 z-index 较低 */
	:deep(.cmp-type-level-sheet-popup.uni-popup) {
		z-index: 10001 !important;
	}

  /* 手机端适配 */
  @media (max-width: 599px) {
    .componentCode-popup-content {
      background-color: #fff;
      width: 560rpx;
      max-width: 72vw;
      min-height: 450rpx;
      max-height: 94vh;
      border-radius: 8rpx;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .position-popup-content {
      width: 72vw;
      max-width: 500rpx;
      min-height: 332rpx;
    }
  }
</style>