<!-- 
	开发者：郭明晓 
	功能：绘制简图
	最后修改日期：2025年6月7日
-->
<template>
	<view :class="['header', {headerSP: !isLandscape}]">绘制简图</view>
	<view class="container">
		<view :class="['toolbar', {toolbarSP: !isLandscape}]">
			<button @click="setMode('select')"
				:class="['iconButton', { active: mode === 'select' }, {iconButtonSP: !isLandscape}]">
				<image src='/static/image/hand.svg' class="icon"></image>
			</button>
			<button @click="setMode('line')"
				:class="['iconButton', { active: mode === 'line' }, {iconButtonSP: !isLandscape}]">
				<image src='/static/image/line.svg' class="icon"></image>
			</button>
			<button @click="setMode('curve')"
				:class="['iconButton', { active: mode === 'curve' }, {iconButtonSP: !isLandscape}]">
				<image src='/static/image/curve.svg' class="icon"></image>
			</button>
			<button @click="setMode('rect')"
				:class="['iconButton', { active: mode === 'rect' }, {iconButtonSP: !isLandscape}]">
				<image src='/static/image/rect.svg' class="icon"></image>
			</button>
			<button @click="setMode('circle')"
				:class="['iconButton', { active: mode === 'circle' }, {iconButtonSP: !isLandscape}]">
				<image src='/static/image/circle.svg' class="icon"></image>
			</button>
			<button @click="setMode('text')"
				:class="['iconButton', { active: mode === 'text' }, {iconButtonSP: !isLandscape}]">
				<image src='/static/image/text.svg' class="icon"></image>
			</button>
			<view :class="['separateLine', {separateLineSP: !isLandscape}]"></view>
			<button @click="undo" :class="['functionButton', {functionButtonSP: !isLandscape}]">
				<!-- <image src='/static/image/back.svg' class="icon"></image> -->
				撤销
			</button>
			<button @click="clearCanvas" :class="['functionButton', {functionButtonSP: !isLandscape}]">清空</button>
			<button @click="zoomIn" :class="['functionButton', {functionButtonSP: !isLandscape}]">放大</button>
			<button @click="zoomOut" :class="['functionButton', {functionButtonSP: !isLandscape}]">缩小</button>
			<view :class="['separateLine', {separateLineSP: !isLandscape}]"></view>
			<button @click="back" :class="['functionButton', {functionButtonSP: !isLandscape}]">取消</button>
			<button @click="saveCanvasToImage" :class="['functionButton', {functionButtonSP: !isLandscape}]">
				<!-- <image src='/static/image/save.svg' class="icon"></image> -->
				保存
			</button>
			<view :class="['separateLine', {separateLineSP: !isLandscape}]"></view>
			<button @click="changeTemplateParam" :class="['functionButton', {functionButtonSP: !isLandscape}]">
				<!-- <image src='/static/image/save.svg' class="icon"></image> -->
				模板参数
			</button>
			<!-- <button @click="deleteSelected" :class="['functionButton', {functionButtonSP: !isLandscape}]">删除</button> -->
		</view>

		<!-- 参数设置弹窗 -->
		<view v-if="showParamPopup" class="popup">
			<view class="popup-content">
				<view v-for="field in fieldList" :key="field.key">
					<view v-if="field.key in tempParams">
						<text>{{ field.label }}</text>
						<input v-model="tempParams[field.key]" :type="field.type" />
					</view>
				</view>
				<view class="popup-actions">
					<button @click="applyTemplateChange" type="primary">确认</button>
					<button @click="cancleTemplateChange">取消</button>
				</view>
			</view>
		</view>

		<!-- <view class="functionBar">
			<button @click="deleteSelected" :class="['functionButton', {functionButtonSP: !isLandscape}]">删除</button>
			<button @click="clearCanvas" :class="['functionButton', {functionButtonSP: !isLandscape}]">清空</button>
			<button @click="zoomIn" :class="['functionButton', {functionButtonSP: !isLandscape}]">放大</button>
			<button @click="zoomOut" :class="['functionButton', {functionButtonSP: !isLandscape}]">缩小</button>
		</view> -->
		<view v-if="showTextInput" class="text-input"
			:style="{ top: logicalToScreen(textInputX, textInputY).y + 'px', left: logicalToScreen(textInputX, textInputY).x + 'px' }">
			<input v-model="textValue" placeholder="输入文字..." class="input" @input="inputting" />
			<view class="textButtons">
				<button @click="cancelText">取消</button>
				<button @click="confirmText">确定</button>
			</view>
		</view>

		<view class="colorToolbar">
			<image
				:src="drawColor === '#333333' ? '/static/image/CheckedCircleFill.png' : '/static/image/CheckCircleFill.png'"
				:class="['colorImg', {colorImgSP: !isLandscape}]" @click="changeColor('#333333')" />
			<image
				:src="drawColor === '#FF3141' ? '/static/image/CheckedCircleFill-1.png' : '/static/image/CheckCircleFill-1.png'"
				:class="['colorImg', {colorImgSP: !isLandscape}]" @click="changeColor('#FF3141')" />
			<image
				:src="drawColor === '#00B578' ? '/static/image/CheckedCircleFill-2.png' : '/static/image/CheckCircleFill-2.png'"
				:class="['colorImg', {colorImgSP: !isLandscape}]" @click="changeColor('#00B578')" />
			<image
				:src="drawColor === '#1677FF' ? '/static/image/CheckedCircleFill-3.png' : '/static/image/CheckCircleFill-3.png'"
				:class="['colorImg', {colorImgSP: !isLandscape}]" @click="changeColor('#1677FF')" />
			<image
				:src="drawColor === '#FFD24A' ? '/static/image/CheckedCircleFill-4.png' : '/static/image/CheckCircleFill-4.png'"
				:class="['colorImg', {colorImgSP: !isLandscape}]" @click="changeColor('#FFD24A')" />

			<!-- <button @click="changeColor('#FF3141')" class="colorButton"
				style="background-color: #FF3141">{{drawColor=="#FF3141"? '√':''}}</button>
			<button @click="changeColor('#00B578')" class="colorButton"
				style="background-color: #00B578">{{drawColor=="#00B578"? '√':''}}</button>
			<button @click="changeColor('#1677FF')" class="colorButton"
				style="background-color: #1677FF">{{drawColor=="#1677FF"? '√':''}}</button>
			<button @click="changeColor('#FFD24A')" class="colorButton"
				style="background-color: #FFD24A">{{drawColor=="#FFD24A"? '√':''}}</button>
			<button @click="changeColor('#333333')" class="colorButton"
				style="background-color: #333333">{{drawColor=="#333333"? '√':''}}</button> -->
		</view>

		<canvas :style="canvasStyle" canvas-id="myCanvas" id="myCanvas" class="canvas" disable-scroll="true" />
		<canvas :style="canvasStyle" canvas-id="transparentCanvas" id="transparentCanvas" class="canvas"
			disable-scroll="true" @touchstart="touchStart" @touchmove="touchMove" @touchend="touchEnd" />

		<!-- <image :src="canvasImagePath" mode="widthFix" class="imgShow"></image> -->
	</view>
</template>

<script setup>
	import {
		ref,
		onMounted,
		reactive,
		h,
		nextTick,
		getCurrentInstance
	} from 'vue';

	import {
		drawKxbTemplate1,
		drawKxbTemplate2,
		drawKxbTemplate3,
		drawKxbTemplate4,
		drawKxbTemplate5,
		drawKxbTemplate6,
		drawTlTemplate1,
		drawHgbTemplate1,
		drawYqTemplate1,
		drawBlmxlTemplate1,
		drawBlmxlTemplate2,
		drawBlmxlTemplate3,
		drawBlmxlTemplate4,
		drawYzdTemplate1
	} from '../../utils/drawTemplate';

	import {
		onLoad
	} from '@dcloudio/uni-app'

	const canvasId = 'myCanvas';
	const transparentCanvasId = 'transparentCanvas';
	const ctx = ref(null);
	const transparentCtx = ref(null);

	const screenWidth = ref(0);
	const screenHeight = ref(0);
	const canvasStyle = ref({
		width: '100vw',
		height: '100vh',
	});
	const offsetX = ref(0); // 画布拖拽 X 偏移
	const offsetY = ref(0); // 画布拖拽 Y 偏移
	const scale = ref(1); // 画布缩放比例
	const lastDistance = ref(0); // 记录双指距离
	const isScaling = ref(false); // 是否正在缩放

	const mode = ref('line');
	const startX = ref(0);
	const startY = ref(0);
	const currentX = ref(0);
	const currentY = ref(0);
	const offsetStartX = ref(0);
	const offsetStartY = ref(0);
	const offsetCurrentX = ref(0);
	const offsetCurrentY = ref(0);
	const drawing = ref(false);
	const template = ref('');
	const history = ref([]);
	const curvePoints = ref([]);
	const transparentCurvePoints = ref([]);
	//记录状态 为了在只有点击没有滑动的情况下，让startX和currentX都不为0
	const status = ref('start');
	const drawColor = ref('#333333');
	const isLandscape = ref(false); // 是否横屏

	const textValue = ref('');
	const showTextInput = ref(false);
	const textInputX = ref(0);
	const textInputY = ref(0);
	const changingTextIndex = ref(null);
	const beforeChangeText = ref('');
	const canvasImagePath = ref('');
	const textFontSize = ref(20);
	const textSelecting = ref(false)
	const textBox = ref(null)

	const selectedObject = ref(null);
	const selectedObjectOriginColor = ref(null);
	const touchMoveMode = ref('canvas');
	// 用于存储发生的事件 给撤销功能使用
	const events = ref([]);
	const markSavedEvent = ref(false)
	// 文字修改了
	const inputAndChanged = ref(false)

	const clickCandidates = ref([]); // 当前点击位置命中的对象数组
	const clickCycleIndex = ref(0); // 当前循环到哪个

	const showParamPopup = ref(false);
	//空心板1
	const kxbTemplateParam1 = ref({
		logicalWidth: 8,
		logicalHeight: 8,
		unit: 'm',
	})
	//空心板2
	const kxbTemplateParam2 = ref({
		logicalWidth: 8,
		logicalHeight: 8,
		unit: 'm',
	})
	//空心板3
	const kxbTemplateParam3 = ref({
		logicalWidth: 12,
		bigBeamNumber: 1,
		beamCount: 8,
		bridgeFu: 'L',
		unit: 'm',
	})
	//空心板4
	const kxbTemplateParam4 = ref({
		logicalWidth: 12,
		bigBeamNumber: 1,
		beamCount: 8,
		bridgeFu: 'L',
		unit: 'm',
	})
	//空心板5
	const kxbTemplateParam5 = ref({
		logicalLength: 8,
		bottomPlate: 1.2,
		abdomenPlate: 1.2,
		flangePlate: 1.2,
		unit: 'm',
	})
	//空心板6
	const kxbTemplateParam6 = ref({
		logicalLength: 8,
		bottomPlate: 1.2,
		abdomenPlate: 1.2,
		flangePlate: 1.2,
		unit: 'm',
	})
	//T梁
	const tlTemplateParam1 = ref({
		logicalLength: 8,
		bottomPlate: 1.2,
		abdomenPlate: 1.2,
		flangePlate: 1.2,
		unit: 'm',
	})
	// 横隔板
	const hgbTemplateParam1 = ref({
		logicalWidth: 6,
		logicalHeight: 4,
		unit: 'm',
	})
	// 翼墙
	const yqTemplateParam1 = ref({
		logicalWidth: 8,
		logicalHeight: 4,
		unit: 'm',
	})
	//桥梁1
	const blmxlTemplateParam1 = ref({
		logicalLength: 12.1,
		beamCount: 3,
		bigBeamNumber: 36,
		smallBeamNumber: 35,
		bridgeFu: 'L',
		unit: 'm',
	})
	//桥梁2
	const blmxlTemplateParam2 = ref({
		logicalLength: 12.1,
		beamCount: 3,
		bigBeamNumber: 36,
		smallBeamNumber: 35,
		bridgeFu: 'L',
		unit: 'm',
	})
	//桥梁3
	const blmxlTemplateParam3 = ref({
		logicalLength: 12.1,
		leftBeamCount: 7,
		bigBeamNumber: 36,
		smallBeamNumber: 35,
		bridgeFu: 'L',
		unit: 'm',
	})
	//桥梁4
	const blmxlTemplateParam4 = ref({
		logicalLength: 12.1,
		rightBeamCount: 7,
		bigBeamNumber: 36,
		smallBeamNumber: 35,
		bridgeFu: 'L',
		unit: 'm',
	})
	//圆桩墩
	const yzdTemplateParam1 = ref({
		logicalHeight: 8,
		unit: 'm',
	})
	const tempParams = ref({})
	const fieldList = reactive([{
			key: 'logicalWidth',
			label: '宽度（单位数）',
			type: 'number'
		},
		{
			key: 'logicalHeight',
			label: '高度（单位数）',
			type: 'number'
		},
		{
			key: 'logicalLength',
			label: '长度',
			type: 'number'
		},
		{
			key: 'flangePlate',
			label: '翼缘板',
			type: 'number'
		},

		{
			key: 'abdomenPlate',
			label: '腹板',
			type: 'number'
		},
		{
			key: 'bottomPlate',
			label: '底板',
			type: 'number'
		},
		{
			key: 'beamCount',
			label: '梁数',
			type: 'number'
		}, {
			key: 'leftBeamCount',
			label: '梁数',
			type: 'number'
		}, {
			key: 'rightBeamCount',
			label: '梁数',
			type: 'number'
		},
		{
			key: 'bigBeamNumber',
			label: '大桩号墩',
			type: 'number'
		},
		{
			key: 'smallBeamNumber',
			label: '小桩号墩',
			type: 'number'
		}, {
			key: 'bridgeFu',
			label: '桥幅(L / R)',
			type: 'text'
		},
		{
			key: 'unit',
			label: '单位(cm / m)',
			type: 'text'
		},
	]);

	// 记录上一次点击的像素位置和选中图形的索引
	const lastClick = ref({
		x: null,
		y: null,
		index: -1
	});

	let lastRedrawTime = 0;

	onMounted(() => {
		const systemInfo = uni.getSystemInfoSync();
		screenWidth.value = systemInfo.windowWidth;
		screenHeight.value = systemInfo.windowHeight;
		isLandscape.value = screenWidth.value > screenHeight.value;

		uni.onWindowResize(res => {
			isLandscape.value = res.size.windowWidth > res.size.windowHeight;
			redrawCanvas();
		});

		ctx.value = uni.createCanvasContext(canvasId);
		transparentCtx.value = uni.createCanvasContext(transparentCanvasId);
		ctx.value.setFontSize(textFontSize.value);
		redrawCanvas();
	});

	onLoad((options) => {
		switch (options.template) {
			case 'kxb1':
				template.value = 'kxb1';
				break;
			case 'kxb2':
				template.value = 'kxb2';
				break;
			case 'kxb3':
				template.value = 'kxb3';
				break;
			case 'kxb4':
				template.value = 'kxb4';
				break;
			case 'kxb5':
				template.value = 'kxb5';
				break;
			case 'kxb6':
				template.value = 'kxb6';
				break;
			case 'tl1':
				template.value = 'tl1';
				break;
			case 'xl1':
				template.value = 'xl1';
				break;
			case 'qt1':
				template.value = 'qt1';
				break;
			case 'qt2':
				template.value = 'qt2';
				kxbTemplateParam1.value.logicalHeight = 10;
				kxbTemplateParam1.value.logicalWidth = 10;
				break;
			case 'hgb1':
				template.value = 'hgb1';
				break;
			case 'hgb2':
				template.value = 'qt1';
				break;
			case 'yq1':
				template.value = 'yq1';
				break;
			case 'gl1':
				template.value = 'gl1';
				break;
			case 'blmxl1':
				template.value = 'blmxl1';
				break;
			case 'blmxl2':
				template.value = 'blmxl2';
				break;
			case 'blmxl3':
				template.value = 'blmxl3';
				break;
			case 'blmxl4':
				template.value = 'blmxl4';
				break;
			case 'yzd1':
				template.value = 'yzd1';
				break;
			default:
				template.value = '';
		}
	})

	// 获取传入的 eventChannel
	const eventChannel = getCurrentInstance().proxy.getOpenerEventChannel()

	const changeColor = (color) => {
		drawColor.value = color;
	}

	const chooseTemplate = (tem) => {
		// uni.chooseImage({
		// 	count: 1,
		// 	success: (res) => {
		// 		events.value.push({
		// 			type: 'template',
		// 			object: {
		// 				oldTemplateImage: templateImage.value,
		// 				newTemplateImage: res.tempFilePaths[0]
		// 			}
		// 		})
		// 		templateImage.value = res.tempFilePaths[0];
		// 		redrawCanvas();
		// 	}
		// });
		if (tem !== null) {
			template.value = tem;
		}

		resetState();
	};

	const inputting = () => {
		if (changingTextIndex.value !== null) {
			//修改时
			history.value[changingTextIndex.value].textValue = textValue.value;
			inputAndChanged.value = true;
			//获取文字长度
			// textBox.value.width = ctx.value.measureText(history.value[changingTextIndex.value].textValue).width
		} else {
			//新增时
			history.value[history.value.length - 1].textValue = textValue.value;
			// textBox.value.width = ctx.value.measureText(history.value[history.value.length - 1].textValue).width
		}
		textBox.value.width = textValue.value == '' ? 20 : ctx.value.measureText(textValue.value).width
		redrawCanvas();
	}

	const cancelText = () => {
		if (changingTextIndex.value !== null) {
			//如果刚刚是修改 取消应该是取消修改 改回原来的值
			history.value[changingTextIndex.value].textValue = beforeChangeText.value;
			inputAndChanged.value = false
		} else {
			//新增的取消则是删除对象
			history.value.pop();
			events.value.pop();
		}
		resetState();
	};

	const confirmText = () => {
		if (textValue.value === '') {
			//如果没有输入文字 那么就删除这个空的text对象
			history.value.pop();
		}
		if (inputAndChanged.value == true && beforeChangeText.value != textValue.value) {
			//真正修改了 并且 修改后的值有变化
			events.value.push({
				type: 'textValueChange',
				object: {
					oldTextValue: beforeChangeText.value,
					newTextValue: textValue.value
				},
				id: history.value[changingTextIndex.value].id
			})
			inputAndChanged.value = false
		}
		resetState();
	};

	const resetState = () => {
		showTextInput.value = false;
		textSelecting.value = false;
		changingTextIndex.value = null;
		textValue.value = '';
		redrawCanvas();
	}
	// 设置绘制模式
	const setMode = (newMode) => {
		mode.value = newMode;
		if (showTextInput.value) {
			clickWithInputShowing();
		}
		resetState();
	};
	//清空画布
	const clearCanvas = () => {
		events.value.push({
			type: 'clear',
			object: {
				history: history.value,
				template: template.value
			}
		})
		history.value = [];
		// templateImage.value = '';
		resetState();
		redrawCanvas();
	};

	const zoomIn = () => {
		scale.value *= 1.1; // 放大10%
		redrawCanvas();
	}
	const zoomOut = () => {
		scale.value /= 1.1; // 缩小10%
		redrawCanvas();
	}
	const back = () => {
		uni.navigateBack()
	}

	//撤销
	const undo = () => {
		//可能发生的事件
		//history.value添加了一个对象 -> events记录'add'以及对象的id -> 撤销中删除此对象即可
		//history.value删除了一个对象 -> events记录'delete'以及对象的信息 -> 撤销中执行push即可
		//history.value移动了一个对象 -> events记录'move'以及对象的信息 -> 撤销中改回原位置即可
		//选择了模板                  -> events记录'template'以及旧模板（可能是空） -> 撤销中改回旧模板或空
		//清空了画布                  -> events记录'clear'以及旧history（可能是空） -> 撤销中改回旧history
		let len = events.value.length;
		if (len > 0) {
			let type = events.value[len - 1].type;
			let obj = events.value[len - 1].object;
			let id = events.value[len - 1].id;
			let index = -1;
			if (id !== null) {
				index = history.value.findIndex(item => item.id === id);
			}
			if (type == 'add') {
				//根据id删除数组中的元素
				if (index !== -1) {
					history.value.splice(index, 1);
				}
			} else if (type == 'delete') {
				history.value.push(obj)
			} else if (type == 'move') {
				//根据id找到对象
				if (index !== -1) {
					//将对象的坐标改回原来的坐标
					//不同的对象存储的位置属性是不同的 如textInputX和x
					backToOldPosition(index, obj)
					// history.value[index].x = obj.x;
					// history.value[index].y = obj.y;
				}
			} else if (type == 'template') {
				template.value = obj.oldTemplateImage;
			} else if (type == 'clear') {
				//清空画布时 记录的是history的快照和模板
				history.value = obj.history;
				template.value = obj.template;
			} else if (type == 'textValueChange') {
				history.value[index].textValue = obj.oldTextValue;
			}
		}
		events.value.pop();
		resetState();
		// redrawCanvas();
	};

	const backToOldPosition = (index, obj) => {
		if (history.value[index].mode === 'line') {
			history.value[index].startX = obj.startX;
			history.value[index].startY = obj.startY;
			history.value[index].endX = obj.endX;
			history.value[index].endY = obj.endY;
		} else if (history.value[index].mode === 'rect') {
			history.value[index].x = obj.x;
			history.value[index].y = obj.y;
			history.value[index].width = obj.width;
			history.value[index].height = obj.height;
		} else if (history.value[index].mode === 'circle') {
			history.value[index].startX = obj.startX;
			history.value[index].startY = obj.startY;
			history.value[index].currentX = obj.currentX;
			history.value[index].currentY = obj.currentY;
		} else if (history.value[index].mode === 'curve') {
			history.value[index].curvePoints = obj.curvePoints;
		} else if (history.value[index].mode === 'text') {
			history.value[index].textInputX = obj.textInputX;
			history.value[index].textInputY = obj.textInputY;
		}
	}

	//删除当前
	const deleteSelected = () => {
		if (!selectedObject.value) return;

		const index = history.value.findIndex(item => item.id === selectedObject.value.id);
		if (index !== -1) {
			//删除前记录对象
			events.value.push({
				type: 'delete',
				object: history.value[index]
			});
			history.value.splice(index, 1); // 从 history 中删除
			selectedObject.value = null; // 清除选中状态
		}
		resetState();
		redrawCanvas();
	};

	// 计算双指距离
	const getDistance = (touches) => {
		const dx = touches[0].x - touches[1].x;
		const dy = touches[0].y - touches[1].y;
		return Math.sqrt(dx * dx + dy * dy);
	};

	// 更新输入框大小以包裹文字
	function updateInputSize() {
		const text = textValue.value
		const width = text.length ? text.length * 8 + 10 : 50
		inputStyle.value.width = `${width}px`
	}

	const touchStart = (e) => {
		let {
			x,
			y
		} = e.touches[0];
		startX.value = x;
		startY.value = y;

		// 统一转换为逻辑坐标（未缩放、未偏移的画布坐标）
		const logicX = (x - offsetX.value - screenWidth.value / 2) / scale.value + screenWidth.value / 2;
		const logicY = (y - offsetY.value - screenHeight.value / 2) / scale.value + screenHeight.value / 2;
		// 存储逻辑坐标，用于绘制
		offsetStartX.value = logicX;
		offsetStartY.value = logicY;
		// offsetStartX.value = x - offsetX.value;
		// offsetStartY.value = y - offsetY.value;
		drawing.value = true;
		if (mode.value === 'curve') {
			curvePoints.value = [{
				x: logicX,
				y: logicY
			}];
			transparentCurvePoints.value = [{
				x,
				y
			}];
		}
		status.value = "start";

		//因为移动是按帧触发 所以需要设置一个标记 从而只记录移动前的初始位置
		markSavedEvent.value = false;

		//当处于选中状态 并且已经选中了某个对象 检测当前点击处是否就在这个对象上 
		//如果是 则接下来的拖动并不是修改画布的坐标，而是修改这个对象的坐标
		if (mode.value === 'select' && selectedObject.value !== null &&
			isPointInShape(selectedObject.value, -1, offsetStartX.value, offsetStartY.value)) {
			touchMoveMode.value = 'object';

		} else {
			touchMoveMode.value = 'canvas';
		}
	};

	const touchMove = (e) => {
		if (!drawing.value) return;
		let {
			x,
			y
		} = e.touches[0];
		const logicX = (x - offsetX.value - screenWidth.value / 2) / scale.value + screenWidth.value / 2;
		const logicY = (y - offsetY.value - screenHeight.value / 2) / scale.value + screenHeight.value / 2;

		currentX.value = x;
		currentY.value = y;
		// offsetCurrentX.value = x - offsetX.value;
		// offsetCurrentY.value = y - offsetY.value;
		offsetCurrentX.value = logicX;
		offsetCurrentY.value = logicY;

		if (mode.value !== 'select') {
			transparentCtx.value.clearRect(0, 0, screenWidth.value, screenHeight.value);
			transparentCtx.value.setStrokeStyle('#ff00ff');
			transparentCtx.value.setLineWidth(1);
			transparentCtx.value.beginPath();
		}

		if (mode.value === 'line') {
			transparentCtx.value.moveTo(startX.value, startY.value);
			transparentCtx.value.lineTo(currentX.value, currentY.value);
		} else if (mode.value === 'rect') {
			transparentCtx.value.rect(startX.value, startY.value, currentX.value - startX.value, currentY.value -
				startY.value);
		} else if (mode.value === 'circle') {
			// 绝对圆形
			// let radius = Math.sqrt(Math.pow(currentX.value - startX.value, 2) + Math.pow(currentY.value - startY.value,
			// 	2));
			// transparentCtx.value.arc(startX.value, startY.value, radius, 0, 2 * Math.PI);

			// 椭圆
			// drawEllipse(transparentCtx.value, startX.value, startY.value, currentX.value, currentY.value);
			drawSmoothEllipse(transparentCtx.value, startX.value, startY.value, currentX.value, currentY.value);
		} else if (mode.value === 'curve') {
			curvePoints.value.push({
				x: logicX,
				y: logicY
			});
			transparentCurvePoints.value.push({
				x,
				y
			});
			transparentCtx.value.moveTo(transparentCurvePoints.value[0].x, transparentCurvePoints.value[0].y);
			transparentCurvePoints.value.forEach((point) => {
				transparentCtx.value.lineTo(point.x, point.y);
			});
		} else if (mode.value === 'select') {
			if (e.touches.length === 1) {
				// 计算位移量
				const dx = e.touches[0].x - startX.value;
				const dy = e.touches[0].y - startY.value;
				if (touchMoveMode.value === 'canvas') {
					// 画布移动
					offsetX.value += dx;
					offsetY.value += dy;
				} else {
					//物体移动
					const index = history.value.findIndex(item => item.id === selectedObject.value.id);
					if (index !== -1) {
						//记录移动前的位置信息
						if (markSavedEvent.value == false) {
							const objJSON = JSON.parse(JSON.stringify(history.value[index]));
							events.value.push({
								type: 'move',
								object: objJSON,
								id: objJSON.id
							});
							markSavedEvent.value = true;
						}
						changeObjectPosition(history.value[index], dx, dy);
					}
				}

				startX.value = e.touches[0].x;
				startY.value = e.touches[0].y;
				redrawCanvas();
			} else if (e.touches.length === 2) {
				// 计算缩放比例
				const newDistance = getDistance(e.touches);
				if (lastDistance.value == 0) {
					lastDistance.value = newDistance;
				}
				const scaleFactor = newDistance / lastDistance.value;

				scale.value *= scaleFactor;
				scale.value = Math.max(0.5, Math.min(scale.value, 3)); // 限制 0.5x - 3x 缩放范围
				lastDistance.value = newDistance;
				redrawCanvas();
			}
		}

		transparentCtx.value.stroke();
		transparentCtx.value.draw(false);
		if (mode.value !== 'text') {
			status.value = "select";
		}
	};

	const touchEnd = (e) => {
		if (!drawing.value) return;
		drawing.value = false;
		let {
			x,
			y
		} = e.changedTouches[0];
		// x = x - offsetX.value;
		// y = y - offsetY.value;
		const logical = screenToLogical(x, y); // 计算逻辑坐标

		//移动、文字、单击都不需要保存
		if (mode.value !== 'select' && mode.value !== 'text' && status.value !== "start") {
			save();
		}

		//对添加文字模式处理 不论是点击还是拖动后松开 都一视同仁在end坐标处添加文字
		if (mode.value === 'text') {
			const clickIndex = clickOnText(x, y);
			if (showTextInput.value) {
				//如果是展开状态 说明正在添加一个新文字 或者修改旧文字 收起input框，并将添加取消、修改撤回
				clickWithInputShowing();
			} else {
				//如果不是展开状态 则检测有没有点到文字
				if (clickIndex === -1) {
					//没点到文字 点的是空白处 新加文字
					// 保存逻辑坐标（用于 canvas 绘制和保存）
					textInputX.value = logical.x;
					textInputY.value = logical.y;
					textValue.value = '';
					textSelecting.value = true;
					// 设置文字输入框位置（屏幕坐标）
					const screenPos = logicalToScreen(logical.x, logical.y);
					showTextInput.value = true;

					textBox.value = {
						x: logical.x,
						y: logical.y - 20,
						width: 20,
						height: 20
					};
					save();
				} else {
					//点到文字了 并且点到的文字在数组中序号是clickIndex
					changeText(clickIndex);
				}
			}
		}

		if (status.value === "start" && mode.value === 'select') {
			//说明用户只单击了一下 并且还是在选择模式下
			currentX.value = startX.value;
			currentY.value = startY.value;

			// selectedObject.value = null;
			// 检查是否有图案与单击位置重叠
			if (!showTextInput.value) {
				clickOnObject(offsetStartX.value, offsetStartY.value)
			} else {
				//如果输入框是展开的 收起 重置状态 
				clickWithInputShowing();
			}
		}

		if (status.value === "select" && mode.value === 'select') {
			if (showTextInput.value) {
				clickWithInputShowing();
			}
		}

		transparentCtx.value.clearRect(0, 0, screenWidth.value, screenHeight.value);
		transparentCtx.value.draw(true);

		status.value = "end";
		setTimeout(() => {
			redrawCanvas();
		}, 50);
	};

	// 将屏幕坐标转换为逻辑坐标
	function screenToLogical(x, y) {
		return {
			x: (x - offsetX.value - screenWidth.value / 2) / scale.value + screenWidth.value / 2,
			y: (y - offsetY.value - screenHeight.value / 2) / scale.value + screenHeight.value / 2
		};
	}

	// 将逻辑坐标转换为屏幕坐标
	function logicalToScreen(x, y) {
		return {
			x: (x - screenWidth.value / 2) * scale.value + offsetX.value + screenWidth.value / 2,
			y: (y - screenHeight.value / 2) * scale.value + offsetY.value + screenHeight.value / 2
		};
	}


	//点击时输入框是展开状态
	const clickWithInputShowing = () => {
		if (changingTextIndex.value !== null) {
			//正在修改中
			//将修改中的撤回
			history.value[changingTextIndex.value].textValue = beforeChangeText.value;
			inputAndChanged.value = false
		} else {
			//正在新加文字中 
			//取消新加的 
			history.value.pop();
			events.value.pop();
		}
		resetState();
	}

	//点击到文字的后续操作
	const changeText = (clickIndex) => {
		let clickObj = history.value[clickIndex];
		//文字长度
		const textWidth = ctx.value.measureText(clickObj.textValue).width;
		//文字高度 近似为字体的字号
		const textHeight = textFontSize.value;

		textValue.value = clickObj.textValue;
		changingTextIndex.value = clickIndex;
		beforeChangeText.value = JSON.parse(JSON.stringify(clickObj.textValue));
		showTextInput.value = true;
		textSelecting.value = true;
		textBox.value = {
			x: clickObj.textInputX,
			y: clickObj.textInputY - textHeight,
			width: textWidth,
			height: textHeight
		};
		textInputX.value = clickObj.textInputX + offsetX.value;
		textInputY.value = clickObj.textInputY + 10 + offsetY.value;
	}
	//检测是否点击到文字
	const clickOnText = (x, y) => {
		const tolerance = 3; // 容差像素

		// 是否点击位置与上次接近
		const isSamePos =
			lastClick.value.x !== null &&
			Math.abs(lastClick.value.x - x) <= tolerance &&
			Math.abs(lastClick.value.y - y) <= tolerance;

		let found = false;
		let foundIndex = -1;

		for (let i = history.value.length - 1; i >= 0; i--) {
			const action = history.value[i];

			// 如果当前点击位置与上次接近，就跳过上次选中的图形索引，选下一个
			if (isSamePos && i === lastClick.value.index) continue;

			if (action.mode === 'text' && isPointInText(action, i, x, y)) {
				found = true;
				foundIndex = i;
				break;
			}
		}

		if (found) {
			lastClick.value = {
				x,
				y,
				index: foundIndex
			};
			return foundIndex;
		} else {
			lastClick.value = {
				x: null,
				y: null,
				index: -1
			};
			return -1;
		}
	};

	const clickOnObject = (x, y) => {
		const tolerance = 3;

		// 判断点击位置是否与上次相近
		const isSamePos =
			lastClick.value.x !== null &&
			Math.abs(lastClick.value.x - x) <= tolerance &&
			Math.abs(lastClick.value.y - y) <= tolerance;

		// 收集当前位置命中的图形（从后往前优先显示上层图形）
		const candidates = [];
		for (let i = history.value.length - 1; i >= 0; i--) {
			const action = history.value[i];

			if (mode.value === 'text' && action.mode !== 'text') continue;

			if (isPointInShape(action, i, x, y)) {
				candidates.push({
					action,
					index: i
				});
			}
		}

		if (candidates.length === 0) {
			// 没有选中任何图形
			changingTextIndex.value = -1;
			// history.value = updatedHistory.map(action => ({
			// 	...action,
			// 	color: drawColor.value
			// }));
			if (selectedObject.value !== null) {
				// 还原颜色
				const index = history.value.findIndex(item => item.id == selectedObject.value.id);
				if (index !== -1) {
					history.value[index].color = selectedObjectOriginColor.value;
				}
			}
			selectedObject.value = null;
			lastClick.value = {
				x: null,
				y: null,
				index: -1
			};
			clickCandidates.value = [];
			clickCycleIndex.value = 0;
			return;
		}

		let updatedHistory = history.value.map(action => ({
			...action
		}));

		let chosen;
		if (
			isSamePos &&
			clickCandidates.value.length > 0 &&
			JSON.stringify(clickCandidates.value.map(c => c.index)) === JSON.stringify(candidates.map(c => c.index))
		) {
			// 连续点击同一位置，并且候选对象一样 -> 退让循环
			clickCycleIndex.value = (clickCycleIndex.value + 1) % candidates.length;
			chosen = candidates[clickCycleIndex.value];
		} else {
			// 第一次点击该区域 或 候选对象发生变化 -> 从头开始
			clickCandidates.value = candidates;
			clickCycleIndex.value = 0;
			chosen = candidates[0];
		}

		if (chosen.action.mode !== 'text') {
			// 更新颜色状态
			if (selectedObject.value === null && candidates.length !== 0) {
				//第一次选中 没有上次选中的历史记录
				selectedObjectOriginColor.value = JSON.parse(JSON.stringify(history.value[chosen.index].color));
				updatedHistory[chosen.index].color = '#0F4687';
				selectedObject.value = updatedHistory[chosen.index];
			} else if (selectedObject.value !== null && selectedObject.value.id === chosen.action.id) {
				//如果上次选中的对象和当前选中的对象是同一个对象 什么都不用做
			} else if (selectedObject.value !== null && selectedObject.value.id !== chosen.action.id) {
				//如果上次选中的对象和当前选中的对象不是同一个对象
				//将上次选中的对象颜色改回原来的颜色
				const index = updatedHistory.findIndex(item => item.id == selectedObject.value.id);
				if (index !== -1) {
					updatedHistory[index].color = selectedObjectOriginColor.value;
				}
				selectedObjectOriginColor.value = JSON.parse(JSON.stringify(history.value[chosen.index].color));
				updatedHistory[chosen.index].color = '#0F4687';
				selectedObject.value = updatedHistory[chosen.index];
			}
		}

		history.value = updatedHistory;
		selectedObject.value = chosen.action;
		lastClick.value = {
			x,
			y,
			index: chosen.index
		};

		if (chosen.action.mode === 'text') {
			changingTextIndex.value = chosen.index;
		}
	};

	//是否点到了文字
	const isPointInText = (action, historyIndex, x, y) => {
		//文字的位置是在左下角，所以要判断文字长度
		const textWidth = ctx.value.measureText(action.textValue).width;
		//获取文字高度 近似为字体的字号
		const textHeight = textFontSize.value;

		// 检查点是否在文字的一定范围内（例如，20个单位）
		if (action.textInputY - y > 0 && action.textInputY - y < 20 &&
			x - action.textInputX > 0 && x - action.textInputX < textWidth) {
			return true;
		}
		return false;
	}

	const isPointInShape = (action, historyIndex, x, y) => {
		if (action === null) {
			return false;
		}
		if (action.mode === 'rect') {
			if (Math.abs(x - action.x) < 5 && y > action.y && y < action.y + action.height) {
				//点击的左边的线
				return true;
			} else if (Math.abs(x - action.x - action.width) < 5 && y > action.y && y < action.y + action.height) {
				//点击的右边的线
				return true;
			} else if (Math.abs(y - action.y) < 5 && x > action.x && y < action.x + action.width) {
				//点击的上边的线
				return true;
			} else if (Math.abs(y - action.y - action.height) < 5 && x > action.x && y < action.x + action.width) {
				//点击的上边的线
				return true;
			} else {
				return false;
			}
		} else if (action.mode === 'circle') {
			//椭圆圆心
			const cx = (action.startX + action.currentX) / 2;
			const cy = (action.startY + action.currentY) / 2;
			//点击位置和圆心的距离
			const dx = x - cx;
			const dy = y - cy;
			//椭圆长轴
			const longAxis = Math.abs(action.startX - action.currentX) / 2;
			//椭圆短轴
			const shortAxis = Math.abs(action.startY - action.currentY) / 2;
			//判断是否在椭圆上
			const isOnEllipse = (dx * dx) / (longAxis * longAxis) + (dy * dy) / (shortAxis * shortAxis);
			return isOnEllipse >= 0.95 && isOnEllipse <= 1.05;
			// return dx * dx + dy * dy <= action.radius * action.radius;
		} else if (action.mode === 'line') {
			const dis = pointToSegmentDistance(action.startX, action.startY, action.endX, action.endY, x, y);
			if (dis < 5) {
				return true;
			}
		} else if (action.mode === 'curve') {
			return action.curvePoints.some(point => {
				const distanceX = Math.abs(point.x - x);
				const distanceY = Math.abs(point.y - y);
				// 检查点是否在曲线点的一定范围内（例如，10个单位）
				return distanceX < 10 && distanceY < 10;
			});
		} else if (action.mode === 'text') {
			//文字的位置是在左下角，所以要判断文字长度
			const textWidth = ctx.value.measureText(action.textValue).width;
			//获取文字高度 近似为字体的字号
			const textHeight = textFontSize.value;

			// 检查点是否在文字的一定范围内（例如，20个单位）
			if (action.textInputY - y > 0 && action.textInputY - y < 20 &&
				x - action.textInputX > 0 && x - action.textInputX < textWidth) {
				if (historyIndex === -1) {
					historyIndex = history.value.findIndex(item => item.id === action.id);
				} else {
					changeText(historyIndex);
				}
				return true;
			}
		}
		return false;
	};

	const changeObjectPosition = (object, dx, dy) => {
		// if (!object) return;
		// 禁用拖动单个对象
		return

		switch (object.mode) {
			case 'line':
				object.startX += dx;
				object.startY += dy;
				object.endX += dx;
				object.endY += dy;
				break;

			case 'rect':
				object.x += dx;
				object.y += dy;
				break;

			case 'circle':
				object.startX += dx;
				object.startY += dy;
				object.currentX += dx;
				object.currentY += dy;
				break;

			case 'curve':
				if (Array.isArray(object.curvePoints)) {
					object.curvePoints.forEach(point => {
						point.x += dx;
						point.y += dy;
					});
				}
				break;

			case 'text':
				object.textInputX += dx;
				object.textInputY += dy;
				if (showTextInput.value) {
					clickWithInputShowing();
				}
				break;

			default:
				console.warn('Unknown object mode:', object.mode);
		}
		selectedObject.value = object;
	};

	const saveCanvasToImage = () => {
		resetState();
		// canvasImagePath.value = history.value[history.value.length - 1].path;
		uni.canvasToTempFilePath({
			canvasId: canvasId,
			success: (res) => {
				const filePath = res.tempFilePath;
				//展示
				canvasImagePath.value = filePath;

				eventChannel.emit('returnData', {
					msg: 'SaveImage',
					src: filePath
				})
				uni.navigateBack()
				// 保存到相册
				// uni.saveImageToPhotosAlbum({
				// 	filePath: filePath,
				// 	success: () => {
				// 		uni.showToast({
				// 			title: "保存成功",
				// 			icon: "success"
				// 		});
				// 	},
				// 	fail: (err) => {
				// 		console.error("保存到相册失败", err);
				// 	}
				// });
			},
			fail: (err) => {
				console.error("保存画布失败", err);
			}
		});
	};

	const changeTemplateParam = () => {
		showParamPopup.value = true;
		if (template.value === 'kxb1') {
			tempParams.value = JSON.parse(JSON.stringify(kxbTemplateParam1.value));
		} else if (template.value === 'kxb2') {
			tempParams.value = JSON.parse(JSON.stringify(kxbTemplateParam2.value));
		} else if (template.value === 'kxb3') {
			tempParams.value = JSON.parse(JSON.stringify(kxbTemplateParam3.value));
		} else if (template.value === 'kxb4') {
			tempParams.value = JSON.parse(JSON.stringify(kxbTemplateParam4.value));
		} else if (template.value === 'kxb5') {
			tempParams.value = JSON.parse(JSON.stringify(kxbTemplateParam5.value));
		} else if (template.value === 'kxb6') {
			tempParams.value = JSON.parse(JSON.stringify(kxbTemplateParam6.value));
		} else if (template.value === 'tl1') {
			tempParams.value = JSON.parse(JSON.stringify(tlTemplateParam1.value));
		} else if (template.value === 'hgb1') {
			tempParams.value = JSON.parse(JSON.stringify(hgbTemplateParam1.value));
		} else if (template.value === 'yq1') {
			tempParams.value = JSON.parse(JSON.stringify(yqTemplateParam1.value));
		} else if (template.value === 'blmxl1') {
			tempParams.value = JSON.parse(JSON.stringify(blmxlTemplateParam1.value));
		} else if (template.value === 'blmxl2') {
			tempParams.value = JSON.parse(JSON.stringify(blmxlTemplateParam2.value));
		} else if (template.value === 'blmxl3') {
			tempParams.value = JSON.parse(JSON.stringify(blmxlTemplateParam3.value));
		} else if (template.value === 'blmxl4') {
			tempParams.value = JSON.parse(JSON.stringify(blmxlTemplateParam4.value));
		} else if (template.value === 'yzd1') {
			tempParams.value = JSON.parse(JSON.stringify(yzdTemplateParam1.value));
		}
	}

	const applyTemplateChange = () => {
		showParamPopup.value = false;
		if (template.value === 'kxb1') {
			kxbTemplateParam1.value = JSON.parse(JSON.stringify(tempParams.value));
		} else if (template.value === 'kxb2') {
			kxbTemplateParam2.value = JSON.parse(JSON.stringify(tempParams.value));
		} else if (template.value === 'kxb3') {
			kxbTemplateParam3.value = JSON.parse(JSON.stringify(tempParams.value));
		} else if (template.value === 'kxb4') {
			kxbTemplateParam4.value = JSON.parse(JSON.stringify(tempParams.value));
		} else if (template.value === 'kxb5') {
			kxbTemplateParam5.value = JSON.parse(JSON.stringify(tempParams.value));
		} else if (template.value === 'kxb6') {
			kxbTemplateParam6.value = JSON.parse(JSON.stringify(tempParams.value));
		} else if (template.value === 'tl1') {
			tlTemplateParam1.value = JSON.parse(JSON.stringify(tempParams.value));
		} else if (template.value === 'hgb1') {
			hgbTemplateParam1.value = JSON.parse(JSON.stringify(tempParams.value));
		} else if (template.value === 'yq1') {
			yqTemplateParam1.value = JSON.parse(JSON.stringify(tempParams.value));
		} else if (template.value === 'blmxl1') {
			blmxlTemplateParam1.value = JSON.parse(JSON.stringify(tempParams.value));
		} else if (template.value === 'blmxl2') {
			blmxlTemplateParam2.value = JSON.parse(JSON.stringify(tempParams.value));
		} else if (template.value === 'blmxl3') {
			blmxlTemplateParam3.value = JSON.parse(JSON.stringify(tempParams.value));
		} else if (template.value === 'blmxl4') {
			blmxlTemplateParam4.value = JSON.parse(JSON.stringify(tempParams.value));
		} else if (template.value === 'yzd1') {
			yzdTemplateParam1.value = JSON.parse(JSON.stringify(tempParams.value));
		}
		redrawCanvas();
	}

	const cancleTemplateChange = () => {
		showParamPopup.value = false
	}

	const save = () => {
		let action;
		if (mode.value !== 'select' && status.value !== "start") {
			if (mode.value === 'line') {
				action = {
					mode: 'line',
					startX: offsetStartX.value,
					startY: offsetStartY.value,
					endX: offsetCurrentX.value,
					endY: offsetCurrentY.value,
					color: drawColor.value,
					id: Math.random().toString(36).substr(2, 8)
				};
			} else if (mode.value === 'rect') {
				action = {
					mode: 'rect',
					x: offsetStartX.value,
					y: offsetStartY.value,
					width: offsetCurrentX.value - offsetStartX.value,
					height: offsetCurrentY.value - offsetStartY.value,
					color: drawColor.value,
					id: Math.random().toString(36).substr(2, 8)
				};
			} else if (mode.value === 'circle') {
				const cx = (offsetStartX.value + offsetCurrentX.value) / 2;
				const cy = (offsetStartY.value + offsetCurrentY.value) / 2;
				const radius = Math.sqrt(Math.pow(offsetCurrentX.value - offsetStartX.value, 2) + Math.pow(
					offsetCurrentY.value - offsetStartY
					.value, 2)) / 2;
				action = {
					mode: 'circle',
					startX: offsetStartX.value,
					startY: offsetStartY.value,
					currentX: offsetCurrentX.value,
					currentY: offsetCurrentY.value,
					color: drawColor.value,
					id: Math.random().toString(36).substr(2, 8)
				};
			} else if (mode.value === 'curve') {
				action = {
					mode: 'curve',
					curvePoints: curvePoints.value.map(point => ({
						x: point.x,
						y: point.y
					})),
					color: drawColor.value,
					id: Math.random().toString(36).substr(2, 8)
				};
			}
		}
		if (mode.value === 'text') {
			// action = {
			// 	mode: 'text',
			// 	textValue: textValue.value,
			// 	// textInputX: textInputX.value - offsetX.value,
			// 	// textInputY: textInputY.value - 10 - offsetY.value,
			// 	textInputX: textInputX.value,
			// 	textInputY: textInputY.value,
			// 	id: Math.random().toString(36).substr(2, 8)
			// }
			action = {
				mode: 'text',
				textValue: textValue.value,
				textInputX: textInputX.value, // 逻辑坐标
				textInputY: textInputY.value,
				color: drawColor.value,
				id: Math.random().toString(36).substr(2, 8),
				scale: scale.value
			};
		}
		action.scale = scale.value;
		if (action) {
			history.value.push(action);
			events.value.push({
				type: 'add',
				object: null,
				id: action.id
			})
		}
	};

	const drawTemplate = () => {
		//绘制模板
		console.log("渲染模板", template.value);
		if (template.value === 'kxb1') {
			drawKxbTemplate1(ctx.value, {
				logicalWidth: Number(kxbTemplateParam1.value.logicalWidth),
				logicalHeight: Number(kxbTemplateParam1.value.logicalHeight),
				unit: kxbTemplateParam1.value.unit, // 单位参数
				qt: 0,
			});
		} else if (template.value === 'kxb2') {
			drawKxbTemplate2(ctx.value, {
				logicalWidth: Number(kxbTemplateParam2.value.logicalWidth),
				logicalHeight: Number(kxbTemplateParam2.value.logicalHeight),
				unit: kxbTemplateParam2.value.unit, // 单位参数
			});
		} else if (template.value === 'kxb3') {
			drawKxbTemplate3(ctx.value, {
				logicalWidth: kxbTemplateParam3.value.logicalWidth,
				bigBeamNumber: kxbTemplateParam3.value.bigBeamNumber,
				beamCount: kxbTemplateParam3.value.beamCount,
				bridgeFu: kxbTemplateParam3.value.bridgeFu,
				unit: kxbTemplateParam3.value.unit,
			});
		} else if (template.value === 'kxb4') {
			drawKxbTemplate4(ctx.value, {
				logicalWidth: kxbTemplateParam4.value.logicalWidth,
				bigBeamNumber: kxbTemplateParam4.value.bigBeamNumber,
				beamCount: kxbTemplateParam4.value.beamCount,
				bridgeFu: kxbTemplateParam4.value.bridgeFu,
				unit: kxbTemplateParam4.value.unit,
			});
		} else if (template.value === 'kxb5') {
			drawKxbTemplate5(ctx.value, {
				logicalLength: kxbTemplateParam5.value.logicalLength,
				bottomPlate: Number(kxbTemplateParam5.value.bottomPlate),
				abdomenPlate: Number(kxbTemplateParam5.value.abdomenPlate),
				flangePlate: Number(kxbTemplateParam5.value.flangePlate),
				unit: kxbTemplateParam5.value.unit,
			});
		} else if (template.value === 'kxb6') {
			drawKxbTemplate6(ctx.value, {
				logicalLength: kxbTemplateParam6.value.logicalLength,
				bottomPlate: Number(kxbTemplateParam6.value.bottomPlate),
				abdomenPlate: Number(kxbTemplateParam6.value.abdomenPlate),
				flangePlate: Number(kxbTemplateParam6.value.flangePlate),
				unit: kxbTemplateParam6.value.unit,
			});
		} else if (template.value === 'tl1') {
			drawTlTemplate1(ctx.value, {
				logicalWidth: tlTemplateParam1.value.logicalLength,
				bottomPlate: Number(tlTemplateParam1.value.bottomPlate),
				abdomenPlate: Number(tlTemplateParam1.value.abdomenPlate),
				flangePlate: Number(tlTemplateParam1.value.flangePlate),
				unit: tlTemplateParam1.value.unit,
			});
		} else if (template.value === 'xl1') {
			drawTlTemplate1(ctx.value, {
				logicalWidth: tlTemplateParam1.value.logicalLength,
				bottomPlate: Number(tlTemplateParam1.value.bottomPlate),
				abdomenPlate: Number(tlTemplateParam1.value.abdomenPlate),
				flangePlate: Number(tlTemplateParam1.value.flangePlate),
				unit: tlTemplateParam1.value.unit,
				xl: true,
			});
		} else if (template.value === 'qt1') {
			drawKxbTemplate1(ctx.value, {
				logicalWidth: Number(kxbTemplateParam1.value.logicalWidth),
				logicalHeight: Number(kxbTemplateParam1.value.logicalHeight),
				unit: kxbTemplateParam1.value.unit, // 单位参数
				qt: 1
			});
		} else if (template.value === 'qt2') {
			drawKxbTemplate1(ctx.value, {
				logicalWidth: Number(kxbTemplateParam1.value.logicalWidth),
				logicalHeight: Number(kxbTemplateParam1.value.logicalHeight),
				unit: kxbTemplateParam1.value.unit, // 单位参数
				qt: 2,
			});
		} else if (template.value === 'hgb1') {
			drawHgbTemplate1(ctx.value, {
				logicalWidth: Number(hgbTemplateParam1.value.logicalWidth),
				logicalHeight: Number(hgbTemplateParam1.value.logicalHeight),
				unit: hgbTemplateParam1.value.unit, // 单位参数
				gl: false
			});
		} else if (template.value === 'yq1') {
			drawYqTemplate1(ctx.value, {
				logicalWidth: Number(yqTemplateParam1.value.logicalWidth),
				logicalHeight: Number(yqTemplateParam1.value.logicalHeight),
				unit: yqTemplateParam1.value.unit, // 单位参数
			});
		} else if (template.value === 'gl1') {
			drawHgbTemplate1(ctx.value, {
				logicalWidth: Number(hgbTemplateParam1.value.logicalWidth),
				logicalHeight: Number(hgbTemplateParam1.value.logicalHeight),
				unit: hgbTemplateParam1.value.unit, // 单位参数
				gl: true
			});
		} else if (template.value === 'blmxl1') {
			drawBlmxlTemplate1(ctx.value, {
				logicalLength: Number(blmxlTemplateParam1.value.logicalLength),
				beamCount: Number(blmxlTemplateParam1.value.beamCount),
				unit: blmxlTemplateParam1.value.unit,
				bigBeamNumber: Number(blmxlTemplateParam1.value.bigBeamNumber),
				smallBeamNumber: Number(blmxlTemplateParam1.value.smallBeamNumber),
				bridgeFu: blmxlTemplateParam1.value.bridgeFu
			});
		} else if (template.value === 'blmxl2') {
			drawBlmxlTemplate2(ctx.value, {
				logicalLength: Number(blmxlTemplateParam2.value.logicalLength),
				beamCount: Number(blmxlTemplateParam2.value.beamCount),
				unit: blmxlTemplateParam2.value.unit,
				bigBeamNumber: Number(blmxlTemplateParam2.value.bigBeamNumber),
				smallBeamNumber: Number(blmxlTemplateParam2.value.smallBeamNumber),
				bridgeFu: blmxlTemplateParam2.value.bridgeFu
			});
		} else if (template.value === 'blmxl3') {
			drawBlmxlTemplate3(ctx.value, {
				logicalLength: Number(blmxlTemplateParam3.value.logicalLength),
				leftBeamCount: Number(blmxlTemplateParam3.value.leftBeamCount),
				unit: blmxlTemplateParam3.value.unit,
				bigBeamNumber: Number(blmxlTemplateParam3.value.bigBeamNumber),
				smallBeamNumber: Number(blmxlTemplateParam3.value.smallBeamNumber),
				bridgeFu: blmxlTemplateParam3.value.bridgeFu
			});
		} else if (template.value === 'blmxl4') {
			drawBlmxlTemplate4(ctx.value, {
				logicalLength: Number(blmxlTemplateParam4.value.logicalLength),
				rightBeamCount: Number(blmxlTemplateParam4.value.rightBeamCount),
				unit: blmxlTemplateParam4.value.unit,
				bigBeamNumber: Number(blmxlTemplateParam4.value.bigBeamNumber),
				smallBeamNumber: Number(blmxlTemplateParam4.value.smallBeamNumber),
				bridgeFu: blmxlTemplateParam4.value.bridgeFu
			});
		} else if (template.value === 'yzd1') {
			drawYzdTemplate1(ctx.value, {
				// logicalWidth: Number(yzdTemplateParam1.value.logicalWidth),
				logicalHeight: Number(yzdTemplateParam1.value.logicalHeight),
				unit: yzdTemplateParam1.value.unit, // 单位参数
			});
		}
	}
	const redrawCanvas = () => {
		const now = Date.now();
		if (now - lastRedrawTime < 16) return;
		lastRedrawTime = now;

		ctx.value.save();
		ctx.value.clearRect(0, 0, screenWidth.value, screenHeight.value);

		// 画布全局平移 + 缩放（以中心为原点）
		ctx.value.translate(offsetX.value, offsetY.value);
		ctx.value.translate(screenWidth.value / 2, screenHeight.value / 2);
		ctx.value.scale(scale.value, scale.value);
		ctx.value.translate(-screenWidth.value / 2, -screenHeight.value / 2);

		// 绘制白色背景
		ctx.value.setFillStyle('#ffffff'); // 白色
		ctx.value.fillRect(0, 0, screenWidth.value, screenHeight.value);
    ctx.value.restore();
    ctx.value.save();

		// 绘制模板图（如果有）
		drawTemplate();

		// 绘制历史操作
		history.value.forEach(action => {
			ctx.value.save();

			ctx.value.setStrokeStyle(action.color);
			ctx.value.setLineWidth(1 / scale.value); // 保持视觉一致
			ctx.value.beginPath();

			if (action.mode === 'line') {
				ctx.value.moveTo(action.startX, action.startY);
				ctx.value.lineTo(action.endX, action.endY);
			} else if (action.mode === 'rect') {
				ctx.value.rect(action.x, action.y, action.width, action.height);
			} else if (action.mode === 'circle') {
				drawSmoothEllipse(ctx.value, action.startX, action.startY, action.currentX, action.currentY);
			} else if (action.mode === 'curve') {
				ctx.value.moveTo(action.curvePoints[0].x, action.curvePoints[0].y);
				for (let i = 1; i < action.curvePoints.length; i++) {
					ctx.value.lineTo(action.curvePoints[i].x, action.curvePoints[i].y);
				}
			} else if (action.mode === 'text') {
				// ctx.value.setFontSize(20);
				// ctx.value.setFillStyle(action.color || '#000');
				// ctx.value.fillText(action.textValue, action.textInputX, action.textInputY);
				ctx.value.save(); // 保存上下文
				// 将坐标系移到文字位置
				ctx.value.translate(action.textInputX + 10, action.textInputY + 5);
				// 逆时针旋转 90 度（让文字横过来）
				ctx.value.rotate(Math.PI / 2);
				// 设置文字样式并绘制文字
				ctx.value.setFontSize(20);
				ctx.value.setFillStyle(action.color || '#000');
				ctx.value.fillText(action.textValue, 0, 0);
				ctx.value.restore(); // 恢复上下文
			}

			ctx.value.stroke();
			ctx.value.restore();
		});

		// 绘制文字选中边框
		if (textSelecting.value) {
			ctx.value.setStrokeStyle('#000000');
			ctx.value.setLineWidth(0.5);
			ctx.value.strokeRect(
				textBox.value.x + 5,
				textBox.value.y + 20,
				textBox.value.height + 8,
				textBox.value.width + 10,
			);
		}

		ctx.value.restore();
		ctx.value.draw(true);
	};

	const pointToSegmentDistance = (x1, y1, x2, y2, x, y) => {
		const dx = x2 - x1;
		const dy = y2 - y1;
		const px = x - x1;
		const py = y - y1;

		const lenSq = dx * dx + dy * dy;
		if (lenSq === 0) {
			// 线段退化为一个点
			return Math.sqrt(px * px + py * py);
		}

		const param = Math.max(0, Math.min(1, (px * dx + py * dy) / lenSq));

		const xx = x1 + param * dx;
		const yy = y1 + param * dy;

		return Math.sqrt((x - xx) * (x - xx) + (y - yy) * (y - yy));
	}

	const drawEllipse = (ctx, x1, y1, x2, y2) => {
		const cx = (x1 + x2) / 2;
		const cy = (y1 + y2) / 2;
		const rx = Math.abs(x2 - x1) / 2;
		const ry = Math.abs(y2 - y1) / 2;

		ctx.moveTo(cx + rx, cy);
		ctx.bezierCurveTo(cx + rx, cy - ry * 0.5, cx + rx * 0.5, cy - ry, cx, cy - ry);
		ctx.bezierCurveTo(cx - rx * 0.5, cy - ry, cx - rx, cy - ry * 0.5, cx - rx, cy);
		ctx.bezierCurveTo(cx - rx, cy + ry * 0.5, cx - rx * 0.5, cy + ry, cx, cy + ry);
		ctx.bezierCurveTo(cx + rx * 0.5, cy + ry, cx + rx, cy + ry * 0.5, cx + rx, cy);
	};

	const drawSmoothEllipse = (ctx, x1, y1, x2, y2) => {
		const cx = (x1 + x2) / 2;
		const cy = (y1 + y2) / 2;
		const rx = Math.abs(x2 - x1) / 2;
		const ry = Math.abs(y2 - y1) / 2;

		const kappa = 0.5522848; // 贝塞尔曲线控制点系数

		const ox = rx * kappa; // X 轴控制点偏移量
		const oy = ry * kappa; // Y 轴控制点偏移量

		ctx.moveTo(cx + rx, cy);
		ctx.bezierCurveTo(cx + rx, cy - oy, cx + ox, cy - ry, cx, cy - ry);
		ctx.bezierCurveTo(cx - ox, cy - ry, cx - rx, cy - oy, cx - rx, cy);
		ctx.bezierCurveTo(cx - rx, cy + oy, cx - ox, cy + ry, cx, cy + ry);
		ctx.bezierCurveTo(cx + ox, cy + ry, cx + rx, cy + oy, cx + rx, cy);
	};
</script>


<style scoped>
	.container {
		display: flex;
		/* flex-direction: row-reverse; */
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
		padding: 0 10rpx 0 10rpx;
		height: 95vh;
	}

	.header {
		width: 100vw;
		height: 5vh;
		background-color: #0F4687;
		color: #FFFFFF;
		font-size: 24rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.headerSP {
		font-size: 20rpx;
	}

	.toolbar {
		margin-top: 10rpx;
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		gap: 15rpx;
		z-index: 9999;
		/* width: 100vw; */
	}

	.toolbarSP {
		gap: 10rpx;
	}

	.colorToolbar {
		margin-bottom: 20rpx;
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		gap: 10rpx;
		z-index: 9999;
	}

	.toolbar button,
	.colorToolbar button {
		/* transform: rotate(90deg); */
	}

	.functionBar {
		position: absolute;
		bottom: 10rpx;
		right: 10rpx;
		display: flex;
		flex-direction: row-reverse;
		align-items: center;
		gap: 10rpx;
		z-index: 9999;
	}

	.functionButton {
		background-color: transparent;
		border: 1rpx solid #0F4687;
		height: 90rpx;
		width: 90rpx;
		font-size: 16rpx;
		color: #000000;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 4rpx;
		line-height: 1.2;
		/* transform: rotate(90deg); */
	}

	.functionButtonSP {
		height: 40rpx;
		width: 40rpx;
		font-size: 16rpx;
		line-height: 1.2;
	}

	.iconButton {
		background-color: transparent;
		border-radius: 50%;
		border: 1rpx solid #0F4687;
		height: 90rpx;
		width: 90rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 6rpx;
		white-space: nowrap;
	}

	.iconButtonSP {
		height: 40rpx;
		width: 40rpx;
	}

	.separateLine {
		border-left: 1rpx solid #0F4687;
		width: 0;
		height: 70rpx;
	}

	.separateLineSP {
		height: 30rpx;
	}

	.icon {
		width: 60rpx;
		height: 60rpx;
	}

	.colorButton {
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 50%;
		height: 40rpx;
		width: 40rpx;
		color: #FFFFFF;
		font-size: 25rpx;
	}

	.colorImg {
		height: 90rpx;
		width: 90rpx;
		/* transform: rotate(90deg); */
	}

	.colorImgSP {
		height: 50rpx;
		width: 50rpx;
	}

	.text-input {
		width: 140rpx;
		position: absolute;
		background: white;
		border: 1px solid #0F4687;
		border-radius: 10rpx;
		padding: 8px;
		z-index: 1000;
		transform-origin: top left;
		/* transform: rotate(90deg); */
	}

	.input {
		width: 100%;
		height: 30rpx;
	}

	.textButtons {
		display: flex;
		justify-content: center;
		margin-top: 5rpx;
	}

	.textButtons button {
		width: 55rpx;
		height: 30rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 8rpx;
		font-size: 16rpx;
		background-color: #0F4687;
		color: #ffffff;
	}

	.active {
		background-color: #0F4687cc;
		/* background-color: #ff93c4; */
	}

	.canvas {
		position: absolute;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background-color: transparent;
		touch-action: none;
		/* 防止浏览器的手势冲突 */
	}

	.imgShow {
		position: absolute;
		top: 0;
		left: 0;
		width: 30vw;
		height: 30vh;
		border: 1px solid #000000;
	}

	.popup {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 999;
	}

	.popup-content {
		background-color: #fff;
		padding: 20rpx;
		width: 500rpx;
		border-radius: 20rpx;
		/* transform: rotate(90deg); */
	}

	.popup-content view input {
		/* border: 1px solid #00aaff; */
		background-color: #9ddaff;
		border-radius: 5rpx;
		margin-bottom: 5rpx;
		padding: 5rpx;
	}

	.popup-actions {
		margin-top: 20rpx;
		display: flex;
		justify-content: space-between;
	}
</style>