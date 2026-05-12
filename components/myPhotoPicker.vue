<template>
	<view class="photo-picker">
		<!-- 预览区域（点击触发弹窗） -->
		<view class="preview-list">
			<view v-for="(img, idx) in modelValue" :key="idx" class="photo-item-container">
				<!-- 图片预览容器 -->
				<view class="preview-container">
					<!-- 添加点击事件预览图片 -->
					<image :src="img" class="preview-image" mode="aspectFill" @click="previewImage(idx)" />
					<view class="delete-icon" @click.stop="deleteImage(idx)">×</view>
				</view>
				<!-- 对应的图片信息按钮 - 恢复v-if条件 -->
				<view class="info-button-wrapper" v-if="buttonInfo.show">
					<button class="info-button" @click="showPhotoInfo(idx)">{{getPhotoInfoText(idx)}}</button>
				</view>
			</view>

			<!-- 添加按钮：内联灰底 + 内层铺满，避免各端 scoped 冲掉背景 -->
			<view v-if="modelValue.length < limit" class="preview-container preview-container--add"
				:style="addSlotOuterStyle" @click="showActionSheet">
				<view class="empty-preview add-upload-slot" :style="addSlotInnerStyle">
					<view class="plus-icon"></view>
				</view>
			</view>
		</view>

		<!-- 底部弹出层：无全屏变暗，仅三栏浮在页面上；点空白处关 -->
		<view class="action-sheet" v-if="actionSheetVisible">
			<view class="action-sheet-mask" @click="closeActionSheet"></view>
			<view class="action-sheet-content">
				<view class="action-sheet-item" @click="takePhoto">
					<text>拍摄</text>
				</view>
				<view class="action-sheet-item" @click="chooseFromAlbum">
					<text>从相册选择</text>
				</view>
				<view class="action-sheet-item" @click="showPhotoNumberInput">
					<text>照片序号</text>
				</view>
			</view>
		</view>

		<!-- 照片序号输入弹窗 -->
		<view class="photo-number-popup" v-if="photoNumberVisible">
			<view class="photo-number-content">
				<view class="popup-title">输入照片序号</view>
				<view class="input-container">
					<input class="photo-number-input" v-model="photoNumber" placeholder="请输入照片序号" type="text" />
				</view>
				<view class="popup-buttons">
					<view class="btn cancel-btn" @click="cancelPhotoNumber">取消</view>
					<view class="btn confirm-btn" @click="confirmPhotoNumber">确定</view>
				</view>
			</view>
			<view class="popup-mask" @click="cancelPhotoNumber"></view>
		</view>

		<!-- 画线编辑弹窗 -->
		<view class="drawing-popup" v-if="drawingVisible">
			<view class="drawing-content" style="border-radius: 10rpx; overflow: hidden;">
				<view class="popup-title" style="height: 40rpx; line-height: 20px; padding:0;">在图片上标记</view>
				<view class="drawing-toolbar">
					<view class="tool-item" :class="{ active: currentTool === 'curve' }" @click="currentTool = 'curve'">
						<image src="/static/image/curve.svg" class="tool-icon"></image>
					</view>
					<view class="tool-item" :class="{ active: currentTool === 'rect' }" @click="currentTool = 'rect'">
						<image src="/static/image/rect.svg" class="tool-icon"></image>
					</view>
					<view class="tool-item" :class="{ active: currentTool === 'line' }" @click="currentTool = 'line'">
						<image src="/static/image/line.svg" class="tool-icon"></image>
					</view>
				</view>
				<view class="canvas-container"
					:style="{ height: canvasContainerHeight, width: canvasContainerWidth, backgroundColor: '#fff' }">
					<canvas canvas-id="drawingCanvas" class="drawing-canvas" @touchstart="touchStart"
						@touchmove="touchMove" @touchend="touchEnd"></canvas>
				</view>
				<view class="popup-buttons">
					<view class="btn cancel-btn" @click="cancelDrawing">取消</view>
					<view class="btn undo-btn" :class="{ 'btn-disabled': strokeHistory.length === 0 }"
						@click="undoLastStroke">
						撤销
					</view>
					<view class="btn confirm-btn" :class="{ 'btn-disabled': isProcessing }" @click="confirmDrawing">
						{{ isProcessing ? '处理中...' : '确定' }}
					</view>
				</view>
			</view>
		</view>

		<!-- 隐藏的canvas，用于生成带数字的图片 -->
		<canvas :canvas-id="canvasId" class="hidden-canvas"
			style="position: absolute; left: -9999px; top: -9999px; width: 200px; height: 200px;"></canvas>
		<!-- 备用canvas -->
		<canvas canvas-id="fallbackCanvas" class="hidden-canvas"
			style="position: absolute; left: -9999px; top: -9999px; width: 100px; height: 100px;"></canvas>
	</view>
</template>

<script setup>
	import {
		ref,
		watch,
		onMounted,
		onUnmounted
	} from 'vue';
	import {
		ButtonStore
	} from '@/store/button.js'
	import {
		userStore
	} from '@/store/index.js'
	import {
		getObjectUL
	} from '@/utils/readUL.js'
	import {
		idStore
	} from '@/store/idStorage';
	const props = defineProps({
		modelValue: {
			type: Array,
			default: () => []
		},
		limit: {
			type: Number,
			default: 20
		},
		currentSecondIndex: {
			type: Number,
			default: 0
		},
		currentSecondItem: {
			type: Object,
			default: () => ({})
		},
	});
	const userInfo = userStore()
	const buttonInfo = ButtonStore()
	const emit = defineEmits(['select', 'update:modelValue', 'delete', 'showPhotoInfo']);
	const idInfo = idStore();
	const actionSheetVisible = ref(false);
	const photoNumberVisible = ref(false);
	const photoNumber = ref('');

	/** 各端 scoped 穿透不可靠：字符串内联样式，背景带 !important 防父级覆盖 */
	const addSlotOuterStyle =
		'background-color:#F5F5F5 !important;border-radius:16rpx;border:1rpx solid #e0e0e0;box-sizing:border-box;overflow:hidden;';
	const addSlotInnerStyle = 'background-color:#F5F5F5 !important;width:100%;height:100%;';

	// 绘画相关变量
	const drawingVisible = ref(false);
	const currentEditingImage = ref('');
	const lastPoint = ref({
		x: 0,
		y: 0
	});
	const isDrawing = ref(false);
	const imageInfo = ref(null);
	const imageRatioValue = ref(1); // 保存图片的宽高比
	const drawingPoints = ref([]);
	const canvasContainerHeight = ref('600rpx');
	const isProcessing = ref(false); // 防重复点击标志
	const lastDrawTime = ref(0); // 上次绘制时间，用于节流
	const currentTool = ref('curve'); // 当前工具：curve、rect、line
	let drawingContext = null; // 全局画布上下文，避免重复创建

	// 撤销功能相关变量
	const strokeHistory = ref([]); // 存储每一笔的历史记录
	const currentStroke = ref([]); // 当前正在绘制的笔画
	//更新图片信息
	const updateButtonInfo = async () => {
		const data = await getObjectUL(userInfo.username, idInfo.buildingId);
		return data;
	}

	// 计算属性：根据索引获取对应的图片信息
	const getPhotoInfoText = (index) => {
		console.log('getPhotoInfoText 被调用，index:', index);
		console.log('props.currentItem:', props.currentSecondItem);

		// 直接使用当前菜单项的信息
		if (props.currentSecondItem && Array.isArray(props.currentSecondItem.information) &&
			index < props.currentSecondItem.information.length &&
			props.currentSecondItem.information[index]) {
			console.log('找到信息:', props.currentSecondItem.information[index]);
			return props.currentSecondItem.information[index];
		}
		return '请添加图片信息';
	}
	// 预览图片
	const previewImage = (index) => {
		uni.previewImage({
			current: index,
			urls: props.modelValue,
			indicator: 'number',
			loop: true
		});
	};

	// 显示底部弹出层
	const showActionSheet = () => {
		if (props.modelValue.length >= props.limit) {
			uni.showToast({
				title: `最多只能上传${props.limit}张图片`,
				icon: 'none'
			});
			return;
		}
		actionSheetVisible.value = true;
	};

	// 关闭底部弹出层
	const closeActionSheet = () => {
		actionSheetVisible.value = false;
	};

	// 显示图片信息
	const showPhotoInfo = (index) => {
		emit('showPhotoInfo', index);
		buttonInfo.reback();
	};

	// 添加selectedSecondIndex变量，用于存储当前选中的二级菜单索引
	// const selectedSecondIndex = ref(0);

	// 初始化时加载图片数据
	const initPhotoData = async () => {
		try {
			const data = await updateButtonInfo();
			if (data) {
				buttonInfo.setPhotoData(data);

				// 监听current-photo组件中的信息更新事件
				/*      uni.$on('photoInfoUpdated', (data) => {
				        // 更新按钮信息
				        buttonInfo.setPhotoData(data.structureData);
				        buttonInfo.setFirstIndex(data.firstIndex);
				        selectedSecondIndex.value = data.secondIndex;
				      });*/
			}
		} catch (error) {
			console.error('初始化图片数据失败:', error);
		}
	};

	// 组件挂载时初始化数据
	onMounted(() => {
		initPhotoData();
	});

	// 组件卸载时移除事件监听
	onUnmounted(() => {});

	// 处理图片选择成功
	const handleImageSuccess = (filePath) => {
		// 不再直接添加图片，而是打开绘图编辑弹窗
		currentEditingImage.value = filePath;
		openDrawingEditor(filePath);
	};

	// 打开绘图编辑器的函数
	const openDrawingEditor = (imagePath) => {
		// 设置当前编辑的图片
		currentEditingImage.value = imagePath;

		// 重置绘画相关变量
		drawingPoints.value = [];
		strokeHistory.value = [];
		currentStroke.value = [];
		isProcessing.value = false;
		uni.getImageInfo({
			src: imagePath,
			success: (res) => {
				imageInfo.value = res;
				const imageRatio = res.width / res.height;

				// 根据图片比例动态计算画布尺寸（限制在屏幕范围内）
				const screenInfo = uni.getSystemInfoSync();
				const maxWidth = screenInfo.windowWidth * 0.9;
				const maxHeight = (screenInfo.windowHeight - 80) * 0.9;

				let canvasWidth, canvasHeight;
				if (imageRatio > 1) { // 横屏图片
					canvasWidth = Math.min(maxWidth, maxHeight * imageRatio);
					canvasHeight = canvasWidth / imageRatio;
				} else { // 竖屏图片
					canvasHeight = Math.min(maxHeight, maxWidth / imageRatio);
					canvasWidth = canvasHeight * imageRatio;
				}

				canvasContainerWidth.value = `${canvasWidth}px`;
				canvasContainerHeight.value = `${canvasHeight}px`;
				imageRatioValue.value = imageRatio;

				// 显示绘图弹窗
				drawingVisible.value = true;
				setTimeout(() => initDrawingCanvas(imagePath), 300);
			}
		});
		// 获取图片信息，以便正确设置画布大小
		// uni.getImageInfo({
		// 	src: imagePath,
		// 	success: (res) => {
		// 		imageInfo.value = res;

		// 		// 获取原始图片大小信息
		// 		uni.getFileInfo({
		// 			filePath: imagePath,
		// 			success: (fileInfo) => {
		// 				// 保存原始图片大小，用于后续比较
		// 				imageInfo.value.size = fileInfo.size;
		// 				console.log('原始图片大小:', fileInfo.size / 1024, 'KB');
		// 			}
		// 		});
		// 		// 计算目标分辨率比例 (1024x768 = 4:3)
		// 		const targetRatio = 4 / 3;
		// 		const imageRatio = res.width / res.height;
		// 		// 获取屏幕尺寸
		// 		const screenInfo = uni.getSystemInfoSync();
		// 		const maxWidth = screenInfo.windowWidth * 0.9;
		// 		const maxHeight = (screenInfo.windowHeight - 80) * 0.9; // 减去标题和按钮高度
		// 		// 计算可用高度（屏幕高度减去标题和按钮区域的高度）
		// 		// const buttonsHeight = 60; // 底部按钮区域高度
		// 		// const titleHeight = 20; // 顶部标题高度
		// 		// const availableHeight = screenInfo.windowHeight - (buttonsHeight + titleHeight);

		// 		// // 计算图片的宽高比
		// 		// const imageRatio = res.height / res.width;

		// 		// 计算适合屏幕的画布尺寸，确保图片完全显示
		// 		let canvasWidth, canvasHeight;

		// 		// 根据图片比例调整，确保完整显示
		// 		if (imageRatio > targetRatio) {
		// 			// 图片比目标更宽，以宽度为基准
		// 			canvasWidth = Math.min(maxWidth, maxHeight * targetRatio);
		// 			canvasHeight = canvasWidth / targetRatio;
		// 		} else {
		// 			// 图片比目标更高，以高度为基准
		// 			canvasHeight = Math.min(maxHeight, maxWidth / targetRatio);
		// 			canvasWidth = canvasHeight * targetRatio;
		// 		}



		// 		// 设置画布容器尺寸，确保图片完全显示
		// 		canvasContainerWidth.value = `${canvasWidth}px`;
		// 		canvasContainerHeight.value = `${canvasHeight}px`;

		// 		// 保存原始图片比例，用于后续绘制
		// 		imageRatioValue.value = imageRatio;

		// 		// 显示绘图弹窗
		// 		drawingVisible.value = true;

		// 		// 在下一个渲染周期初始化画布
		// 		setTimeout(() => {
		// 			initDrawingCanvas(imagePath);
		// 		}, 300);
		// 	},
		// 	fail: (err) => {
		// 		console.error('获取图片信息失败:', err);
		// 		uni.showToast({
		// 			title: '无法加载图片',
		// 			icon: 'none'
		// 		});
		// 	}
		// });
	};

	// 初始化绘图画布 - 确保图片完整显示
	const initDrawingCanvas = (imagePath) => {
		// 创建画布上下文
		drawingContext = uni.createCanvasContext('drawingCanvas');

		// 填充白色背景，避免透明区域
		drawingContext.fillStyle = '#FFFFFF';
		drawingContext.fillRect(0, 0, 9999, 9999);

		// 绘制背景图片
		if (imageInfo.value) {
			const {
				width: imgWidth,
				height: imgHeight
			} = imageInfo.value;
			// 获取画布容器的尺寸
			const containerWidth = parseFloat(canvasContainerWidth.value);
			const containerHeight = parseFloat(canvasContainerHeight.value);

			// 计算图片在容器中的绘制尺寸和位置
			let drawWidth, drawHeight;
			// 判断是竖屏还是横屏
			if (imgWidth / imgHeight > containerWidth / containerHeight) {
				// 图片比画布更宽，以宽度为基准
				drawWidth = containerWidth;
				drawHeight = drawWidth * (imgHeight / imgWidth);
			} else {
				// 图片比画布更高，以高度为基准
				drawHeight = containerHeight;
				drawWidth = drawHeight * (imgWidth / imgHeight);
			}

			// 居中绘制
			const offsetX = (containerWidth - drawWidth) / 2;
			const offsetY = (containerHeight - drawHeight) / 2;
			// if (height > width) { // 竖屏照片
			// 	// 以高度为基准，保持比例
			// 	drawHeight = 1024
			// 	drawWidth = 768
			// } else { // 横屏照片
			// 	// 以宽度为基准，保持比例
			// 	drawWidth = 1024
			// 	drawHeight = 768
			// }
			// // 对所有图片使用统一的绘制逻辑，确保完整显示
			// drawWidth = containerWidth;
			// drawHeight = containerHeight;

			// 绘制图片作为背景，使用计算的尺寸
			console.log("imagePath", imagePath);
			drawingContext.drawImage(imagePath, 0, 0, drawWidth, drawHeight);
			drawingContext.draw();

			// 保存绘制参数，用于后续重绘
			imageDrawParams.value = {
				x: 0,
				y: 0,
				width: drawWidth,
				height: drawHeight
			};
		}
	};

	// 添加一个ref存储图片绘制参数
	const imageDrawParams = ref({
		x: 0,
		y: 0,
		width: 0,
		height: 0
	});

	// 添加一个ref存储画布宽度
	const canvasContainerWidth = ref('100%');

	// 触摸开始事件
	const touchStart = (e) => {
		isDrawing.value = true;
		const touch = e.touches[0];
		lastPoint.value = {
			x: touch.x,
			y: touch.y
		};

		// 记录新的笔画
		currentStroke.value = {
			tool: currentTool.value,
			points: [{ x: touch.x, y: touch.y }],
			startX: touch.x,
			startY: touch.y,
			endX: touch.x,
			endY: touch.y
		};
	};

	// 触摸移动事件
	const touchMove = (e) => {
		if (!isDrawing.value) return;

		const touch = e.touches[0];
		const currentPoint = {
			x: touch.x,
			y: touch.y
		};

		// 节流处理，避免过多绘制点导致性能问题
		const now = Date.now();
		if (now - lastDrawTime.value < 16) return; // 约60fps
		lastDrawTime.value = now;

		if (currentTool.value === 'curve') {
			// 记录当前点
			currentStroke.value.points.push(currentPoint);

			// 绘制线条
			drawingContext.beginPath();
			drawingContext.lineWidth = 3;
			drawingContext.lineCap = 'round';
			drawingContext.lineJoin = 'round';
			drawingContext.strokeStyle = '#FF0000'; // 红色线条

			drawingContext.moveTo(lastPoint.value.x, lastPoint.value.y);
			drawingContext.lineTo(currentPoint.x, currentPoint.y);
			drawingContext.stroke();
			drawingContext.draw(true);
		} else {
			// 对于矩形和直线
			currentStroke.value.endX = currentPoint.x;
			currentStroke.value.endY = currentPoint.y;

			// 重绘画布和所有历史，再加上当前的形状
			internalRedrawCanvas(true);
		}

		// 更新最后一个点
		lastPoint.value = currentPoint;
	};

	// 抽出内部重绘方法
	const internalRedrawCanvas = (drawCurrent = false) => {
		if (!drawingContext || !currentEditingImage.value) return;

		// 清除画布
		drawingContext.clearRect(0, 0, 9999, 9999);

		// 重新绘制背景图片
		if (imageInfo.value && imageDrawParams.value) {
			const {
				width: drawWidth,
				height: drawHeight
			} = imageDrawParams.value;

			drawingContext.drawImage(currentEditingImage.value, 0, 0, drawWidth, drawHeight);
		}

		drawingContext.lineWidth = 3;
		drawingContext.lineCap = 'round';
		drawingContext.lineJoin = 'round';
		drawingContext.strokeStyle = '#FF0000';

		// 重新绘制所有笔画
		const drawStroke = (stroke) => {
			if (!stroke) return;

			// 兼容旧的历史记录格式（如果存在纯数组的旧数据）
			if (Array.isArray(stroke)) {
				if (stroke.length < 2) return;
				drawingContext.beginPath();
				drawingContext.moveTo(stroke[0].x, stroke[0].y);
				for (let i = 1; i < stroke.length; i++) {
					drawingContext.lineTo(stroke[i].x, stroke[i].y);
				}
				drawingContext.stroke();
				return;
			}

			const tool = stroke.tool;
			drawingContext.beginPath();

			if (tool === 'curve') {
				if (!stroke.points || stroke.points.length < 2) return;
				drawingContext.moveTo(stroke.points[0].x, stroke.points[0].y);
				for (let i = 1; i < stroke.points.length; i++) {
					drawingContext.lineTo(stroke.points[i].x, stroke.points[i].y);
				}
				drawingContext.stroke();
			} else if (tool === 'rect') {
				const x = Math.min(stroke.startX, stroke.endX);
				const y = Math.min(stroke.startY, stroke.endY);
				const w = Math.abs(stroke.startX - stroke.endX);
				const h = Math.abs(stroke.startY - stroke.endY);
				drawingContext.strokeRect(x, y, w, h);
			} else if (tool === 'line') {
				drawingContext.moveTo(stroke.startX, stroke.startY);
				drawingContext.lineTo(stroke.endX, stroke.endY);
				drawingContext.stroke();
			}
		};

		strokeHistory.value.forEach(stroke => drawStroke(stroke));

		if (drawCurrent && currentStroke.value) {
			drawStroke(currentStroke.value);
		}

		drawingContext.draw(false);
	};

	// 触摸结束事件
	const touchEnd = () => {
		if (!isDrawing.value) return;

		isDrawing.value = false;

		// 保存当前笔画到历史记录
		if (currentTool.value === 'curve') {
			if (currentStroke.value.points && currentStroke.value.points.length > 1) {
				// 深度拷贝当前笔画
				strokeHistory.value.push({
					tool: 'curve',
					points: [...currentStroke.value.points]
				});
			}
		} else {
			// 矩形和直线
			if (currentStroke.value.startX !== currentStroke.value.endX || currentStroke.value.startY !== currentStroke.value.endY) {
				strokeHistory.value.push({
					tool: currentTool.value,
					startX: currentStroke.value.startX,
					startY: currentStroke.value.startY,
					endX: currentStroke.value.endX,
					endY: currentStroke.value.endY
				});
				internalRedrawCanvas(false); // 固定当前笔画
			}
		}
		currentStroke.value = null;
	};

	// 撤销最后一笔
	const undoLastStroke = () => {
		if (strokeHistory.value.length === 0) return;

		// 移除最后一笔
		strokeHistory.value.pop();

		// 重新绘制所有内容
		internalRedrawCanvas(false);
	};

	// 重新绘制画布
	const redrawCanvas = () => {
		internalRedrawCanvas(false);
	};

	// 取消绘图
	const cancelDrawing = () => {
		drawingVisible.value = false;
		currentEditingImage.value = '';
		strokeHistory.value = [];
	};

	// 确认绘图
	const confirmDrawing = () => {
		if (isProcessing.value) return;
		isProcessing.value = true;

		uni.showLoading({
			title: '处理中...'
		});
		// 获取目标尺寸
		let targetWidth, targetHeight;
		if (imageInfo.value.height > imageInfo.value.width) { // 竖屏照片
			targetWidth = 768;
			targetHeight = 1024;
		} else { // 横屏照片
			targetWidth = 1024;
			targetHeight = 768;
		}


		// 导出画布内容，使用原始图片尺寸
		uni.canvasToTempFilePath({
			canvasId: 'drawingCanvas',
			x: 0,
			y: 0,
			width: imageDrawParams.value.width,
			height: imageDrawParams.value.height,
			// 使用原始图片尺寸，确保不变形
			destWidth: targetWidth, // 强制宽度为1024
			destHeight: targetHeight, // 强制高度为768
			fileType: 'jpg',
			quality: 0.9,
			success: (res) => {
				// 检查导出图片大小
				uni.getFileInfo({
					filePath: res.tempFilePath,
					success: (fileInfo) => {
						console.log('画布导出图片大小:', fileInfo.size / 1024, 'KB');

						// // 如果导出图片大于原图，尝试使用原图+压缩
						// if (imageInfo.value.size && fileInfo.size > imageInfo.value.size * 1.2) {
						// 	console.log('导出图片大于原图120%，尝试直接压缩原图');
						// 	// 如果没有绘制任何内容，直接使用原图
						// 	if (strokeHistory.value.length === 0) {
						// 		compressImage(currentEditingImage.value).then(compressedPath => {
						// 			addImageToCollection(compressedPath);
						// 		}).catch(err => {
						// 			handleCompressionError(err);
						// 		});
						// 		return;
						// 	}
						// }

						// 正常压缩导出的图片
						compressImage(res.tempFilePath).then(compressedPath => {
							addImageToCollection(compressedPath);
						}).catch(err => {
							handleCompressionError(err);
						});
					},
					fail: () => {
						// 如果获取文件信息失败，继续正常压缩流程
						compressImage(res.tempFilePath).then(compressedPath => {
							addImageToCollection(compressedPath);
						}).catch(err => {
							handleCompressionError(err);
						});
					}
				});
			},
			fail: (err) => {
				console.error('保存编辑后的图片失败:', err);
				uni.hideLoading();
				uni.showToast({
					title: '保存失败',
					icon: 'none'
				});
				isProcessing.value = false;
			}
		});
	};

	// 添加图片到集合
	const addImageToCollection = (imagePath) => {
		const newImages = [...props.modelValue, imagePath];
		emit('update:modelValue', newImages);
		emit('select', '');

		uni.hideLoading();
		uni.showToast({
			title: '图片已添加',
			icon: 'success'
		});

		// 关闭绘图弹窗
		drawingVisible.value = false;
		isProcessing.value = false;
	};

	// 处理压缩错误
	const handleCompressionError = (err) => {
		console.error('压缩图片失败:', err);
		uni.hideLoading();
		uni.showToast({
			title: '处理图片失败',
			icon: 'none'
		});
		isProcessing.value = false;
	};

	const compressImage = (imagePath) => {
		return new Promise((resolve, reject) => {
			// 先获取图片信息
			uni.getImageInfo({
				src: imagePath,
				success: (info) => {
					let targetWidth, targetHeight;
					// 判断是竖屏还是横屏
					if (info.height > info.width) { // 竖屏照片
						// 长边设置为1024，短边按比例缩放
						targetWidth = 768;
						targetHeight = 1024;
					} else { // 横屏照片
						// 短边设置为1024，长边也设置为768
						targetWidth = 1024;
						targetHeight = 768;
					}
					// 如果图片已经是目标尺寸且小于一定大小，直接返回
					if (info.width === targetWidth && info.height === targetHeight) {
						uni.getFileInfo({
							filePath: imagePath,
							success: (fileInfo) => {
								if (fileInfo.size <= 800 * 1024) {
									resolve(imagePath);
									return;
								}
								// 如果太大但分辨率正确，只压缩质量
								uni.compressImage({
									src: imagePath,
									quality: 80,
									success: (res) => resolve(res
										.tempFilePath),
									fail: () => resolve(imagePath)
								});
							}
						});
						return;
					}

					// 如果分辨率不对，需要重新调整
					const context = uni.createCanvasContext('fallbackCanvas');
					context.drawImage(imagePath, 0, 0, 1024, 768);
					context.draw(false, () => {
						uni.canvasToTempFilePath({
							canvasId: 'fallbackCanvas',
							destWidth: 1024,
							destHeight: 768,
							fileType: 'jpg',
							quality: 0.85,
							success: (res) => resolve(res.tempFilePath),
							fail: () => resolve(imagePath)
						});
					});
				},
				fail: () => {
					// 获取信息失败时直接返回原图
					resolve(imagePath);
				}
			});
		});
	};

	// // 添加图片压缩功能 - 优化速度版本
	// const compressImage = (imagePath) => {
	// 	return new Promise((resolve, reject) => {
	// 		// 先获取图片信息，检查大小
	// 		uni.getFileInfo({
	// 			src:imagePath
	// 			success: (info) => {
	// 				 if (info.width === 1024 && info.height === 768) {
	// 						uni.getFileInfo({
	// 							filePath: imagePath,
	// 							success: (fileInfo) => {
	// 								if (fileInfo.size <= 800 * 1024) {
	// 									resolve(imagePath);
	// 									return;
	// 								}
	// 				// // 如果图片已经小于800KB，直接返回原图
	// 				// if (fileInfo.size <= 800 * 1024) {
	// 				// 	console.log('图片已经小于800KB，无需压缩');
	// 				// 	resolve(imagePath);
	// 				// 	return;
	// 				// }

	// 				// 快速压缩 - 使用较高质量但降低分辨率
	// 				uni.compressImage({
	// 					src: imagePath,
	// 					quality: 80, // 使用80%的质量，保持较好的图片质量
	// 					compressedWidth: 1280, // 限制最大宽度为1280px，足够大多数显示场景
	// 					success: (res) => {
	// 						console.log('压缩完成');
	// 						resolve(res.tempFilePath);
	// 					},

	// 					fail: (err) => {
	// 						console.error('压缩图片失败:', err);
	// 						// 压缩失败则返回原图
	// 						resolve(imagePath);
	// 					}
	// 				});
	// 			},
	// 			fail: (err) => {
	// 				console.error('获取图片信息失败:', err);
	// 				// 如果获取信息失败，尝试直接压缩
	// 				uni.compressImage({
	// 					src: imagePath,
	// 					quality: 80,
	// 					compressedWidth: 1280,
	// 					success: (res) => resolve(res.tempFilePath),
	// 					fail: () => resolve(imagePath) // 失败则使用原图
	// 				});
	// 			}
	// 		});
	// 	});
	// };

	// 移除不需要的复杂压缩函数
	// const compressWithQuality = (imagePath, quality) => { ... };
	// const canvasCompressImage = (imagePath) => { ... };

	// 拍摄照片
	const takePhoto = () => {
		closeActionSheet();
		uni.chooseImage({
			count: 1,
			sourceType: ['camera'],
			sizeType: ['original'],
			success: (res) => {
				// 不再直接调用handleImageSuccess，而是打开绘图编辑器
				handleImageSuccess(res.tempFilePaths[0]);
			},
			fail: (err) => {
				console.error('拍照失败:', err);
				uni.showToast({
					title: '拍照失败',
					icon: 'none'
				});
			}
		});
	};

	// 从相册选取
	const chooseFromAlbum = () => {
		closeActionSheet();
		uni.chooseImage({
			count: 1,
			sourceType: ['album'],
			sizeType: ['original'],
			success: (res) => {
				// 不再直接调用handleImageSuccess，而是打开绘图编辑器
				handleImageSuccess(res.tempFilePaths[0]);
			},
			fail: (err) => {
				console.error('选择照片失败:', err);
				uni.showToast({
					title: '选择照片失败',
					icon: 'none'
				});
			}
		});
	};

	// 显示照片序号输入弹窗
	const showPhotoNumberInput = () => {
		closeActionSheet();
		photoNumberVisible.value = true;
		photoNumber.value = '';
	};

	// 取消照片序号输入
	const cancelPhotoNumber = () => {
		photoNumberVisible.value = false;
		photoNumber.value = '';
	};

	// 确认照片序号输入
	const confirmPhotoNumber = async () => {
		if (photoNumber.value.trim()) {
			try {
				uni.showLoading({
					title: '正在生成图片...'
				});

				// 生成带数字的图片
				const numberedImagePath = await generateNumberedImage(photoNumber.value);
				console.log('numberedImagePath', numberedImagePath);

				uni.hideLoading();

				if (numberedImagePath) {
					// 将生成的图片添加到图片列表中
					const newImages = [...props.modelValue, numberedImagePath];
					emit('update:modelValue', newImages);
					emit('select', photoNumber.value);

					uni.showToast({
						title: `已生成序号${photoNumber.value}的图片`,
						icon: 'success'
					});
				} else {
					uni.showToast({
						title: '生成图片失败',
						icon: 'none'
					});
				}
			} catch (error) {
				uni.hideLoading();
				console.error('生成数字图片失败:', error);
				uni.showToast({
					title: '生成图片失败',
					icon: 'none'
				});
			}

			photoNumberVisible.value = false;
			photoNumber.value = '';
		} else {
			uni.showToast({
				title: '请输入照片序号',
				icon: 'none'
			});
		}
	};

	// 为每个组件实例生成唯一的Canvas ID
	const canvasId = ref(`numberCanvas_${Date.now()}_${Math.floor(Math.random() * 1000)}`);

	// 生成带数字的图片
	const generateNumberedImage = (number) => {
		return new Promise((resolve) => {
			try {
				// 创建画布上下文
				const context = uni.createCanvasContext(canvasId.value);
				const size = 200;
				const baseFontSize = 80;
				// 绘制背景
				context.setFillStyle('#f0f0f0');
				context.fillRect(0, 0, size, size);
				let fontSize = baseFontSize;
				//text.length = 4 使用默认字体大小
				//每多一位 减少4px
				if (number.length <= 4) {
					fontSize = baseFontSize;
				} else if (number.length > 4 && number.length <= 6) {
					fontSize = 54;
				} else if (number.length > 6 && number.length <= 8) {
					fontSize = 40;
				} else if (number.length > 8 && number.length <= 10) {
					fontSize = 26;
				} else {
					fontSize = 16;
				}
				// 绘制数字
				context.setFillStyle('#333');
				context.setFontSize(fontSize);
				context.setTextAlign('center');
				context.setTextBaseline('middle');
				context.fillText(number, size / 2, size / 2);

				// 绘制边框
				context.setStrokeStyle('#ccc');
				context.setLineWidth(2);
				context.strokeRect(0, 0, size, size);

				// 将画布内容转为图片
				context.draw(false, () => {
					uni.canvasToTempFilePath({
						canvasId: canvasId.value,
						success: (res) => {
							console.log('生成图片成功', res.tempFilePath);
							// 数字图片通常很小，无需压缩
							resolve(res.tempFilePath);
						},
						fail: (err) => {
							console.error('生成数字图片失败:', err);
							// 失败时尝试创建一个备用的纯色图片
							createFallbackImage(number).then(fallbackPath => {
								resolve(fallbackPath);
							});
						}
					});
				});
			} catch (error) {
				console.error('Canvas创建失败:', error);
				// 出错时创建备用图片
				createFallbackImage(number).then(fallbackPath => {
					resolve(fallbackPath);
				});
			}
		});
	};

	// 创建备用图片（当Canvas方法失败时使用）
	const createFallbackImage = (number) => {
		return new Promise((resolve) => {
			// 使用uni-app提供的绘制API创建一个简单的带数字的图片
			const context = uni.createCanvasContext('fallbackCanvas');
			const size = 100;

			context.setFillStyle('#f0f0f0');
			context.fillRect(0, 0, size, size);

			context.setFillStyle('#333');
			context.setFontSize(40);
			context.setTextAlign('center');
			context.setTextBaseline('middle');
			context.fillText(number, size / 2, size / 2);

			context.draw(true, () => {
				uni.canvasToTempFilePath({
					canvasId: 'fallbackCanvas',
					success: (res) => {
						console.log('备用图片生成成功', res.tempFilePath);
						resolve(res.tempFilePath);
					},
					fail: () => {
						// 如果备用方法也失败，返回null
						console.error('备用图片也生成失败');
						resolve(null);
					}
				});
			});
		});
	};

	// 删除图片
	const deleteImage = (idx) => {
		const deletedImage = props.modelValue[idx];
		const newImages = [...props.modelValue];
		newImages.splice(idx, 1);
		emit('update:modelValue', newImages);
		emit('delete', {
			index: idx,
			image: deletedImage
		});
	};
</script>

<style scoped>
	.photo-picker {
		box-sizing: border-box;
		position: relative;
		/* 与添加格 #F5F5F5 区分，否则方卡与底同色「看不见」 */
		background-color: transparent;
	}

	.preview-list {
		display: flex;
		flex-wrap: wrap;
		gap: 20rpx;
		justify-content: flex-start;
		background-color: transparent;
		/* 关键：左对齐 */
	}

	.photo-item-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 200rpx;
		margin-bottom: 20rpx;
	}

	.preview-image {
		width: 100%;
		height: 100%;
		border-radius: 0;
		object-fit: contain;
		object-position: center;
		min-width: 100%;
		min-height: 100%;
		background-color: #ffffff;
	}

	.empty-preview {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	.add-upload-slot {
		display: flex;
		width: 100%;
		height: 100%;
		box-sizing: border-box;
		align-items: center;
		justify-content: center;
		background-color: #F5F5F5;
	}

	/* 添加槽内加号：约占方卡约 1/5，细线、中灰 */
	.preview-container.preview-container--add .plus-icon {
		width: 36rpx;
		height: 36rpx;
		position: relative;
		flex-shrink: 0;
	}

	.preview-container.preview-container--add .plus-icon::before,
	.preview-container.preview-container--add .plus-icon::after {
		content: '';
		position: absolute;
		background-color: #b8bcc4;
		border-radius: 1rpx;
	}

	.preview-container.preview-container--add .plus-icon::before {
		left: 50%;
		top: 0;
		width: 2rpx;
		height: 100%;
		transform: translateX(-50%);
	}

	.preview-container.preview-container--add .plus-icon::after {
		top: 50%;
		left: 0;
		width: 100%;
		height: 2rpx;
		transform: translateY(-50%);
	}

	/* 图片信息按钮包装器 */
	.info-button-wrapper {
		width: 200rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-top: 10rpx;
	}

	.info-button {
		width: 100%;
		min-width: 180rpx;
		padding: 0 10rpx;
		font-size: 18rpx;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.info-text {
		font-size: 24rpx;
		color: #333;
	}

	.delete-icon {
		position: absolute;
		top: -5%;
		right: -5%;
		background-color: #999;
		color: white;
		width: 22rpx;
		height: 22rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 20rpx;
		z-index: 1;
		cursor: pointer;
	}

	.action-sheet {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 1000;
		box-sizing: border-box;
		/* 仅用于与遮罩/内容叠层，不再用 bottom 定位整块 */
		width: 100%;
		margin: 0;
		padding: 0;
		/* 内容贴底、距底 1/8 屏+安全区，由 .action-sheet-content 自身定位 */
		pointer-events: none;
	}

	.action-sheet-content {
		position: fixed;
		left: 10%;
		right: 10%;
		width: auto;
		/* 距底约 1/8 屏高；刘海机再加上安全区 */
		bottom: calc(12.5vh + constant(safe-area-inset-bottom));
		bottom: calc(12.5vh + env(safe-area-inset-bottom, 0px));
		z-index: 1;
		pointer-events: auto;
		margin: 0;
		padding: 0;
		box-sizing: border-box;
		/* 行间隙用白底，露出的是「白线」；若用透明会透出黑蒙层，整体灰会发暗、和 #D9D9D9 对不齐 */
		background-color: #ffffff;
		display: flex;
		flex-direction: column;
		gap: 2rpx;
		border-radius: 0;
		overflow: hidden;
		animation: slideUp 0.3s ease;
	}

	@keyframes slideUp {
		from {
			transform: translateY(100%);
		}

		to {
			transform: translateY(0);
		}
	}

	.action-sheet-title {
		padding: 30rpx 0;
		text-align: center;
		font-size: 34rpx;
		color: #333;
		border-bottom: 2rpx solid #f0f0f0;
	}

	.action-sheet-item {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		margin: 0;
		/* 与 20rpx 字配套，留足可点按高度 */
		padding: 8rpx 0;
		min-height: 0;
		box-sizing: border-box;
		background-color: #d9d9d9;
		border: none;
		/* 与现状照-桥址周边环境「情况描述」标题（.surroundings-desc-title-text）一致 */
		font-size: 20rpx;
		line-height: 1.3;
	}

	.action-sheet-item text {
		font-size: 20rpx;
		color: #0f4687;
		text-align: center;
	}

	.sheet-icon {
		width: 40rpx;
		height: 20rpx;
		margin-right: 20rpx;
		font-size: 18px;
	}

	.action-sheet-cancel {
		padding: 15rpx 0;
		text-align: center;
		margin-top: 10rpx;
		background-color: white;
		color: #007aff;
		font-size: 18px;
		height: 20rpx;
	}

	.action-sheet-mask {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		/* 不压暗页面，仅做点击空白关窗的透明层 */
		background-color: transparent;
		z-index: 0;
		pointer-events: auto;
	}

	/* 照片序号输入弹窗样式 */
	.photo-number-popup {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 2000;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.photo-number-content {
		background-color: white;
		border-radius: 16rpx;
		padding: 27rpx;
		width: 53%;
		max-width: 400rpx;
	}

	.popup-title {
		font-size: 20rpx;
		text-align: center;
		color: #0F4687;
		background-color: #BDCBE0;
		padding: 15rpx 0;
		margin: 0;
		font-weight: bold;
		letter-spacing: 1rpx;
	}

	.input-container {
		margin-bottom: 27rpx;
	}

	.photo-number-input {
		width: 100%;
		height: 53rpx;
		border: 2rpx solid #ddd;
		border-radius: 8rpx;
		padding: 0 13rpx;
		font-size: 21rpx;
		box-sizing: border-box;
	}

	.popup-buttons {
		display: flex;
		justify-content: center;
		gap: 20rpx;
		padding: 30rpx 20rpx;
		background-color: white;
		border-top: 1rpx solid #eee;
	}

	.btn {
		width: 160rpx;
		height: 40rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 8rpx;
		font-size: 16rpx;
	}

	.cancel-btn {
		background-color: #F5F5f5;
		color: #1677FF;
	}

	.confirm-btn {
		background-color: #007aff;
		color: white;
	}

	.undo-btn {
		background-color: #ff9500;
		color: white;
	}

	.btn-disabled {
		background-color: #ccc !important;
		color: #999 !important;
		pointer-events: none;
	}

	.popup-mask {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: -1;
	}

	/* 修改图片预览模式为填充 */
	.preview-image {
		width: 100%;
		height: 100%;
		border-radius: 8rpx;
		object-fit: cover;
	}

	/* 调整预览容器尺寸：已选图为白底；「上传」方格为 #F5F5F5（勿用统一 .preview-container 白底盖住添加槽） */
	.preview-container:not(.preview-container--add) {
		position: relative;
		width: 200rpx;
		height: 200rpx;
		min-width: 200rpx;
		min-height: 200rpx;
		max-width: 200rpx;
		max-height: 200rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #ffffff;
		cursor: pointer;
		box-sizing: border-box;
		border-radius: 8rpx;
	}

	.preview-container.preview-container--add {
		position: relative;
		width: 200rpx;
		height: 200rpx;
		min-width: 200rpx;
		min-height: 200rpx;
		max-width: 200rpx;
		max-height: 200rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #F5F5F5 !important;
		border-radius: 16rpx !important;
		border: 1rpx solid #e8e8e8 !important;
		box-sizing: border-box !important;
		overflow: hidden;
		cursor: pointer;
	}

	.image-index {
		position: absolute;
		top: 8rpx;
		left: 8rpx;
		background-color: rgba(0, 0, 0, 0.6);
		color: white;
		padding: 4rpx 10rpx;
		border-radius: 20rpx;
		font-size: 22rpx;
		z-index: 2;
	}

	/* 绘画编辑弹窗样式 */
	.drawing-popup {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 2000;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background-color: rgba(0, 0, 0, 0.7);
		padding: 0;
	}

	.drawing-content {
		background-color: white;
		width: auto;
		/* 改为自适应宽度 */
		height: auto;
		/* 改为自适应高度 */
		max-width: 100vw;
		max-height: 100vh;
		display: flex;
		flex-direction: column;
		overflow: visible;
		/* 改为可见，不裁剪内容 */
		padding-top: 0;
	}

	.canvas-container {
		position: relative;
		background-color: #ffffff;
		margin: 0;
		padding: 0;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: visible;
		/* 改为可见，不裁剪内容 */
	}

	.drawing-canvas {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 2;
	}

	.popup-title {
		font-size: 18rpx !important;
		text-align: center;
		color: #0F4687;
		background-color: #BDCBE0;
		padding: 0 !important;
		margin: 0;
		font-weight: bold;
		letter-spacing: 1rpx;
		flex-shrink: 0;
		/* 防止标题被压缩 */
		height: 40rpx !important;
		/* 将标题高度从40px缩小到20px */
		line-height: 40rpx !important;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 40rpx !important;
		max-height: 40rpx !important;
	}

	.popup-buttons {
		display: flex;
		justify-content: center;
		gap: 20rpx;
		padding: 10rpx;
		background-color: white;
		border-top: 1rpx solid #eee;
		flex-shrink: 0;
		/* 防止按钮被压缩 */
		height: 60px !important;
		/* 将按钮区域高度从80px减小到60px */
		align-items: center;
	}

	.drawing-toolbar {
		display: flex;
		justify-content: center;
		gap: 20rpx;
		padding: 15rpx 0;
		background-color: #f5f5f5;
		border-bottom: 1rpx solid #ddd;
	}

	.tool-item {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		border-radius: 8rpx;
		border: 2rpx solid transparent;
		background-color: #fff;
		box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
	}

	.tool-item.active {
		border-color: #007aff;
		background-color: #e6f2ff;
		box-shadow: inset 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
	}

	.tool-icon {
		width: 40rpx;
		height: 40rpx;
		object-fit: contain;
	}

	/* 移除之前的 brightness filter，改用更好的样式 */
	/* .active .tool-icon {
		filter: brightness(1.2);
	} */

	/* 手机端适配 */
	@media (max-width: 599px) {
		.preview-list {
			justify-content: center;
		}
	}
</style>


