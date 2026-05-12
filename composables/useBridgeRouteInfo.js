import {
	ref
} from 'vue';
import {
	getBridgeOptionsFromPageStack
} from '@/utils/bridgeNavQuery.js';

/**
 * 从路由 / 页面栈读取桥梁展示字段（与 add-disease 栈合并规则一致，病害页顶层 options 同样可读）。
 */
export function useBridgeRouteInfo() {
	const bridgeName = ref('');
	const bridgeCode = ref('');
	const bridgePileNumber = ref('');
	const routeName = ref('');
	const routeCode = ref('');

	const readBridgeInfo = () => {
		const merged = getBridgeOptionsFromPageStack();
		const safeDecode = (v) => {
			if (!v) return '';
			try {
				return decodeURIComponent(v);
			} catch {
				return String(v);
			}
		};
		bridgeName.value = safeDecode(merged.bridgeName);
		bridgeCode.value = safeDecode(merged.bridgeCode);
		bridgePileNumber.value = safeDecode(merged.bridgePileNumber);
		routeName.value = safeDecode(merged.routeName);
		routeCode.value = safeDecode(merged.routeCode);
	};

	return {
		bridgeName,
		bridgeCode,
		bridgePileNumber,
		routeName,
		routeCode,
		readBridgeInfo
	};
}
