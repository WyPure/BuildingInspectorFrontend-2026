<template>
	<view class="container page-bridge-disease" :style="pageCssVars">
		<uni-nav-bar
			:fixed="true"
			:statusBar="true"
			:border="false"
			backgroundColor="#0F4687"
			color="#ffffff"
			leftIcon="left"
			:title="''"
			:rightWidth="100"
			@clickLeft="onNavBack"
		>
			<view class="bridge-nav-title-wrap">
				<text class="bridge-nav-title-text">{{ navigationBarTitle }}</text>
			</view>
			<template v-slot:right>
				<view class="bridge-page-nav-info" @click.stop="openInfoActions">
					<text class="bridge-page-nav-info-icon">ⓘ</text>
				</view>
			</template>
		</uni-nav-bar>

		<view class="tabs main-tabs">
			<view class="tabs-track">
				<view v-for="(tab, index) in mainTabs" :key="index"
					:class="['tab-item', activeMainTab === index ? 'active' : '']" @click="switchMainTab(index)">
					<view class="tab-item-text">
						{{ tab.name }}
						<image v-if="(index === 0 && (diseaseSubmitStatus === 0 || structureSubmitStatus === 0))"
							src="/static/image/red.png" class="red-icon"></image>
						<image v-else-if="(index === 0 && diseaseSubmitStatus === 2)" src="/static/image/yellow.png"
							class="yellow-icon"></image>
						<image v-if="(index === 1 && frontPhotoSubmitStatus === 0)" src="/static/image/red.png"
							class="red-icon"></image>
						<image v-if="(index === 2 && currentPhotoSubmitStatus === 0)" src="/static/image/red.png"
							class="red-icon"></image>
					</view>
				</view>
				<view class="tab-indicator" :style="indicatorStyle"></view>
			</view>
		</view>

		<view
			v-show="awaitingBridgeSpanInDiseaseTab"
			class="bridge-span-waiting-hint-wrap">
			<view class="bridge-span-waiting-hint-inner">
				<text class="bridge-span-waiting-hint-text">{{ BRIDGE_SPAN_NOTICE_TEXT }}</text>
			</view>
		</view>
		<BridgeSpanBar
			v-show="activeMainTab === 0 && bridgeSpanResolved && bridgeSpanConfigured"
			mode="pills"
			:bridge-span-items="bridgeSpanItems"
			:bridge-span-selected-index="bridgeSpanSelectedIndex"
			:span-badge-map="spanBadgeMap"
			:toolbar-height-rpx="BRIDGE_DISEASE_TOOLBAR_HEIGHT_RPX"
			@select-span="selectBridgeSpan"
		/>

		<BridgeInspectionToolbar
			v-show="activeMainTab === 0"
			:inspection-sub-tabs="inspectionSubTabs"
			:active-sub-tab="activeSubTab"
			v-model:search-text="inspectionToolbarSearch"
			:bridge-span-ready="bridgeSpanReady"
			:awaiting-bridge-span-range="awaitingBridgeSpanInDiseaseTab"
			:history-select-mode-active="historySelectModeActive"
			:toolbar-height-rpx="BRIDGE_DISEASE_TOOLBAR_HEIGHT_RPX"
			@switch-sub-tab="switchSubTab"
			@search-confirm="syncInspectionToolbarSearchToPanes"
			@add-disease="onAddDiseaseTap"
			@history-select="onHistoryToolbarSelect"
			@history-copy="onHistoryToolbarCopy"
			@history-cancel="onHistoryToolbarCancel"
			@configure-bridge-span="openBridgeSpanPopup"
		/>

		<view class="content main-content">
			<view v-show="activeMainTab === 0" class="inspection-body">
				<view v-show="activeSubTab === 0" class="inspection-pane">
					<current-disease ref="currentDiseaseRef" :activeTabTop="legacyActiveTabTop"
						:selected-bridge-span="bridgeSpanSelectedNumber"
						:external-toolbar="true" :disable-add-disease="!bridgeSpanReady" />
				</view>
				<view v-show="activeSubTab === 1" class="inspection-pane">
					<history-disease ref="historyDiseaseRef" :activeTabTop="legacyActiveTabTop"
						:selected-bridge-span="bridgeSpanSelectedNumber"
						:external-toolbar="true"
						@select-mode-change="onHistorySelectModeChange" />
				</view>
				<view
					v-if="structureInfoPaneMounted"
					v-show="activeMainTab === 0 && activeSubTab === 2"
					class="inspection-pane">
					<structure-info :activeTabTop="legacyActiveTabTop" :embed-in-inspection="true"
						:selected-bridge-span="bridgeSpanSelectedNumber" />
				</view>
			</view>
			<view v-show="activeMainTab === 1" class="inspection-pane inspection-pane--front-photo">
				<front-photo :activeTabTop="legacyActiveTabTop"></front-photo>
			</view>
			<view v-show="activeMainTab === 2" class="inspection-pane inspection-pane--current-photo">
				<current-photo :activeTabTop="legacyActiveTabTop"></current-photo>
			</view>
			<view v-show="activeMainTab === 3" class="inspection-pane">
				<bridge-archive :activeTabTop="legacyActiveTabTop"></bridge-archive>
			</view>
		</view>

		<uni-popup ref="deleteBuildingDataPopup" type="center">
			<view class="deleteBuildingData-popup-content">
				<view class="popup-title">警告</view>
				<view class="popup-input1">
					<view class="popup-input1-content">
						<text>该操作将清空[{{bridgeName}}]在本地保存的下列数据：\n* 当前病害\n* 正立面照\n* 现状照\n*
							结构信息\n\n执行该操作将无法恢复上述数据，已提交到服务器的数据不受影响，您是否执行该操作？</text>
					</view>
				</view>
				<view class="popup-button">
					<button class="popup-button-confirm" @click="confirmDeleteBuildingData">确定</button>
					<button class="popup-button-cancel" @click="closeDeleteBuildingPopup">取消</button>
				</view>
			</view>
		</uni-popup>

		<BridgeSpanRangeDialog
			ref="bridgeSpanRangeDialogRef"
			:popup-title="BRIDGE_SPAN_POPUP_TITLE"
			:bridge-name="bridgeName"
			:bridge-code="bridgeCode"
			:span-end="bridgeSpanEndInput"
			:span-type-name="bridgeSpanTypeNameInput"
			:span-length-m="bridgeSpanLengthInput"
			@update:span-end="bridgeSpanEndInput = $event"
			@update:span-type-name="bridgeSpanTypeNameInput = $event"
			@update:span-length-m="bridgeSpanLengthInput = $event"
			@confirm="confirmBridgeSpan"
			@cancel="closeBridgeSpanPopup"
			@copy-prev="onBridgeSpanDialogCopyPrev"
			@copy-next="onBridgeSpanDialogCopyNext"
		/>

		<BridgeInfoDialog
			ref="bridgeInfoDialogRef"
			:bridge-name="bridgeName"
			:bridge-code="bridgeCode"
			:bridge-pile-number="bridgePileNumber"
			:route-name="routeName"
			:route-code="routeCode"
		/>

		<ChatAgentButton />
	</view>
</template>

<script setup>
	import currentDisease from '../../components/current-disease.vue';
	import historyDisease from '../../components/history-disease.vue';
	import bridgeArchive from '../../components/bridge-archive.vue';
	import structureInfo from '../../components/structure-info.vue';
	import frontPhoto from "@/components/front-photo.vue";
	import {
		ref,
		computed,
		onMounted,
		onUnmounted,
		watch,
		nextTick
	} from 'vue';
	import {
		onShow
	} from '@dcloudio/uni-app';
	import CurrentPhoto from "@/components/current-photo.vue";
	import {
		getULDisease,
		isUnFinishDisease,
		getFrontPhoto,
		readDiseaseCommit
	} from "@/utils/readJsonNew";
	import {
		readWarning
	} from "@/utils/warning";
	import {
		saveBridgeZip,
		setObject
	} from "@/utils/writeNew";
	import {
		setFrontPhotoCommited
	} from "@/utils/frontPhoto";
	import {
		readCommit,
		setCommit1
	} from "@/utils/CurrentPhoto";
	import {
		isBuildingCommited,
		setBuildingCommitted,
		setBuildingNull
	} from "@/utils/isBuildingCommited";
	import {
		userStore
	} from "@/store";
	import {
		idStore
	} from "@/store/idStorage";
	import {
		getObjectUL
	} from "@/utils/readUL";
	import {
		useObject
	} from "@/store/object";
	import {
		refreshDiseaseNumber
	} from "@/utils/diseaseNumber";
	import apiConfig from '../../config/api';
	import ChatAgentButton from '../../components/ChatAgentButton.vue';
	import {
		deleteULbuilding
	} from "@/utils/deleteBuilding";
	import {
		BRIDGE_SPAN_NOTICE_TEXT,
		BRIDGE_SPAN_POPUP_TITLE,
		BRIDGE_DISEASE_MAIN_TABS,
		BRIDGE_DISEASE_INSPECTION_SUB_TABS,
		BRIDGE_DISEASE_TOOLBAR_HEIGHT_RPX
	} from './bridgeDiseasePageConstants';
	import BridgeInfoDialog from '@/components/bridge/BridgeInfoDialog.vue';
	import BridgeSpanRangeDialog from '@/components/bridge/BridgeSpanRangeDialog.vue';
	import BridgeSpanBar from '@/components/bridge/BridgeSpanBar.vue';
	import BridgeInspectionToolbar from '@/components/bridge/BridgeInspectionToolbar.vue';
	import {
		useBridgeRouteInfo
	} from '@/composables/useBridgeRouteInfo.js';

	const pageCssVars = computed(() => ({
		'--bd-toolbar-h': `${BRIDGE_DISEASE_TOOLBAR_HEIGHT_RPX}rpx`
	}));

	const idStorageInfo = idStore();
	const userInfo = userStore();
	const objectInfo = useObject();

	const {
		bridgeName,
		bridgeCode,
		bridgePileNumber,
		routeName,
		routeCode,
		readBridgeInfo
	} = useBridgeRouteInfo();

	// 控制提交按钮是否可点击
	const submitButtonEnabled = ref(false);
	const cachedObjectUL = ref(null);
	let cachedObjectULPromise = null;

	const invalidateObjectULCache = () => {
		cachedObjectUL.value = null;
		cachedObjectULPromise = null;
	};

	const loadObjectULCached = async ({
		force = false
	} = {}) => {
		if (force) {
			invalidateObjectULCache();
		}
		if (cachedObjectUL.value) {
			return cachedObjectUL.value;
		}
		if (cachedObjectULPromise) {
			return await cachedObjectULPromise;
		}

		cachedObjectULPromise = (async () => {
			const data = await getObjectUL(userInfo.username, idStorageInfo.buildingId);
			cachedObjectUL.value = data || null;
			return cachedObjectUL.value;
		})().finally(() => {
			cachedObjectULPromise = null;
		});

		return await cachedObjectULPromise;
	};

	const deleteBuildingDataPopup = ref(null);
	const bridgeSpanRangeDialogRef = ref(null);
	const bridgeInfoDialogRef = ref(null);
	const bridgeSpanConfigured = ref(false);
	const bridgeSpanResolved = ref(false);
	const bridgeSpanStartInput = ref('');
	const bridgeSpanEndInput = ref('');
	const bridgeSpanTypeNameInput = ref('');
	const bridgeSpanLengthInput = ref('');
	const bridgeSpanSelectedIndex = ref(0);
	/** 导航栏实际展示的跨号列表；有值时不再用 bridgeSpanStart～End 连续铺 1…N（避免下发占位 1–10 与用户只录第 10 跨冲突） */
	const bridgeSpanPillNumbers = ref(null);

	/** 用于桥跨标签角标：与 current-disease 跨匹配规则一致 */
	const diseaseListForSpanBadges = ref([]);

	const diseaseBelongsToSpan = (item, spanNo) => {
		const n = Number(spanNo);
		if (!Number.isFinite(n) || n <= 0) return true;
		if (item?.bridgeSpanNo !== undefined && item?.bridgeSpanNo !== null && item?.bridgeSpanNo !== '') {
			return Number(item.bridgeSpanNo) === n;
		}
		const spanRegex = new RegExp(`第\\s*${n}\\s*跨|${n}\\s*跨`);
		const candidates = [
			item?.position,
			item?.description,
			item?.biObjectName,
			item?.type,
			item?.component?.code,
			item?.component?.name,
			item?.component?.biObject?.name
		].filter(Boolean);
		return candidates.some((v) => spanRegex.test(String(v)));
	};

	const loadDiseaseListForSpanBadges = async () => {
		try {
			const year = idStorageInfo.projectYear;
			const yearData = await getULDisease(userInfo.username, idStorageInfo.buildingId, year);
			diseaseListForSpanBadges.value = yearData?.diseases && Array.isArray(yearData.diseases)
				? yearData.diseases
				: [];
		} catch (e) {
			console.error('加载桥跨角标用病害数据失败:', e);
			diseaseListForSpanBadges.value = [];
		}
	};

	const spanBadgeMap = computed(() => {
		const map = {};
		const list = diseaseListForSpanBadges.value;
		for (const spanNo of bridgeSpanItems.value) {
			const inSpan = list.filter(
				(d) => d && d.commitType !== 2 && diseaseBelongsToSpan(d, spanNo)
			);
			const hasUnsubmitted = inSpan.some((d) => d.commitType === 1);
			const hasUnfinished = inSpan.some((d) => d.commitType === 3);
			if (hasUnsubmitted) {
				map[spanNo] = 'red';
			} else if (hasUnfinished) {
				map[spanNo] = 'yellow';
			} else {
				map[spanNo] = '';
			}
		}
		return map;
	});

	const currentDiseaseRef = ref(null);
	const historyDiseaseRef = ref(null);
	/** 与 history-disease 多选模式同步（父页工具条按钮） */
	const historySelectModeActive = ref(false);

	const mainTabs = ref([...BRIDGE_DISEASE_MAIN_TABS]);
	const inspectionSubTabs = ref([...BRIDGE_DISEASE_INSPECTION_SUB_TABS]);

	// 跟踪各个部分的提交状态
	const frontPhotoSubmitStatus = ref(1); // 0表示未提交，1表示已提交

	const diseaseSubmitStatus = ref(1) //0表未提交，1表示已提交,2表示存在未完成

	const currentPhotoSubmitStatus = ref(1) //0表未提交，1表示已提交

	const structureSubmitStatus = ref(1) // 0表未提交，1表示已提交

	const activeMainTab = ref(0);
	const activeSubTab = ref(0);

	/** 病害主 Tab 下桥跨尚未可用：本地状态未解析，或已解析但未配置（与工具条「仅新增桥跨」、提示条显隐一致） */
	const awaitingBridgeSpanInDiseaseTab = computed(
		() =>
			activeMainTab.value === 0 &&
			(!bridgeSpanResolved.value || !bridgeSpanConfigured.value)
	);

	/** 首次点选「桥跨信息」后再挂载 structure-info，并用 v-show 隐藏切换，避免 v-if 反复销毁导致每次进入都 onMounted、重复 loading/「加载完成」 */
	const structureInfoPaneMounted = ref(false);
	watch(
		() => [activeMainTab.value, activeSubTab.value],
		([main, sub]) => {
			if (main === 0 && sub === 2) {
				structureInfoPaneMounted.value = true;
			}
		},
		{ immediate: true }
	);

	const legacyActiveTabTop = computed(() => {
		if (activeMainTab.value === 0) {
			if (activeSubTab.value === 0) return 0;
			if (activeSubTab.value === 1) return 1;
			if (activeSubTab.value === 2) return 4;
		}
		if (activeMainTab.value === 1) return 2;
		if (activeMainTab.value === 2) return 3;
		if (activeMainTab.value === 3) return 5;
		return -1;
	});

	const emitStructurePageShow = () => {
		setTimeout(() => {
			uni.$emit('pageShow');
		}, 100);
	};

	const switchMainTab = (index) => {
		activeMainTab.value = index;
		if (index === 0 && activeSubTab.value === 2) {
			emitStructurePageShow();
		}
	};

	const switchSubTab = (index) => {
		activeSubTab.value = index;
	syncSelectedBridgeSpanToPanes();
		if (activeMainTab.value === 0 && index === 2) {
			emitStructurePageShow();
		}
	};

	const onHistorySelectModeChange = (v) => {
		historySelectModeActive.value = !!v;
	};

	const onHistoryToolbarSelect = () => {
		historyDiseaseRef.value?.toggleSelectMode?.();
	};

	const onHistoryToolbarCopy = () => {
		historyDiseaseRef.value?.copyDisease?.();
	};

	const onHistoryToolbarCancel = () => {
		historyDiseaseRef.value?.toggleSelectMode?.();
	};

	watch(activeSubTab, (v) => {
		if (v !== 1 && historySelectModeActive.value) {
			historyDiseaseRef.value?.toggleSelectMode?.();
		}
	});

	const indicatorStyle = computed(() => {
		const width = 100 / mainTabs.value.length;
		return {
			width: `${width * 0.6}%`,
			left: `calc(${width * activeMainTab.value}% + ${width / 2}% - ${width * 0.3}%)`,
			transform: 'none'
		};
	});

	const openInfoActions = () => {
		bridgeInfoDialogRef.value?.open();
	};

	/** 检测状况工具条：与「当前病害」「历史病害」共享的搜索关键词 */
	const inspectionToolbarSearch = ref('');

	const syncInspectionToolbarSearchToPanes = () => {
		const s = inspectionToolbarSearch.value == null ? '' : String(inspectionToolbarSearch.value);
		nextTick(() => {
			currentDiseaseRef.value?.setToolbarSearch?.(s);
			historyDiseaseRef.value?.setToolbarSearch?.(s);
		});
	};

	watch(inspectionToolbarSearch, () => {
		syncInspectionToolbarSearchToPanes();
	});

	const invokeCurrentAddDisease = () => {
		if (!bridgeSpanReady.value) {
			return;
		}
		currentDiseaseRef.value?.addNewDisease?.();
	};

	const onAddDiseaseTap = () => {
		if (!bridgeSpanReady.value) {
			return;
		}
		invokeCurrentAddDisease();
	};
	/** 从 object（含 bridgeSpanSetupBySpan）取某一跨的桥跨类型、跨径 */
	const getSpanMetaForNo = (obj, spanNo) => {
		if (!obj || spanNo == null || spanNo === '') return null;
		const n = parseInt(String(spanNo).trim(), 10);
		if (!Number.isFinite(n) || n < 1) return null;
		const by = obj.bridgeSpanSetupBySpan;
		const key = String(n);
		if (by && typeof by === 'object' && by[key] && typeof by[key] === 'object') {
			const row = by[key];
			const typeName = String(row.bridgeSpanSetupTypeName ?? '').trim();
			const pathM = String(row.bridgeSpanSetupPathM ?? '').trim();
			if (typeName || pathM) return { typeName, pathM };
		}
		const s = parseBridgeSpanInt(obj.bridgeSpanStart);
		const e = parseBridgeSpanInt(obj.bridgeSpanEnd);
		if (!Number.isNaN(s) && !Number.isNaN(e) && s === e && s === n) {
			const typeName = String(obj.bridgeSpanSetupTypeName ?? '').trim();
			const pathM = String(obj.bridgeSpanSetupPathM ?? '').trim();
			if (typeName || pathM) return { typeName, pathM };
		}
		return null;
	};

	const applySpanMetaToBridgeSpanPopup = (meta) => {
		if (!meta) return;
		if (meta.typeName) bridgeSpanTypeNameInput.value = meta.typeName;
		if (meta.pathM) bridgeSpanLengthInput.value = meta.pathM;
	};

	const onBridgeSpanDialogCopyPrev = async () => {
		const cur = parseBridgeSpanInt(bridgeSpanEndInput.value);
		if (Number.isNaN(cur) || cur < 1) {
			uni.showToast({
				title: '请先填写桥跨编号',
				icon: 'none'
			});
			return;
		}
		try {
			const obj = await loadObjectULCached();
			const minSpan = parseBridgeSpanInt(obj?.bridgeSpanStart);
			const firstSpan = !Number.isNaN(minSpan) && minSpan >= 1 ? minSpan : 1;
			if (cur <= firstSpan) {
				uni.showToast({
					title: '已为检测范围内第一跨，无前跨可复制',
					icon: 'none'
				});
				return;
			}
		const meta = getSpanMetaForNo(obj, cur - 1);
		if (!meta || (!meta.typeName && !meta.pathM)) {
			uni.showToast({
				title: '未找到前一跨的桥跨类型或跨径',
				icon: 'none'
			});
			return;
		}
		applySpanMetaToBridgeSpanPopup(meta);
		await confirmBridgeSpan();
	} catch (e) {
		console.error('从前一跨复制失败:', e);
		uni.showToast({
			title: '读取失败',
			icon: 'none'
		});
	}
};

	const onBridgeSpanDialogCopyNext = async () => {
		const cur = parseBridgeSpanInt(bridgeSpanEndInput.value);
		if (Number.isNaN(cur) || cur < 1) {
			uni.showToast({
				title: '请先填写桥跨编号',
				icon: 'none'
			});
			return;
		}
		try {
			const obj = await loadObjectULCached();
			const maxSpan = parseBridgeSpanInt(obj?.bridgeSpanEnd);
			if (Number.isNaN(maxSpan) || maxSpan < 1) {
				uni.showToast({
					title: '暂无已保存的桥跨范围，无法从后一跨复制',
					icon: 'none'
				});
				return;
			}
			// 后一跨必须在已保存的 [bridgeSpanStart, bridgeSpanEnd] 内才有数据可读
			if (cur + 1 > maxSpan) {
				uni.showToast({
					title: '暂无后一跨的已保存信息',
					icon: 'none'
				});
				return;
			}
		const meta = getSpanMetaForNo(obj, cur + 1);
		if (!meta || (!meta.typeName && !meta.pathM)) {
			uni.showToast({
				title: '未找到后一跨的桥跨类型或跨径',
				icon: 'none'
			});
			return;
		}
		applySpanMetaToBridgeSpanPopup(meta);
		await confirmBridgeSpan();
	} catch (e) {
		console.error('从后一跨复制失败:', e);
		uni.showToast({
			title: '读取失败',
			icon: 'none'
		});
	}
};

	// 查看在线数据
	const viewOnlineData = () => {
		uni.navigateTo({
			url: `/pages/online-information/online-information?bridgeCode=${bridgeCode.value}&bridgeName=${bridgeName.value}&bridgePileNumber=${bridgePileNumber.value}&routeName=${routeName.value}&routeCode=${routeCode.value}`
		});
	};

	const isBridgeSpanFlagOn = (v) => v === true || v === 1 || Number(v) === 1;
	const parseBridgeSpanInt = (v) => {
		const n = parseInt(String(v ?? '').trim(), 10);
		return Number.isFinite(n) ? n : NaN;
	};

	const normalizeBridgeSpanPillArray = (arr) => {
		if (!Array.isArray(arr) || !arr.length) return null;
		const out = [...new Set(arr.map((x) => parseBridgeSpanInt(x)).filter((n) => !Number.isNaN(n) && n >= 1))].sort(
			(a, b) => a - b
		);
		return out.length ? out : null;
	};

	/** 从按跨元信息 map 推断「已录入过类型/跨径」的跨号，用于无 bridgeSpanPillNumbers 时的迁移 */
	const pillsFromBySpanMeta = (obj) => {
		const by = obj?.bridgeSpanSetupBySpan;
		if (!by || typeof by !== 'object') return null;
		const nums = [];
		for (const [k, row] of Object.entries(by)) {
			const n = parseBridgeSpanInt(k);
			if (Number.isNaN(n) || n < 1) continue;
			if (!row || typeof row !== 'object') continue;
			const t = String(row.bridgeSpanSetupTypeName ?? '').trim();
			const p = String(row.bridgeSpanSetupPathM ?? '').trim();
			if (t || p) nums.push(n);
		}
		return nums.length ? [...new Set(nums)].sort((a, b) => a - b) : null;
	};

	const bridgeSpanStartNumber = computed(() => parseBridgeSpanInt(bridgeSpanStartInput.value));
	const bridgeSpanEndNumber = computed(() => parseBridgeSpanInt(bridgeSpanEndInput.value));
	const bridgeSpanItems = computed(() => {
		const explicit = bridgeSpanPillNumbers.value;
		if (Array.isArray(explicit) && explicit.length > 0) {
			return explicit;
		}
		const start = bridgeSpanStartNumber.value;
		const end = bridgeSpanEndNumber.value;
		if (Number.isNaN(start) || Number.isNaN(end) || end < start) return [];
		const list = [];
		for (let i = start; i <= end; i += 1) list.push(i);
		return list;
	});
	const bridgeSpanSelectedNumber = computed(() => {
		if (!bridgeSpanConfigured.value) return null;
		const list = bridgeSpanItems.value;
		if (!list.length) return null;
		const idx = Math.max(0, Math.min(bridgeSpanSelectedIndex.value, list.length - 1));
		return list[idx] ?? null;
	});
	const bridgeSpanReady = computed(() => bridgeSpanResolved.value && bridgeSpanConfigured.value);
const bridgeSpanSelectedStorageKey = computed(() =>
	`bridgeSpanSelected:${idStorageInfo.buildingId}`
);
const bridgeSpanRangeStorageKey = computed(() =>
	`bridgeSpanRange:${idStorageInfo.buildingId}`
);
	const syncSelectedBridgeSpanToPanes = () => {
		const spanNo = bridgeSpanSelectedNumber.value;
		currentDiseaseRef.value?.setSelectedBridgeSpan?.(spanNo);
		historyDiseaseRef.value?.setSelectedBridgeSpan?.(spanNo);
		uni.$emit('bridgeSpanChanged', spanNo);
	};
	const selectBridgeSpan = (idx) => {
		bridgeSpanSelectedIndex.value = idx;
		syncSelectedBridgeSpanToPanes();
	const selectedNo = bridgeSpanSelectedNumber.value;
	if (selectedNo != null) {
		uni.setStorageSync(bridgeSpanSelectedStorageKey.value, selectedNo);
	}
	};

	const loadBridgeSpanFromLocal = async (objectData) => {
		try {
			const obj = objectData || await loadObjectULCached();
			const start = obj?.bridgeSpanStart;
			const end = obj?.bridgeSpanEnd;
			const startN = parseBridgeSpanInt(start);
			const endN = parseBridgeSpanInt(end);
			const ok = isBridgeSpanFlagOn(obj?.bridgeSpanConfigured) &&
				!Number.isNaN(startN) && !Number.isNaN(endN) &&
				startN >= 1 && endN >= 1 && endN >= startN;
			bridgeSpanResolved.value = true;
			bridgeSpanConfigured.value = !!ok;
			if (ok) {
				const pills =
					normalizeBridgeSpanPillArray(obj?.bridgeSpanPillNumbers) || pillsFromBySpanMeta(obj);
				if (pills && pills.length) {
					bridgeSpanPillNumbers.value = pills;
					bridgeSpanStartInput.value = String(Math.min(...pills));
					bridgeSpanEndInput.value = String(Math.max(...pills));
					const selectedNo = parseBridgeSpanInt(uni.getStorageSync(bridgeSpanSelectedStorageKey.value));
					const pick =
						!Number.isNaN(selectedNo) && pills.includes(selectedNo) ? selectedNo : pills[0];
					bridgeSpanSelectedIndex.value = Math.max(0, pills.indexOf(pick));
				} else {
					bridgeSpanPillNumbers.value = null;
					bridgeSpanStartInput.value = String(startN);
					bridgeSpanEndInput.value = String(endN);
					const selectedNo = parseBridgeSpanInt(uni.getStorageSync(bridgeSpanSelectedStorageKey.value));
					const defaultNo = Number.isNaN(selectedNo) ? startN : selectedNo;
					const normalizedNo = Math.max(startN, Math.min(endN, defaultNo));
					bridgeSpanSelectedIndex.value = normalizedNo - startN;
				}
				syncSelectedBridgeSpanToPanes();
				uni.setStorageSync(bridgeSpanRangeStorageKey.value, {
					start: startN,
					end: endN,
					configured: true,
					pillNumbers: pills && pills.length ? pills : undefined
				});
				return;
			}
			const cached = uni.getStorageSync(bridgeSpanRangeStorageKey.value);
			const cStart = parseBridgeSpanInt(cached?.start);
			const cEnd = parseBridgeSpanInt(cached?.end);
			const cOk = isBridgeSpanFlagOn(cached?.configured) &&
				!Number.isNaN(cStart) && !Number.isNaN(cEnd) &&
				cStart >= 1 && cEnd >= cStart;
			if (cOk) {
				bridgeSpanResolved.value = true;
				bridgeSpanConfigured.value = true;
				const cachedPills = normalizeBridgeSpanPillArray(cached?.pillNumbers);
				if (cachedPills && cachedPills.length) {
					bridgeSpanPillNumbers.value = cachedPills;
					bridgeSpanStartInput.value = String(Math.min(...cachedPills));
					bridgeSpanEndInput.value = String(Math.max(...cachedPills));
					const selectedNo = parseBridgeSpanInt(uni.getStorageSync(bridgeSpanSelectedStorageKey.value));
					const pick =
						!Number.isNaN(selectedNo) && cachedPills.includes(selectedNo) ? selectedNo : cachedPills[0];
					bridgeSpanSelectedIndex.value = Math.max(0, cachedPills.indexOf(pick));
				} else {
					bridgeSpanPillNumbers.value = null;
					bridgeSpanStartInput.value = String(cStart);
					bridgeSpanEndInput.value = String(cEnd);
					const selectedNo = parseBridgeSpanInt(uni.getStorageSync(bridgeSpanSelectedStorageKey.value));
					const defaultNo = Number.isNaN(selectedNo) ? cStart : selectedNo;
					const normalizedNo = Math.max(cStart, Math.min(cEnd, defaultNo));
					bridgeSpanSelectedIndex.value = normalizedNo - cStart;
				}
				syncSelectedBridgeSpanToPanes();
			}
		} catch (e) {
			console.error('读取桥跨检测范围失败:', e);
			const cached = uni.getStorageSync(bridgeSpanRangeStorageKey.value);
			const cStart = parseBridgeSpanInt(cached?.start);
			const cEnd = parseBridgeSpanInt(cached?.end);
			const cOk = isBridgeSpanFlagOn(cached?.configured) &&
				!Number.isNaN(cStart) && !Number.isNaN(cEnd) &&
				cStart >= 1 && cEnd >= cStart;
			if (!cOk) {
				bridgeSpanResolved.value = true;
				bridgeSpanConfigured.value = false;
				bridgeSpanPillNumbers.value = null;
				return;
			}
			bridgeSpanResolved.value = true;
			bridgeSpanConfigured.value = true;
			const cachedPills = normalizeBridgeSpanPillArray(cached?.pillNumbers);
			if (cachedPills && cachedPills.length) {
				bridgeSpanPillNumbers.value = cachedPills;
				bridgeSpanStartInput.value = String(Math.min(...cachedPills));
				bridgeSpanEndInput.value = String(Math.max(...cachedPills));
				bridgeSpanSelectedIndex.value = 0;
			} else {
				bridgeSpanPillNumbers.value = null;
				bridgeSpanStartInput.value = String(cStart);
				bridgeSpanEndInput.value = String(cEnd);
				bridgeSpanSelectedIndex.value = 0;
			}
			syncSelectedBridgeSpanToPanes();
		}
	};

	const openBridgeSpanPopup = () => {
		if (!bridgeSpanReady.value) {
			bridgeSpanStartInput.value = '';
			bridgeSpanEndInput.value = '';
			bridgeSpanPillNumbers.value = null;
			bridgeSpanTypeNameInput.value = '';
			bridgeSpanLengthInput.value = '';
		} else {
			// 已配置过桥跨后再打开弹窗：跨号不再默认填「当前已录最大跨」（前一跨），由用户自行输入要新增的跨号
			bridgeSpanEndInput.value = '';
		}
		bridgeSpanRangeDialogRef.value?.open();
	};

	const closeBridgeSpanPopup = () => {
		bridgeSpanRangeDialogRef.value?.close();
	};

	const confirmBridgeSpan = async () => {
		const end = parseInt(String(bridgeSpanEndInput.value).trim(), 10);
		if (Number.isNaN(end)) {
			uni.showToast({
				title: '请输入有效的桥跨编号',
				icon: 'none'
			});
			return;
		}
		if (end < 1) {
			uni.showToast({
				title: '跨号须为正整数',
				icon: 'none'
			});
			return;
		}
		const typeName = String(bridgeSpanTypeNameInput.value || '').trim();
		if (!typeName) {
			uni.showToast({
				title: '请选择桥跨类型',
				icon: 'none'
			});
			return;
		}
		const lenStr = String(bridgeSpanLengthInput.value || '').trim();
		const lenNum = parseFloat(lenStr);
		if (!lenStr || Number.isNaN(lenNum) || lenNum <= 0) {
			uni.showToast({
				title: '请填写有效的桥跨跨径(m)',
				icon: 'none'
			});
			return;
		}
		try {
			uni.showLoading({
				title: '保存中',
				mask: true
			});
			const obj = await loadObjectULCached();
			const oldStart = parseBridgeSpanInt(obj?.bridgeSpanStart);
			const oldEnd = parseBridgeSpanInt(obj?.bridgeSpanEnd);
			const hadConfiguredRange = isBridgeSpanFlagOn(obj?.bridgeSpanConfigured) &&
				!Number.isNaN(oldStart) && !Number.isNaN(oldEnd) &&
				oldStart >= 1 && oldEnd >= 1 && oldEnd >= oldStart;

			// 导航只展示「已录入」的跨号：优先 bridgeSpanPillNumbers，否则 bySpan 中有类型/跨径的跨，再小范围连续迁移；绝不把下发占位 1…N 与用户只录第 N 跨混成整段
			let basePills = normalizeBridgeSpanPillArray(obj?.bridgeSpanPillNumbers);
			if (!basePills) {
				basePills = pillsFromBySpanMeta(obj);
			}
			if (!basePills && hadConfiguredRange) {
				const spanCount = oldEnd - oldStart + 1;
				if (spanCount <= 8) {
					basePills = Array.from({ length: spanCount }, (_, i) => oldStart + i);
				} else {
					basePills = [];
				}
			}
			if (!basePills) {
				basePills = [];
			}
			const pillNumbers = [...new Set([...basePills, end])]
				.filter((n) => !Number.isNaN(n) && n >= 1)
				.sort((a, b) => a - b);
			const finalStart = Math.min(...pillNumbers);
			const finalEnd = Math.max(...pillNumbers);

			const spanMetaKey = String(end);
			const prevBySpan = obj?.bridgeSpanSetupBySpan && typeof obj.bridgeSpanSetupBySpan === 'object'
				? { ...obj.bridgeSpanSetupBySpan }
				: {};
			prevBySpan[spanMetaKey] = {
				bridgeSpanSetupTypeName: typeName,
				bridgeSpanSetupPathM: lenStr
			};
			const next = {
				...obj,
				bridgeSpanStart: finalStart,
				bridgeSpanEnd: finalEnd,
				bridgeSpanPillNumbers: pillNumbers,
				bridgeSpanConfigured: true,
				bridgeSpanSetupTypeName: typeName,
				bridgeSpanSetupPathM: lenStr,
				bridgeSpanSetupBySpan: prevBySpan
			};
			try {
				await setObject(userInfo.username, idStorageInfo.buildingId, next);
				cachedObjectUL.value = next;
				// 首次新增桥跨时 structure-info 可能尚未挂载，收不到 bridgeSpanMetaChanged；必须把 next 写入 Pinia，
				// 否则桥跨信息页 onMounted 从 getObjectUL 若暂缺元数据，也无法从 store 回退补齐。
				await loadBridgeObjectInfo(next);
			} catch (writeErr) {
				console.error('写入 object.json 失败，已降级为本地缓存:', writeErr);
			}
			bridgeSpanResolved.value = true;
			bridgeSpanConfigured.value = true;
			bridgeSpanStartInput.value = String(finalStart);
			bridgeSpanEndInput.value = String(finalEnd);
			bridgeSpanPillNumbers.value = pillNumbers;
			bridgeSpanTypeNameInput.value = typeName;
			bridgeSpanLengthInput.value = lenStr;
			{
				const idx = pillNumbers.indexOf(end);
				bridgeSpanSelectedIndex.value = idx >= 0 ? idx : Math.max(0, pillNumbers.length - 1);
			}
			syncSelectedBridgeSpanToPanes();
			uni.$emit('bridgeSpanMetaChanged', {
				buildingId: idStorageInfo.buildingId,
				typeName,
				pathM: lenStr,
				spanNo: end
			});
			uni.setStorageSync(bridgeSpanSelectedStorageKey.value, end);
			uni.setStorageSync(bridgeSpanRangeStorageKey.value, {
				start: finalStart,
				end: finalEnd,
				configured: true,
				pillNumbers
			});
			uni.hideLoading();
			closeBridgeSpanPopup();
			uni.showToast({
				title: '已保存',
				icon: 'success'
			});
			await loadDiseaseListForSpanBadges();
		} catch (e) {
			uni.hideLoading();
			console.error('保存桥跨检测范围失败:', e);
			uni.showToast({
				title: String(e?.message || e || '保存失败').slice(0, 18),
				icon: 'none'
			});
		}
	};

	const setButtonUnCommited = () => {
		submitButtonEnabled.value = true;
	};
	const setButtonCommited = () => {
		submitButtonEnabled.value = false;
	};

	/** 自定义导航栏标题 */
	const navigationBarTitle = computed(() => {
		const t = (bridgeName.value || '').trim();
		return t || '未命名桥梁';
	});

	const onNavBack = () => {
		uni.navigateBack();
	};

	/** 桥跨条已解析后再异步对齐病害构件数，避免阻塞首帧与桥跨 pills 出现（getULDisease + setObject 较慢） */
	const scheduleReconcileDiseaseCounts = () => {
		nextTick(() => {
			setTimeout(async () => {
				const merged = objectInfo.getData();
				if (!Array.isArray(merged?.children) || merged.children.length === 0) return;
				try {
					await refreshDiseaseNumber(
						userInfo.username,
						idStorageInfo.buildingId,
						idStorageInfo.projectYear
					);
				} catch (e) {
					console.warn("[bridge-disease] refreshDiseaseNumber（延迟）失败:", e);
				}
			}, 0);
		});
	};

	const loadBridgeObjectInfo = async (objectData) => {
		try {
			const data = objectData || await loadObjectULCached();
			if (!data) return;
			const existing = objectInfo.getData();
			const existingHasTree = Array.isArray(existing?.children) && existing.children.length > 0;
			if (existingHasTree) {
				// Pinia 已有完整构件树（structure-info 已加载过模板），只同步桥跨元信息，不覆盖 children
				if (data.bridgeSpanSetupTypeName !== undefined) existing.bridgeSpanSetupTypeName = data.bridgeSpanSetupTypeName;
				if (data.bridgeSpanSetupPathM !== undefined) existing.bridgeSpanSetupPathM = data.bridgeSpanSetupPathM;
				if (data.bridgeSpanSetupBySpan !== undefined) existing.bridgeSpanSetupBySpan = data.bridgeSpanSetupBySpan;
				if (data.bridgeSpanConfigured !== undefined) existing.bridgeSpanConfigured = data.bridgeSpanConfigured;
				if (data.bridgeSpanStart !== undefined) existing.bridgeSpanStart = data.bridgeSpanStart;
				if (data.bridgeSpanEnd !== undefined) existing.bridgeSpanEnd = data.bridgeSpanEnd;
				if (data.bridgeSpanPillNumbers !== undefined) existing.bridgeSpanPillNumbers = data.bridgeSpanPillNumbers;
				if (data.templateObjectId) existing.templateObjectId = data.templateObjectId;
			} else if (data.templateObjectId || Array.isArray(data.children)) {
				objectInfo.setData(data);
			}
			console.log('桥梁结构数据已加载到store:', {
				buildingId: idStorageInfo.buildingId,
				templateObjectId: existing?.templateObjectId || data.templateObjectId,
				childrenCount: Array.isArray(existing?.children) ? existing.children.length : (Array.isArray(data.children) ? data.children.length : 0)
			});
		} catch (error) {
			console.error('加载桥梁结构数据失败:', error);
		}
	};

	// 组件挂载时
	onMounted(async () => {
		readBridgeInfo();
		const objectData = await loadObjectULCached({
			force: true
		});
		await loadBridgeObjectInfo(objectData);
		await loadBridgeSpanFromLocal(objectData);
		scheduleReconcileDiseaseCounts();
		checkUncommitted();
		checkDiseaseStatus();
		checkFrontPhotoStatus();
		// checkCurrentPhotoStatus();
		// checkStructureStatus();
		checkCurrentPhotoAndStructureStatus(objectData);
		await loadDiseaseListForSpanBadges();
		uni.$on('setButtonUnCommited', setButtonUnCommited)
		uni.$on('setButtonCommited', setButtonCommited)
		uni.$on('frontPhotoStatusChanged', checkFrontPhotoStatus)
		uni.$on('diseaseStatusChanged', async () => {
			try {
				await refreshDiseaseNumber(
					userInfo.username,
					idStorageInfo.buildingId,
					idStorageInfo.projectYear
				);
			} catch (e) {
				console.warn("[bridge-disease] diseaseStatusChanged refreshDiseaseNumber:", e);
			}
			await checkDiseaseStatus();
			await loadDiseaseListForSpanBadges();
		})
		uni.$on('currentPhotoStatusChanged', checkCurrentPhotoStatus)
		uni.$on('structureStatusChanged', checkStructureStatus)
	});

	onShow(async () => {
		const objectData = await loadObjectULCached();
		await loadBridgeObjectInfo(objectData);
		await loadBridgeSpanFromLocal(objectData);
		scheduleReconcileDiseaseCounts();
		await loadDiseaseListForSpanBadges();
	});

	onUnmounted(() => {
		uni.$off('setButtonUnCommited')
		uni.$off('setButtonCommited')
		uni.$off('frontPhotoStatusChanged')
		uni.$off('diseaseStatusChanged')
		uni.$off('currentPhotoStatusChanged')
		uni.$off('structureStatusChanged')
	})


	// 检查当前病害状态
	const checkDiseaseStatus = async () => {
		const currentYear = idStorageInfo.projectYear;
		const hasUnFinishDisease = await isUnFinishDisease(userInfo.username, idStorageInfo.buildingId,
			currentYear)
		if (hasUnFinishDisease) {
			diseaseSubmitStatus.value = 2;
			return;
		}
		const hasUncommittedDiseases = await readDiseaseCommit(userInfo.username, idStorageInfo.buildingId,
			currentYear)
		if (hasUncommittedDiseases) {
			diseaseSubmitStatus.value = 0;
			return;
		}
		diseaseSubmitStatus.value = 1;
	};

	// 检查正立面照提交状态
	const checkFrontPhotoStatus = async () => {
		try {
			const data = await getFrontPhoto(userInfo.username, idStorageInfo.buildingId);
			if (data && typeof data.commitType !== 'undefined') {
				frontPhotoSubmitStatus.value = data.commitType;
			} else {
				frontPhotoSubmitStatus.value = 1; // 未知状态
			}
		} catch (error) {
			console.error('获取正立面照状态失败:', error);
			frontPhotoSubmitStatus.value = 1; // 发生错误，设为未知状态
		}
	};

	const checkCurrentPhotoAndStructureStatus = async (objectData) => {
		const data = objectData || await loadObjectULCached();
		if (data.commit !== undefined) {
			currentPhotoSubmitStatus.value = data.commit;
		}
		if (data.structureSubmitStatus !== undefined) {
			structureSubmitStatus.value = data.structureSubmitStatus;
		}
	}
	// 检查现状照提交状态
	const checkCurrentPhotoStatus = async () => {
		currentPhotoSubmitStatus.value = await readCommit(userInfo.username, idStorageInfo.buildingId);
	}

	// 检查结构信息提交状态
	const checkStructureStatus = async () => {
		const data = await loadObjectULCached({
			force: true
		});
		if (data.structureSubmitStatus !== undefined) {
			structureSubmitStatus.value = data.structureSubmitStatus;
		}
	}

	// 检查提交按钮的显示状态
	const checkUncommitted = async () => {
		try {
			const isBuildingCommit = await isBuildingCommited(userInfo.username, idStorageInfo.projectId,
				idStorageInfo.buildingId);
			if (isBuildingCommit === 0) submitButtonEnabled.value = true;
			else submitButtonEnabled.value = false;
		} catch (error) {
			console.error('检查未提交病害出错:', error);
			submitButtonEnabled.value = false;
		}
	};

	const submitZip = async () => {
		console.log('提交压缩文件,buildingId', idStorageInfo.buildingId);
		const currentYear = idStorageInfo.projectYear;

		// 只在开始时显示一次 Loading，并保持到最终结束
		uni.showLoading({
			title: '正在提交',
			mask: true
		});

		try {
			// 1. 检查未完成的病害
			const hasUnFinishDisease = await isUnFinishDisease(
				userInfo.username,
				idStorageInfo.buildingId,
				currentYear
			);
			if (hasUnFinishDisease) {
				uni.hideLoading();
				uni.showToast({
					title: '有未完成的病害',
					icon: 'none'
				});
				return;
			}

			// 2. 检查结构信息错误
			const warning = await readWarning(
				userInfo.username,
				idStorageInfo.buildingId
			);
			if (warning === true) {
				uni.hideLoading();
				uni.showToast({
					title: '结构信息错误',
					icon: 'none'
				});
				return;
			}

			// 3. 压缩文件
			const zipFilePath = await saveBridgeZip(
				userInfo.username,
				idStorageInfo.buildingId,
        idStorageInfo.projectYear
			);
			console.log('压缩完成，文件路径:', zipFilePath);

			// 4. 获取 Token
			const responseLogin = await uni.request({
				url: `${apiConfig.baseURL}/jwt/login?username=${userInfo.username}&password=${userInfo.password}`,
				method: 'POST'
			});

			if (!responseLogin.data || !responseLogin.data.token) {
				uni.hideLoading();
				uni.showToast({
					title: '获取授权失败',
					icon: 'none'
				});
				return;
			}

			const token = responseLogin.data.token;
			console.log('授权成功，开始上传文件', zipFilePath);

			// 5. 上传文件
			const response = await uni.uploadFile({
				url: `${apiConfig.baseURL}/api/upload/bridgeData`,
				filePath: zipFilePath,
				name: 'file',
				header: {
					'Authorization': token
				},
			});

			// 6. 解析响应
			let responseData;
			try {
				responseData = JSON.parse(response.data);
			} catch (e) {
				responseData = response.data;
			}

			if (responseData && responseData.code === 0) {
				// 7. 更新提交状态
				await setFrontPhotoCommited(userInfo.username, idStorageInfo.buildingId);
				await setCommit1(userInfo.username, idStorageInfo.buildingId);
				await setBuildingCommitted(
					userInfo.username,
					idStorageInfo.projectId,
					idStorageInfo.buildingId
				);

				// 8. 触发事件
				uni.$emit('submitSuccess');
				uni.$emit('setBuildingCommit', idStorageInfo.buildingId);
				uni.$emit('setStructureSubmitStatus1');

				// 9. 更新状态
				submitButtonEnabled.value = false;
				diseaseSubmitStatus.value = 1;
				frontPhotoSubmitStatus.value = 1;
				currentPhotoSubmitStatus.value = 1;
				structureSubmitStatus.value = 1;

				uni.hideLoading();
				uni.showToast({
					title: '提交成功',
					icon: 'success',
					duration: 1000
				});
			} else {
				uni.hideLoading();
				uni.showToast({
					title: responseData?.msg || '提交失败',
					icon: 'none'
				});
			}
		} catch (error) {
			uni.hideLoading();
			console.error('提交数据错误:', error);
			if (error.errMsg.includes('Failed to connect')) {
				uni.showToast({
					title: '检查网络连接',
					icon: 'none'
				});
			} else {
				uni.showToast({
					title: '提交数据出错，请稍后重试',
					icon: 'none'
				});
			}
		}
	};

	const deleteBridgeData = async () => {
		deleteBuildingDataPopup.value.open();
	};
	const confirmDeleteBuildingData = async () => {
		deleteBuildingDataPopup.value.close();
		uni.showLoading({
			title: '正在删除',
			mask: true
		});
		await deleteULbuilding(userInfo.username, idStorageInfo.buildingId);
		invalidateObjectULCache();
		bridgeSpanResolved.value = false;
		bridgeSpanConfigured.value = false;
		bridgeSpanPillNumbers.value = null;
		uni.$emit('setBuildingNull', idStorageInfo.buildingId)
		await setBuildingNull(userInfo.username, idStorageInfo.projectId, idStorageInfo.buildingId)
		uni.hideLoading();
		uni.navigateBack();
		uni.showToast({
			title: '删除成功',
			icon: 'success',
			duration: 1000
		});
	};
	const closeDeleteBuildingPopup = () => {
		deleteBuildingDataPopup.value.close();
	};
</script>

<style>
	.container.page-bridge-disease {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background-color: #f5f5f5;
		--bd-toolbar-h: 40rpx;
		--bd-edge-right-gap: 16rpx;
	}

	/* 不用组件自带 title：其 App 端默认可到 34rpx，会显过大；此处与常见系统顶栏约 16px 相当 */
	.bridge-nav-title-wrap {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 8rpx;
		box-sizing: border-box;
	}

	.bridge-nav-title-text {
		color: #ffffff;
		font-size: 22rpx;
		font-weight: 400;
		line-height: 1.2;
		text-align: center;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.bridge-page-nav-info {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		padding-right: 0;
		box-sizing: border-box;
	}

	.bridge-page-nav-info-icon {
		color: #ffffff;
		font-size: 26rpx;
		font-weight: 400;
		line-height: 1.2;
		display: block;
		transform: translateY(1rpx);
	}

	/* 与工具条右侧按钮统一右边距，保证视觉右平行 */
	.page-bridge-disease .uni-nav-bar__right {
		padding-right: var(--bd-edge-right-gap, 16rpx) !important;
		box-sizing: border-box;
	}

	.main-content {
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	/*
	 * 与已选桥跨时 BridgeSpanBar 的 .span-scroll-bar + .span-scroll-view 同高同边距，
	 * 避免未配置时这一栏与选跨后 pills 行高度不一致。
	 */
	.bridge-span-waiting-hint-wrap {
		display: flex;
		align-items: center;
		gap: 8rpx;
		padding: 6rpx var(--bd-edge-right-gap, 16rpx) 6rpx 4rpx;
		min-height: var(--bd-toolbar-h, 40rpx);
		box-sizing: border-box;
		background-color: #bdcbe0;
		flex-shrink: 0;
		overflow: visible;
	}

	.bridge-span-waiting-hint-inner {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		height: calc(var(--bd-toolbar-h, 40rpx) + 12rpx);
		min-height: calc(var(--bd-toolbar-h, 40rpx) + 12rpx);
		box-sizing: border-box;
	}

	.bridge-span-waiting-hint-text {
		width: 100%;
		color: #ff3141;
		font-size: 20rpx;
		line-height: 1.4;
		text-align: center;
		word-break: break-word;
	}

	.inspection-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
		overflow: hidden;
	}

	.inspection-pane {
		flex: 1;
		min-height: 0;
		position: relative;
		overflow: hidden;
	}

	/* 正立面照 / 现状照：内容区外缘与页灰底区分，白底铺满本页签 */
	.inspection-pane--front-photo,
	.inspection-pane--current-photo {
		background-color: #ffffff;
	}

	.tabs {
		display: flex;
		position: relative;
		height: 4.37%;
		background-color: #BDCBE0;
		flex-shrink: 0;
	}

	.tabs	.main-tabs {
		padding-right: 0;
		position: relative;
	}

	.tabs-track {
		flex: 1;
		display: flex;
		position: relative;
		height: 100%;
	}

	.tab-item {
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: center;
		color: #333333;
		font-size: 20rpx;
		position: relative;
		z-index: 1;
	}

	.tab-item.active {
		color: #0F4687;
		font-weight: 600;
	}

	.tab-item-text {
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
	}

	.tab-indicator {
		position: absolute;
		bottom: 0;
		height: 3rpx;
		background-color: #0F4687;
		transition: all 0.3s;
	}

	.content {
		flex: 1;
		position: relative;
		overflow: hidden;
		min-height: 0;
	}

	.placeholder {
		padding: 30rpx;
		text-align: center;
		color: #666;
		font-size: 28rpx;
	}

	.red-icon {
		width: 8rpx;
		height: 8rpx;
		position: absolute;
		top: -2rpx;
		right: -8rpx;
	}

	.yellow-icon {
		width: 8rpx;
		height: 8rpx;
		position: absolute;
		top: -2rpx;
		right: -8rpx;
	}

	.deleteBuildingData-popup-content {
		background-color: #fff;
		width: 500rpx;
		height: 380rpx;
		border-radius: 8rpx;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.popup-title {
		background-color: #BDCBE0;
		font-size: 20rpx;
		padding: 8rpx 0rpx;
		text-align: center;
		/* 添加水平居中 */
	}

	.popup-input1 {
		display: flex;
		align-items: center;
		padding: 10px 10rpx;
		font-size: 20rpx;
	}

	.popup-button {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-top: 30rpx;
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
		margin-left: 10rpx;
	}

	.popup-button-confirm {
		background-color: #1677FF;
		color: #fff;
		margin-right: 10rpx;
	}


	/* 手机端适配 */
	@media (max-width: 599px) {
		.tab-item {
			font-size: 24rpx;
		}
	}
</style>