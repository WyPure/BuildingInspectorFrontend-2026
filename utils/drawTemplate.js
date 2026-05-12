/*
	开发者：郭明晓 
	功能：绘制简图模板
	最后修改日期：2025年6月7日
*/

//空心板 实心板
function drawKxbTemplate1(ctx, {
	logicalWidth = 8,
	logicalHeight = 8,
	unit = 'm',
	qt = 0
}) {
	const systemInfo = uni.getSystemInfoSync();
	const centerX = systemInfo.screenWidth / 2;
	const centerY = systemInfo.screenHeight / 2;
	const screenWidth = systemInfo.screenWidth;
	const screenHeight = systemInfo.screenHeight;
	const showDirectionArrow = qt == 0 ? true : false;
	const MAX_DRAW_WIDTH = 800; // 宽高对调
	const MAX_DRAW_HEIGHT = 400;

	// 计算缩放比例（按最大宽度优先）
	let scale = MAX_DRAW_WIDTH / logicalWidth;
	let drawWidth = MAX_DRAW_WIDTH;
	let drawHeight = logicalHeight * scale;

	if (drawHeight > MAX_DRAW_HEIGHT) {
		scale = MAX_DRAW_HEIGHT / logicalHeight;
		drawHeight = MAX_DRAW_HEIGHT;
		drawWidth = logicalWidth * scale;
	}

	// 旋转前先平移坐标原点（注意是以画布中心为轴旋转）

	// ctx.translate(centerX, centerY);
	// ctx.rotate(90 * Math.PI / 180); // 顺时针旋转 90°
	// ctx.translate(-centerY, -centerX); // 注意这里 y/x 互换


	// console.log('屏幕宽度:', systemInfo.screenWidth);
	// console.log('屏幕高度:', systemInfo.screenHeight);
	// 新的起点（旋转后坐标）
	const x = (systemInfo.screenWidth - drawWidth) / 2;
	const y = (systemInfo.screenHeight - drawHeight) / 2;

	const rulerGap = 10;
	const minPixelPerUnit = 40;

	// 刻度步长
	let unitStepX = 1;
	while ((unitStepX * scale) < minPixelPerUnit) unitStepX++;
	let unitStepY = 1;
	while ((unitStepY * scale) < minPixelPerUnit) unitStepY++;

	ctx.setLineWidth(1);
	ctx.setStrokeStyle('#333');
	ctx.setFontSize(12);

	// 主矩形
	ctx.strokeRect(x, y, drawWidth, drawHeight);

	if (qt == 2) {
		ctx.beginPath();
		ctx.moveTo(x, y + scale / 2);
		ctx.lineTo(x + drawWidth, y + scale / 2);
		ctx.stroke();
	}

	// 上边（逻辑 X 轴）刻度
	ctx.beginPath();
	ctx.moveTo(x, y - rulerGap);
	ctx.lineTo(x + drawWidth, y - rulerGap);
	ctx.stroke();
	for (let i = 0; i <= logicalWidth; i += unitStepX) {
		const px = x + i * scale;
		const py = y - rulerGap;
		ctx.beginPath();
		ctx.moveTo(px, py);
		ctx.lineTo(px, py - 8);
		ctx.stroke();
		ctx.fillText(`${i}${unit}`, px - 10, py - 12);
	}
	if (logicalWidth % unitStepX !== 0) {
		const px = x + logicalWidth * scale;
		const py = y - rulerGap;
		ctx.beginPath();
		ctx.moveTo(px, py);
		ctx.lineTo(px, py - 8);
		ctx.stroke();
		ctx.fillText(`${logicalWidth}${unit}`, px - 10, py - 12);
	}

	// 右边（逻辑 Y 轴）刻度
	ctx.beginPath();
	ctx.moveTo(x + drawWidth + rulerGap, y);
	ctx.lineTo(x + drawWidth + rulerGap, y + drawHeight);
	ctx.stroke();
	for (let i = 0; i <= logicalHeight; i += unitStepY) {
		const py = y + i * scale;
		const px = x + drawWidth + rulerGap;
		ctx.beginPath();
		ctx.moveTo(px, py);
		ctx.lineTo(px + 8, py);
		ctx.stroke();
		ctx.fillText(`${i}${unit}`, px + 10, py + 5);
	}
	if (logicalHeight % unitStepY !== 0) {
		const py = y + logicalHeight * scale;
		const px = x + drawWidth + rulerGap;
		ctx.beginPath();
		ctx.moveTo(px, py);
		ctx.lineTo(px + 8, py);
		ctx.stroke();
		ctx.fillText(`${logicalHeight}${unit}`, px + 10, py + 5);
	}
	if (showDirectionArrow) {
		const arrowStartX = x + drawWidth / 3;
		const arrowY = y + drawHeight + 10;
		const arrowEndX = x + drawWidth / 3 * 2;

		ctx.beginPath();
		ctx.moveTo(arrowStartX, arrowY);
		ctx.lineTo(arrowEndX, arrowY);
		ctx.lineTo(arrowEndX - 10, arrowY - 5);
		ctx.moveTo(arrowEndX, arrowY);
		ctx.lineTo(arrowEndX - 10, arrowY + 5);
		ctx.stroke();

		ctx.fillText('桩号增大方向', x + drawWidth / 2 - 40, arrowY + 20);
	}
}

//空心板 实心板2
function drawKxbTemplate2(ctx, {
	logicalWidth = 8,
	logicalHeight = 8,
	unit = 'm',
}) {
	const systemInfo = uni.getSystemInfoSync();
	const centerX = systemInfo.screenWidth / 2;
	const centerY = systemInfo.screenHeight / 2;
	const screenWidth = systemInfo.screenWidth;
	const screenHeight = systemInfo.screenHeight;
	const showDirectionArrow = true;
	const MAX_DRAW_WIDTH = 800; // 宽高对调
	const MAX_DRAW_HEIGHT = 400;

	// 计算缩放比例（按最大宽度优先）
	let scale = MAX_DRAW_WIDTH / logicalWidth;
	let drawWidth = MAX_DRAW_WIDTH;
	let drawHeight = logicalHeight * scale;

	if (drawHeight > MAX_DRAW_HEIGHT) {
		scale = MAX_DRAW_HEIGHT / logicalHeight;
		drawHeight = MAX_DRAW_HEIGHT;
		drawWidth = logicalWidth * scale;
	}
	const x = (systemInfo.screenWidth - drawWidth) / 2;
	const y = (systemInfo.screenHeight - drawHeight) / 2;
	// 倾斜量（控制斜的角度，单位 px）
	const tiltOffsetX = 50;

	const rulerGap = 10;
	const minPixelPerUnit = 40;

	// 刻度步长
	let unitStepX = 1;
	while ((unitStepX * scale) < minPixelPerUnit) unitStepX++;
	let unitStepY = 1;
	while ((unitStepY * scale) < minPixelPerUnit) unitStepY++;

	ctx.setLineWidth(1);
	ctx.setStrokeStyle('#333');
	ctx.setFontSize(12);

	// 绘制倾斜矩形（代替 strokeRect）
	ctx.beginPath();
	ctx.moveTo(x + tiltOffsetX, y); // 左上
	ctx.lineTo(x + drawWidth, y); // 右上
	ctx.lineTo(x + drawWidth - tiltOffsetX, y + drawHeight); // 右下
	ctx.lineTo(x, y + drawHeight); // 左下
	ctx.closePath();
	ctx.stroke();

	// 上边（逻辑 X 轴）刻度
	drawRuler(ctx, x + tiltOffsetX, y - 10, x + drawWidth, y - 10, 'colunm', logicalWidth, 25, unit)

	// 右边（逻辑 Y 轴）刻度
	drawRuler(ctx, x + drawWidth + 10, y, x + drawWidth + 10 - tiltOffsetX, y + drawHeight, 'row', logicalHeight, 25,
		unit)

	// 方向箭头
	if (showDirectionArrow) {
		const arrowStartX = x + drawWidth / 3;
		const arrowY = y + drawHeight + 10;
		const arrowEndX = x + drawWidth / 3 * 2;

		ctx.beginPath();
		ctx.moveTo(arrowStartX, arrowY);
		ctx.lineTo(arrowEndX, arrowY);
		ctx.lineTo(arrowEndX - 10, arrowY - 5);
		ctx.moveTo(arrowEndX, arrowY);
		ctx.lineTo(arrowEndX - 10, arrowY + 5);
		ctx.stroke();

		ctx.fillText('桩号增大方向', x + drawWidth / 2 - 40, arrowY + 20);
	}
}

//变截面箱梁1
function drawBlmxlTemplate1(ctx, {
	logicalLength = 53, // 总逻辑长度（单位）
	beamCount = 3, // 梁数，最终桥墩数 = 2n + 1
	unit = 'm', // 单位显示
	bigBeamNumber = 36, //大桩号墩
	smallBeamNumber = 35, //小桩号墩
	bridgeFu = 'L' //桥幅
}) {
	const systemInfo = uni.getSystemInfoSync();
	const centerX = systemInfo.screenWidth / 2;
	const centerY = systemInfo.screenHeight / 2;
	ctx.setFontSize(12);
	ctx.setFillStyle('#333');
	const drawWidth = 800 / (beamCount * 2 + 1) < 80 ? (beamCount * 2 + 1) * 80 : 800;
	// const drawHeight = beamCount * 20 > 200 ? 200 : beamCount * 20;
	const drawHeight = 120;
	const screenWidth = systemInfo.screenHeight;
	const screenHeight = systemInfo.screenWidth;
	const x = (screenWidth - drawHeight) / 2; //左上角
	const y = (screenHeight - drawWidth) / 2; //左上角
	const intLogicalLength = Math.floor(logicalLength); //取整
	const unitLevel = 25;

	ctx.translate(centerX, centerY);
	ctx.rotate(-90 * Math.PI / 180); // 顺时针旋转 90°
	ctx.translate(-centerY, -centerX); // 注意这里 y/x 互换

	drawRuler(ctx, x + drawHeight + 10, y, x + drawHeight + 10, y + drawWidth, 'row', logicalLength, unitLevel,
		unit)

	//绘制图形
	const everyBeamHeight = (drawHeight * 2 / 3) / beamCount;
	const lineList = [];
	//绘制桥梁的顶部直线
	ctx.beginPath();
	ctx.moveTo(x + drawHeight, y);
	ctx.lineTo(x + drawHeight, y + drawWidth);
	ctx.stroke();
	//绘制桥梁各个桥墩
	ctx.beginPath();
	ctx.moveTo(x + drawHeight, y)
	ctx.lineTo(x, y)
	ctx.stroke()
	lineList.push({
		x: x,
		y: y
	})
	// 计算 beamCount 个递减间距的 x 坐标
	const exponent = 0 // 控制递减程度，越大递减越快
	const xPoints = [lineList[0].x]

	for (let i = 1; i < beamCount; i++) {
		const ratio = 1 - Math.pow(1 - i / (beamCount + 1), exponent)
		const xi = x + drawHeight / 3 * 2 * ratio
		xPoints.push(xi)
	}
	for (let i = 0; i < beamCount; i++) {
		const py = y + (i + 1) * drawWidth / (beamCount * 2 + 1);
		const px = xPoints[i] // 使用计算出的递减分布横坐标
		ctx.beginPath();
		ctx.moveTo(px, py)
		lineList.push({
			x: px,
			y: py
		})
		ctx.lineTo(x + drawHeight, py)
		ctx.stroke()
	}
	const curX = x + (beamCount - 1) * everyBeamHeight;
	for (let i = 0; i < beamCount; i++) {
		const py = y + (i + 1 + beamCount) * drawWidth / (beamCount * 2 + 1);
		ctx.beginPath();
		ctx.moveTo(lineList[beamCount - i].x, py)
		lineList.push({
			x: lineList[beamCount - i].x,
			y: py
		})
		ctx.lineTo(x + drawHeight, py)
		ctx.stroke()
	}
	ctx.beginPath();
	ctx.moveTo(x + drawHeight, y + drawWidth)
	lineList.push({
		x: x,
		y: y + drawWidth
	})
	ctx.lineTo(x, y + drawWidth)
	ctx.stroke()

	drawConvexCurve(ctx, lineList, bigBeamNumber, smallBeamNumber, bridgeFu, beamCount)

	ctx.translate(centerY, centerX); // 注意坐标顺序反过来
	ctx.rotate(90 * Math.PI / 180); // 逆时针旋转 90°
	ctx.translate(-centerX, -centerY); // 还原坐标
};

//变截面箱梁2
function drawBlmxlTemplate2(ctx, {
	logicalLength = 53, // 总逻辑长度（单位）
	beamCount = 3, // 梁数，最终桥墩数 = 2n + 1
	unit = 'm', // 单位显示
	bigBeamNumber = 36, //大桩号墩
	smallBeamNumber = 35, //小桩号墩
	bridgeFu = 'L' //桥幅
}) {
	const systemInfo = uni.getSystemInfoSync();
	const centerX = systemInfo.screenWidth / 2;
	const centerY = systemInfo.screenHeight / 2;
	ctx.setFontSize(12);
	ctx.setFillStyle('#333');
	const drawWidth = 800 / (beamCount * 2 + 1) < 80 ? (beamCount * 2 + 1) * 80 : 800;
	const drawHeight = beamCount * 20 > 200 ? 200 : beamCount * 20;
	const screenWidth = systemInfo.screenHeight;
	const screenHeight = systemInfo.screenWidth;
	const x = (screenWidth - drawHeight) / 2; //左上角
	const y = (screenHeight - drawWidth) / 2; //左上角
	const intLogicalLength = Math.floor(logicalLength); //取整
	const unitLevel = 25;

	ctx.translate(centerX, centerY);
	ctx.rotate(-90 * Math.PI / 180); // 顺时针旋转 90°
	ctx.translate(-centerY, -centerX); // 注意这里 y/x 互换

	drawRuler(ctx, x + drawHeight + 10, y, x + drawHeight + 10, y + drawWidth, 'row', logicalLength, unitLevel,
		unit)

	//绘制图形
	const everyBeamHeight = (drawHeight * 2 / 3) / beamCount;
	const lineList = [];
	//绘制桥梁的顶部直线
	ctx.beginPath();
	ctx.moveTo(x + drawHeight, y);
	ctx.lineTo(x + drawHeight, y + drawWidth);
	ctx.stroke();
	//绘制桥梁各个桥墩
	ctx.beginPath();
	ctx.moveTo(x + drawHeight, y)
	ctx.lineTo(x, y)
	ctx.stroke()
	lineList.push({
		x: x,
		y: y
	})
	// 计算 beamCount 个递减间距的 x 坐标
	const exponent = 2 // 控制递减程度，越大递减越快
	const xPoints = [lineList[0].x]

	for (let i = 1; i < beamCount; i++) {
		const ratio = 1 - Math.pow(1 - i / (beamCount + 1), exponent)
		const xi = x + drawHeight / 3 * 2 * ratio
		xPoints.push(xi)
	}
	for (let i = 0; i < beamCount; i++) {
		const py = y + (i + 1) * drawWidth / (beamCount * 2 + 1);
		const px = xPoints[i] // 使用计算出的递减分布横坐标
		ctx.beginPath();
		ctx.moveTo(px, py)
		lineList.push({
			x: px,
			y: py
		})
		ctx.lineTo(x + drawHeight, py)
		ctx.stroke()
	}
	const curX = x + (beamCount - 1) * everyBeamHeight;
	for (let i = 0; i < beamCount; i++) {
		const py = y + (i + 1 + beamCount) * drawWidth / (beamCount * 2 + 1);
		ctx.beginPath();
		ctx.moveTo(lineList[beamCount - i].x, py)
		lineList.push({
			x: lineList[beamCount - i].x,
			y: py
		})
		ctx.lineTo(x + drawHeight, py)
		ctx.stroke()
	}
	ctx.beginPath();
	ctx.moveTo(x + drawHeight, y + drawWidth)
	lineList.push({
		x: x,
		y: y + drawWidth
	})
	ctx.lineTo(x, y + drawWidth)
	ctx.stroke()

	drawConvexCurve(ctx, lineList, bigBeamNumber, smallBeamNumber, bridgeFu, beamCount)

	ctx.translate(centerY, centerX); // 注意坐标顺序反过来
	ctx.rotate(90 * Math.PI / 180); // 逆时针旋转 90°
	ctx.translate(-centerX, -centerY); // 还原坐标
};

//变截面箱梁3
function drawBlmxlTemplate3(ctx, {
	logicalLength = 53, // 总逻辑长度（单位）
	leftBeamCount = 7, // 左梁数
	unit = 'm', // 单位显示
	bigBeamNumber = 36, //大桩号墩
	smallBeamNumber = 35, //小桩号墩
	bridgeFu = 'L' //桥幅
}) {
	const systemInfo = uni.getSystemInfoSync();
	const centerX = systemInfo.screenWidth / 2;
	const centerY = systemInfo.screenHeight / 2;
	ctx.setFontSize(12);
	ctx.setFillStyle('#333');
	// const drawWidth = 800 / (beamCount * 2 + 1) < 80 ? (beamCount * 2 + 1) * 80 : 800;
	const beamCount = (leftBeamCount - 1) / 2; // 梁数
	const drawWidth = (beamCount * 2 + 1) * 100;
	const drawHeight = beamCount * 20 > 200 ? 250 : beamCount * 25;
	const screenWidth = systemInfo.screenHeight;
	const screenHeight = systemInfo.screenWidth;
	const x = (screenWidth - drawHeight) / 2; //左上角
	const y = (screenHeight - drawWidth) / 2; //左上角
	const intLogicalLength = Math.floor(logicalLength); //取整
	const unitLevel = 25;

	ctx.translate(centerX, centerY);
	ctx.rotate(-90 * Math.PI / 180); // 顺时针旋转 90°
	ctx.translate(-centerY, -centerX); // 注意这里 y/x 互换

	drawRuler(ctx, x + drawHeight + 10, y, x + drawHeight + 10, y + drawWidth, 'row', logicalLength, unitLevel,
		unit)

	//绘制图形
	const everyBeamHeight = (drawHeight * 2 / 3) / beamCount;
	const lineList = [];
	//绘制桥梁的顶部直线
	ctx.beginPath();
	ctx.moveTo(x + drawHeight, y);
	ctx.lineTo(x + drawHeight, y + drawWidth);
	ctx.stroke();
	//绘制桥梁各个桥墩
	ctx.beginPath();
	ctx.moveTo(x + drawHeight, y)
	ctx.lineTo(x, y)
	ctx.stroke()
	lineList.push({
		x: x,
		y: y
	})
	// 计算 beamCount 个递减间距的 x 坐标
	const exponent = 2 // 控制递减程度，越大递减越快
	const xPoints = [lineList[0].x]

	const total = beamCount * 2 + 1;
	for (let i = 1; i <= total; i++) {
		const ratio = Math.log(i + 1) / Math.log(total + 1); // 归一化
		const xi = x + (drawHeight / 3 * 2) * ratio;
		xPoints.push(xi);
	}
	for (let i = 0; i < beamCount * 2 + 1; i++) {
		const py = y + (i + 1) * drawWidth / (beamCount * 2 + 1);
		const px = xPoints[i] // 使用计算出的递减分布横坐标
		ctx.beginPath();
		ctx.moveTo(px, py)
		lineList.push({
			x: px,
			y: py
		})
		ctx.lineTo(x + drawHeight, py)
		ctx.stroke()
	}
	//const curX = x + (beamCount - 1) * everyBeamHeight;
	// for (let i = 0; i < beamCount; i++) {
	// 	const py = y + (i + 1 + beamCount) * drawWidth / (beamCount * 2 + 1);
	// 	ctx.beginPath();
	// 	// ctx.moveTo(lineList[beamCount - i].x, py)
	// 	// lineList.push({
	// 	// 	x: lineList[beamCount - i].x,
	// 	// 	y: py
	// 	// })
	// 	// ctx.lineTo(x + drawHeight, py)
	// 	ctx.stroke()
	// }
	ctx.beginPath();
	ctx.moveTo(x, lineList[0].y)
	ctx.lineTo(x, lineList[1].y)
	ctx.stroke()
	ctx.beginPath();
	ctx.moveTo(lineList[lineList.length - 1].x, lineList[lineList.length - 1].y)
	ctx.lineTo(lineList[lineList.length - 2].x, lineList[lineList.length - 2].y)
	ctx.stroke()

	const newLineList = lineList.slice(1, lineList.length - 1); // 去掉首尾两个点
	ctx.beginPath();
	ctx.moveTo(newLineList[0].x, newLineList[0].y);
	for (let i = 1; i < newLineList.length - 2; i++) {
		const xc = (newLineList[i].x + newLineList[i + 1].x) / 2;
		const yc = (newLineList[i].y + newLineList[i + 1].y) / 2;
		ctx.quadraticCurveTo(newLineList[i].x, newLineList[i].y, xc, yc);
	}
	ctx.quadraticCurveTo(
		newLineList[newLineList.length - 2].x,
		newLineList[newLineList.length - 2].y,
		newLineList[newLineList.length - 1].x,
		newLineList[newLineList.length - 1].y
	);
	ctx.stroke();

	ctx.beginPath();
	ctx.moveTo(lineList[0].x, lineList[0].y);
	for (let i = 1; i < lineList.length; i++) {
		const text =
			`${bridgeFu}${bigBeamNumber}-${smallBeamNumber}-${i-1}#`;
		const textX = lineList[i - 1].x - 20;
		const textY = lineList[i - 1].y - 20;

		ctx.save(); // 保存当前状态
		ctx.translate(textX, textY); // 移动到文字起点
		ctx.rotate(90 * Math.PI / 180); // 旋转 90 度，让文字横着写
		ctx.fillText(text, 0, 0); // 在旋转后的坐标系下写文字
		ctx.restore(); // 恢复坐标系
	}

	// drawConvexCurve(ctx, newLineList, bigBeamNumber, smallBeamNumber, bridgeFu, beamCount)

	ctx.translate(centerY, centerX); // 注意坐标顺序反过来
	ctx.rotate(90 * Math.PI / 180); // 逆时针旋转 90°
	ctx.translate(-centerX, -centerY); // 还原坐标
};

//变截面箱梁4
function drawBlmxlTemplate4(ctx, {
	logicalLength = 53, // 总逻辑长度（单位）
	rightBeamCount = 7, // 右梁数
	unit = 'm', // 单位显示
	bigBeamNumber = 36, //大桩号墩
	smallBeamNumber = 35, //小桩号墩
	bridgeFu = 'L' //桥幅
}) {
	const systemInfo = uni.getSystemInfoSync();
	const centerX = systemInfo.screenWidth / 2;
	const centerY = systemInfo.screenHeight / 2;
	ctx.setFontSize(12);
	ctx.setFillStyle('#333');
	// const drawWidth = 800 / (beamCount * 2 + 1) < 80 ? (beamCount * 2 + 1) * 80 : 800;
	const beamCount = (rightBeamCount - 1) / 2; // 梁数
	const drawWidth = (beamCount * 2 + 1) * 100;
	const drawHeight = beamCount * 20 > 200 ? 250 : beamCount * 25;
	const screenWidth = systemInfo.screenHeight;
	const screenHeight = systemInfo.screenWidth;
	const x = (screenWidth - drawHeight) / 2; //左上角
	const y = (screenHeight - drawWidth) / 2; //左上角
	const intLogicalLength = Math.floor(logicalLength); //取整
	const unitLevel = 25;

	ctx.translate(centerX, centerY);
	ctx.rotate(-90 * Math.PI / 180); // 顺时针旋转 90°
	ctx.translate(-centerY, -centerX); // 注意这里 y/x 互换

	drawRuler(ctx, x + drawHeight + 10, y, x + drawHeight + 10, y + drawWidth, 'row', logicalLength, unitLevel,
		unit)

	//绘制图形
	const everyBeamHeight = (drawHeight * 2 / 3) / beamCount;
	const lineList = [];
	//绘制桥梁的顶部直线
	ctx.beginPath();
	ctx.moveTo(x + drawHeight, y);
	ctx.lineTo(x + drawHeight, y + drawWidth);
	ctx.stroke();
	//绘制桥梁各个桥墩
	ctx.beginPath();
	ctx.moveTo(x + drawHeight, y + drawWidth)
	ctx.lineTo(x, y + drawWidth)
	ctx.stroke()
	lineList.push({
		x: x,
		y: y
	})
	// 计算 beamCount 个递减间距的 x 坐标
	const exponent = 2 // 控制递减程度，越大递减越快
	const xPoints = [lineList[0].x]

	const total = beamCount * 2 + 1;
	for (let i = 1; i < total; i++) {
		const ratio = Math.log(i + 1) / Math.log(total + 1); // 归一化
		const xi = x + (drawHeight / 3 * 2) * ratio;
		xPoints.push(xi);
	}
	xPoints.reverse(); // 反转数组，使得右侧梁的 x 坐标递减分布
	for (let i = 0; i < beamCount * 2 + 1; i++) {
		const py = y + (i + 1) * drawWidth / (beamCount * 2 + 1);
		const px = xPoints[i] // 使用计算出的递减分布横坐标
		ctx.beginPath();
		ctx.moveTo(px, py - 100)
		lineList.push({
			x: px,
			y: py - 100
		})
		ctx.lineTo(x + drawHeight, py - 100)
		ctx.stroke()
	}
	console.log('list', lineList);

	ctx.beginPath();
	ctx.moveTo(x, lineList[lineList.length - 1].y)
	ctx.lineTo(x, lineList[lineList.length - 1].y + 100)
	ctx.stroke()
	const text =
		`${bridgeFu}${bigBeamNumber}-${smallBeamNumber}-${rightBeamCount-1}#`;
	const textX = x - 20;
	const textY = lineList[lineList.length - 1].y - 20;
	ctx.save(); // 保存当前状态
	ctx.translate(textX, textY); // 移动到文字起点
	ctx.rotate(90 * Math.PI / 180); // 旋转 90 度，让文字横着写
	ctx.fillText(text, 0, 0); // 在旋转后的坐标系下写文字
	ctx.restore(); // 恢复坐标系

	const newLineList = lineList.slice(1, lineList.length); // 去掉首点
	ctx.beginPath();
	ctx.moveTo(newLineList[0].x, newLineList[0].y);
	for (let i = 1; i < newLineList.length - 2; i++) {
		const xc = (newLineList[i].x + newLineList[i + 1].x) / 2;
		const yc = (newLineList[i].y + newLineList[i + 1].y) / 2;
		ctx.quadraticCurveTo(newLineList[i].x, newLineList[i].y, xc, yc);
	}
	ctx.quadraticCurveTo(
		newLineList[newLineList.length - 2].x,
		newLineList[newLineList.length - 2].y,
		newLineList[newLineList.length - 1].x,
		newLineList[newLineList.length - 1].y
	);
	ctx.stroke();

	ctx.beginPath();
	ctx.moveTo(lineList[0].x, lineList[0].y);
	for (let i = 2; i < lineList.length; i++) {
		const text =
			`${bridgeFu}${bigBeamNumber}-${smallBeamNumber}-${i-2}#`;
		const textX = lineList[i - 1].x - 20;
		const textY = lineList[i - 1].y - 20;

		ctx.save(); // 保存当前状态
		ctx.translate(textX, textY); // 移动到文字起点
		ctx.rotate(90 * Math.PI / 180); // 旋转 90 度，让文字横着写
		ctx.fillText(text, 0, 0); // 在旋转后的坐标系下写文字
		ctx.restore(); // 恢复坐标系
	}

	// drawConvexCurve(ctx, newLineList, bigBeamNumber, smallBeamNumber, bridgeFu, beamCount)

	ctx.translate(centerY, centerX); // 注意坐标顺序反过来
	ctx.rotate(90 * Math.PI / 180); // 逆时针旋转 90°
	ctx.translate(-centerX, -centerY); // 还原坐标
};

//绘制刻度尺
function drawRuler(ctx, x, y, endx, endy, direction, logicalLength, unitLevel, unit, isRotated = false) {
	//direction是刻度的绘制方向
	//logicalLength是用户定义的逻辑长度 即刻度线上的最大刻度
	//unitLevel是单位级别 即长度是25的n倍，则一个刻度代表多少长度
	const intLogicalLength = Math.floor(logicalLength) //取整
	const unitCount = logicalLength % unitLevel === 0 ? logicalLength / unitLevel : Math.floor(logicalLength /
		unitLevel) + 1;
	const dis = isRotated ? 8 : -8
	const rowdis = isRotated ? -8 : 8
	const textXdis = isRotated ? -30 : 10
	const textYdis = isRotated ? 5 : -30
	ctx.beginPath();
	ctx.moveTo(x, y);
	ctx.lineTo(endx, endy);
	ctx.stroke();
	//如果觉得最后一步为了避免文字覆盖导致的步长太长，就添加一个判断 判断intLogicalLength / unitCount能否整除
	for (let i = 0; i <= intLogicalLength / unitCount - 1; i++) {
		let text;
		let textX;
		let textY;
		if (direction === 'colunm') {
			const longth = endx - x;
			//倾斜时的偏移量
			const oversetY = (endy - y) / (intLogicalLength / unitCount);
			const px = x + i * (longth / (intLogicalLength / unitCount));
			ctx.beginPath();
			ctx.moveTo(px, y + oversetY * i)
			ctx.lineTo(px, y + dis + oversetY * i)
			ctx.stroke()
			// 旋转文字，让它横向显示
			text = `${i * unitCount}${unit}`;
			textX = px - 10;
			textY = y - 15 + oversetY * i;
		} else {
			const longth = endy - y;
			//倾斜时的偏移量
			const oversetX = (endx - x) / (intLogicalLength / unitCount);
			const py = y + i * (longth / (intLogicalLength / unitCount));
			ctx.beginPath();
			ctx.moveTo(x + oversetX * i, py)
			ctx.lineTo(x + rowdis + oversetX * i, py)
			ctx.stroke()
			// 旋转文字，让它横向显示
			text = `${i * unitCount}${unit}`;
			textX = x + textXdis + oversetX * i;
			textY = py + textYdis;
		}

		ctx.save(); // 保存当前状态
		ctx.translate(textX, textY); // 移动到文字起点
		if ((direction === 'row' && !isRotated) || (direction === 'colunm' && isRotated)) {
			ctx.translate(5, 26); // 移动到文字起点
			ctx.rotate(90 * Math.PI / 180); // 旋转 90 度，让文字横着写
		}
		ctx.fillText(text, 0, 0); // 在旋转后的坐标系下写文字
		ctx.restore(); // 恢复坐标系
	}
	if (true) {
		let text;
		let textX;
		let textY;
		if (direction === 'colunm') {
			ctx.beginPath();
			ctx.moveTo(endx, endy)
			ctx.lineTo(endx, endy + dis)
			ctx.stroke()
			// 旋转文字，让它横向显示
			text = `${logicalLength}${unit}`;
			textX = endx - 10;
			textY = endy - 15;
		} else {
			ctx.beginPath();
			ctx.moveTo(endx, endy)
			ctx.lineTo(endx + rowdis, endy)
			ctx.stroke()
			// 旋转文字，让它横向显示
			text = `${logicalLength}${unit}`;
			textX = endx + textXdis;
			textY = endy + textYdis;
		}
		ctx.save(); // 保存当前状态
		ctx.translate(textX, textY); // 移动到文字起点
		if ((direction === 'row' && !isRotated) || (direction === 'colunm' && isRotated)) {
			ctx.translate(5, 26); // 移动到文字起点
			ctx.rotate(90 * Math.PI / 180); // 旋转 90 度，让文字横着写
		}
		ctx.fillText(text, 0, 0); // 在旋转后的坐标系下写文字
		ctx.restore(); // 恢复坐标系
	}
}

// //绘制刻度尺
// function drawRuler(ctx, x, y, longth, logicalLength, unitLevel, unit) {
// 	//longth是刻度线的绘制长度
// 	//logicalLength是用户定义的逻辑长度 即刻度线上的最大刻度
// 	//unitLevel是单位级别 即长度是25的n倍，则一个刻度代表多少长度
// 	const intLogicalLength = Math.floor(logicalLength) //取整
// 	const unitCount = logicalLength % unitLevel === 0 ? logicalLength / unitLevel : Math.floor(logicalLength /
// 		unitLevel) + 1;
// 	ctx.beginPath();
// 	ctx.moveTo(x, y);
// 	ctx.lineTo(x, y + longth);
// 	ctx.stroke();
// 	//如果觉得最后一步为了避免文字覆盖导致的步长太长，就添加一个判断 判断intLogicalLength / unitCount能否整除
// 	for (let i = 0; i <= intLogicalLength / unitCount - 1; i++) {
// 		const py = y + i * (longth / (intLogicalLength / unitCount));
// 		ctx.beginPath();
// 		ctx.moveTo(x, py)
// 		ctx.lineTo(x + 8, py)
// 		ctx.stroke()

// 		// 旋转文字，让它横向显示
// 		const text = `${i * unitCount}${unit}`;
// 		const textX = x + 15;
// 		const textY = py - 10;

// 		ctx.save(); // 保存当前状态
// 		ctx.translate(textX, textY); // 移动到文字起点
// 		ctx.rotate(90 * Math.PI / 180); // 旋转 90 度，让文字横着写
// 		ctx.fillText(text, 0, 0); // 在旋转后的坐标系下写文字
// 		ctx.restore(); // 恢复坐标系
// 	}
// 	if (true) {
// 		const py = y + longth;
// 		ctx.beginPath();
// 		ctx.moveTo(x, py)
// 		ctx.lineTo(x + 8, py)
// 		ctx.stroke()

// 		const text = `${logicalLength}${unit}`;
// 		const textX = x + 15;
// 		const textY = py - 10;

// 		ctx.save(); // 保存当前状态
// 		ctx.translate(textX, textY); // 移动到文字起点
// 		ctx.rotate(90 * Math.PI / 180); // 旋转 90 度，让文字横着写
// 		ctx.fillText(text, 0, 0); // 在旋转后的坐标系下写文字
// 		ctx.restore(); // 恢复坐标系
// 	}
// }

function drawConvexCurve(ctx, points, bigBeamNumber, smallBeamNumber, bridgeFu, beamCount) {
	if (!points || points.length < 2) return;

	ctx.beginPath();
	ctx.moveTo(points[0].x, points[0].y);
	for (let i = 1; i < points.length; i++) {
		const text =
			`${bridgeFu}${bigBeamNumber}-${i>beamCount?bigBeamNumber:smallBeamNumber}-${i-1>beamCount?beamCount*2-i+1:i-1}#`;
		const textX = points[i - 1].x - 20;
		const textY = points[i - 1].y - 20;

		ctx.save(); // 保存当前状态
		ctx.translate(textX, textY); // 移动到文字起点
		ctx.rotate(90 * Math.PI / 180); // 旋转 90 度，让文字横着写
		ctx.fillText(text, 0, 0); // 在旋转后的坐标系下写文字
		ctx.restore(); // 恢复坐标系
	}

	//插入一个中间点 防止中间是直线
	// const middleIndex = points.length / 2;
	// points.splice(points.length / 2, 0, {
	// 	x: points[middleIndex].x + 4,
	// 	y: (points[middleIndex - 1].y + points[middleIndex].y) / 2
	// });

	for (let i = 1; i < points.length; i++) {
		const p0 = points[i - 1]; // 上一个点
		const p1 = points[i]; // 当前点
		const p2 = points[i + 1] || p1; // 下一个点（防止越界）

		// 计算当前曲线段的控制点，保持凸性
		const cp1x = p0.x + (p1.x - p0.x) / 4;
		const cp1y = p0.y + (p1.y - p0.y) / 4;
		const cp2x = p1.x - (p2.x - p1.x) / 4;
		const cp2y = p1.y - (p2.y - p1.y) / 4;

		// 绘制贝塞尔曲线，确保每段曲线都是凸形的
		ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p1.x, p1.y);
	}

	ctx.stroke();
}

//空心板 实心板 3
function drawKxbTemplate3(ctx, {
	logicalWidth = 12,
	bigBeamNumber = 1,
	beamCount = 8,
	bridgeFu = 'L',
	unit = 'm',
}) {
	const systemInfo = uni.getSystemInfoSync();
	const centerX = systemInfo.screenWidth / 2;
	const centerY = systemInfo.screenHeight / 2;
	const screenWidth = systemInfo.screenWidth;
	const screenHeight = systemInfo.screenHeight;
	ctx.setFontSize(12);
	ctx.setFillStyle('#333');
	const miniRectHeight = 50;
	const drawWidth = 550;
	const drawHeight = miniRectHeight * beamCount;
	const overSetY = 0;
	const x = (screenHeight - drawWidth) / 2 - 20;
	// const y = 950 - drawHeight > 0 ? (950 - drawHeight) / 2 : 50;
	const y = (screenWidth - drawHeight) / 2;

	ctx.translate(centerX, centerY);
	ctx.rotate(-90 * Math.PI / 180); // 顺时针旋转 90°
	ctx.translate(-centerY, -centerX); // 注意这里 y/x 互换

	//绘制外面的平行四边形
	ctx.beginPath();
	//上
	ctx.moveTo(x, y);
	ctx.lineTo(x + drawWidth, y + overSetY);
	//左
	ctx.moveTo(x, y);
	ctx.lineTo(x, y + drawHeight);
	//下
	ctx.moveTo(x, y + drawHeight);
	ctx.lineTo(x + drawWidth, y + drawHeight + overSetY);
	//右
	ctx.moveTo(x + drawWidth, y + overSetY);
	ctx.lineTo(x + drawWidth, y + drawHeight + overSetY);
	ctx.stroke();

	//绘制内部线段 和两侧文字
	for (let i = 1; i <= beamCount; i++) {
		const py = y + i * miniRectHeight;
		ctx.beginPath();
		ctx.moveTo(x, py)
		ctx.lineTo(x + drawWidth, py + overSetY)
		ctx.stroke()
		const text = `${bridgeFu}${bigBeamNumber}-${i}`;

		ctx.save(); // 保存当前状态
		ctx.translate(x + drawWidth + 10, py + overSetY - 34); // 移动到文字起点
		ctx.rotate(90 * Math.PI / 180); // 旋转 90 度，让文字横着写
		ctx.fillText(text, 0, 0); // 在旋转后的坐标系下写文字
		ctx.restore(); // 恢复坐标系
	}
	for (let i = 1; i < beamCount; i++) {
		const py = y + i * miniRectHeight;
		const text = `${bridgeFu}${bigBeamNumber}-${i}`;
		ctx.save(); // 保存当前状态
		ctx.translate(x - 16, py - 16); // 移动到文字起点
		ctx.rotate(90 * Math.PI / 180); // 旋转 90 度，让文字横着写
		ctx.fillText(text, 0, 0); // 在旋转后的坐标系下写文字
		ctx.restore(); // 恢复坐标系
	}
	//铰缝编号
	ctx.save(); // 保存当前状态
	ctx.translate(x - 40, y + drawHeight / 2 - 24); // 移动到文字起点
	ctx.rotate(90 * Math.PI / 180); // 旋转 90 度，让文字横着写
	ctx.fillText('铰缝编号', 0, 0); // 在旋转后的坐标系下写文字
	ctx.restore(); // 恢复坐标系
	//空心板编号
	ctx.save(); // 保存当前状态
	ctx.translate(x + drawWidth + 30, y + overSetY + drawHeight / 2 - 20); // 移动到文字起点
	ctx.rotate(90 * Math.PI / 180); // 旋转 90 度，让文字横着写
	ctx.fillText('铰缝编号', 0, 0); // 在旋转后的坐标系下写文字
	ctx.restore(); // 恢复坐标系

	// const rulerLongth = Math.hypot(drawWidth, overSetY);
	//绘制刻度
	drawRuler(ctx, x + drawWidth, y + drawHeight + overSetY + 10, x, y + drawHeight + 10, 'colunm', logicalWidth,
		20, unit, true);

	ctx.translate(centerY, centerX); // 注意坐标顺序反过来
	ctx.rotate(90 * Math.PI / 180); // 逆时针旋转 90°
	ctx.translate(-centerX, -centerY); // 还原坐标
}

//空心板 实心板 4
function drawKxbTemplate4(ctx, {
	logicalWidth = 12,
	bigBeamNumber = 1,
	beamCount = 8,
	bridgeFu = 'L',
	unit = 'm',
}) {
	const systemInfo = uni.getSystemInfoSync();
	const centerX = systemInfo.screenWidth / 2;
	const centerY = systemInfo.screenHeight / 2;
	const screenWidth = systemInfo.screenWidth;
	const screenHeight = systemInfo.screenHeight;
	ctx.setFontSize(12);
	ctx.setFillStyle('#333');
	const miniRectHeight = 50;
	const drawWidth = 550;
	const drawHeight = miniRectHeight * beamCount;
	const overSetY = 50;
	const x = (screenHeight - drawWidth) / 2 - 20;
	// const y = 950 - drawHeight > 0 ? (950 - drawHeight) / 2 : 50;
	const y = (screenWidth - drawHeight) / 2;

	ctx.translate(centerX, centerY);
	ctx.rotate(-90 * Math.PI / 180); // 顺时针旋转 90°
	ctx.translate(-centerY, -centerX); // 注意这里 y/x 互换

	//绘制外面的平行四边形
	ctx.beginPath();
	//上
	ctx.moveTo(x, y);
	ctx.lineTo(x + drawWidth, y + overSetY);
	//左
	ctx.moveTo(x, y);
	ctx.lineTo(x, y + drawHeight);
	//下
	ctx.moveTo(x, y + drawHeight);
	ctx.lineTo(x + drawWidth, y + drawHeight + overSetY);
	//右
	ctx.moveTo(x + drawWidth, y + overSetY);
	ctx.lineTo(x + drawWidth, y + drawHeight + overSetY);
	ctx.stroke();

	//绘制内部线段 和两侧文字
	for (let i = 1; i <= beamCount; i++) {
		const py = y + i * miniRectHeight;
		ctx.beginPath();
		ctx.moveTo(x, py)
		ctx.lineTo(x + drawWidth, py + overSetY)
		ctx.stroke()
		const text = `${bridgeFu}${bigBeamNumber}-${i}`;

		ctx.save(); // 保存当前状态
		ctx.translate(x + drawWidth + 10, py + overSetY - 34); // 移动到文字起点
		ctx.rotate(90 * Math.PI / 180); // 旋转 90 度，让文字横着写
		ctx.fillText(text, 0, 0); // 在旋转后的坐标系下写文字
		ctx.restore(); // 恢复坐标系
	}
	for (let i = 1; i < beamCount; i++) {
		const py = y + i * miniRectHeight;
		const text = `${bridgeFu}${bigBeamNumber}-${i}`;
		ctx.save(); // 保存当前状态
		ctx.translate(x - 16, py - 16); // 移动到文字起点
		ctx.rotate(90 * Math.PI / 180); // 旋转 90 度，让文字横着写
		ctx.fillText(text, 0, 0); // 在旋转后的坐标系下写文字
		ctx.restore(); // 恢复坐标系
	}
	//铰缝编号
	ctx.save(); // 保存当前状态
	ctx.translate(x - 40, y + drawHeight / 2 - 24); // 移动到文字起点
	ctx.rotate(90 * Math.PI / 180); // 旋转 90 度，让文字横着写
	ctx.fillText('铰缝编号', 0, 0); // 在旋转后的坐标系下写文字
	ctx.restore(); // 恢复坐标系
	//空心板编号
	ctx.save(); // 保存当前状态
	ctx.translate(x + drawWidth + 30, y + overSetY + drawHeight / 2 - 20); // 移动到文字起点
	ctx.rotate(90 * Math.PI / 180); // 旋转 90 度，让文字横着写
	ctx.fillText('铰缝编号', 0, 0); // 在旋转后的坐标系下写文字
	ctx.restore(); // 恢复坐标系

	// const rulerLongth = Math.hypot(drawWidth, overSetY);
	//绘制刻度
	drawRuler(ctx, x + drawWidth, y + drawHeight + overSetY + 10, x, y + drawHeight + 10, 'colunm', logicalWidth,
		20, unit, true);

	ctx.translate(centerY, centerX); // 注意坐标顺序反过来
	ctx.rotate(90 * Math.PI / 180); // 逆时针旋转 90°
	ctx.translate(-centerX, -centerY); // 还原坐标
}

//空心板 实心板 5
function drawKxbTemplate5(ctx, {
	logicalLength = 8,
	bottomPlate = 1.2,
	abdomenPlate = 1.2,
	flangePlate = 1.2,
	unit = 'm',
}) {
	const systemInfo = uni.getSystemInfoSync();
	const centerX = systemInfo.screenWidth / 2;
	const centerY = systemInfo.screenHeight / 2;
	const screenWidth = systemInfo.screenWidth;
	const screenHeight = systemInfo.screenHeight;
	ctx.setFontSize(12);
	ctx.setFillStyle('#333');
	const baseHeight = 60; // 基础高度
	const drawWidth = 550; // 绘制宽度
	const drawHeight = (bottomPlate + abdomenPlate + flangePlate) * baseHeight; // 绘制高度
	const x = (systemInfo.screenWidth - drawWidth) / 2; // 左上角 x 坐标
	let y = (systemInfo.screenHeight - drawHeight) / 2; // 左上角 y 坐标

	//绘制刻度
	drawRuler(ctx, x, y - 10, x + drawWidth, y - 10, 'colunm', logicalLength, 20, unit);
	// 翼缘板矩形
	ctx.strokeRect(x, y, drawWidth, flangePlate * baseHeight);
	drawScaleSingle(ctx, x + drawWidth + 10, y, x + drawWidth + 10, y + flangePlate * baseHeight, flangePlate, unit)
	ctx.save(); // 保存当前状态
	ctx.translate(x - 50, (y + y + flangePlate * baseHeight) / 2); // 移动到文字起点
	ctx.fillText(`翼缘板`, 0, 0); // 在旋转后的坐标系下写文字
	ctx.restore(); // 恢复坐标系
	// 腹板矩形
	y += flangePlate * baseHeight; // 更新 y 坐标
	ctx.strokeRect(x, y, drawWidth, abdomenPlate * baseHeight);
	drawScaleSingle(ctx, x + drawWidth + 10, y, x + drawWidth + 10, y + abdomenPlate * baseHeight, abdomenPlate, unit)
	ctx.save(); // 保存当前状态
	ctx.translate(x - 50, (y + y + abdomenPlate * baseHeight) / 2); // 移动到文字起点
	ctx.fillText(`腹板`, 0, 0); // 在旋转后的坐标系下写文字
	ctx.restore(); // 恢复坐标系
	// 底板矩形
	y += abdomenPlate * baseHeight; // 更新 y 坐标
	ctx.strokeRect(x, y, drawWidth, bottomPlate * baseHeight);
	drawScaleSingle(ctx, x + drawWidth + 10, y, x + drawWidth + 10, y + bottomPlate * baseHeight, bottomPlate, unit)
	ctx.save(); // 保存当前状态
	ctx.translate(x - 50, (y + y + bottomPlate * baseHeight) / 2); // 移动到文字起点
	ctx.fillText(`底板`, 0, 0); // 在旋转后的坐标系下写文字
	ctx.restore(); // 恢复坐标系
}

//空心板 实心板 6
function drawKxbTemplate6(ctx, {
	logicalLength = 8,
	bottomPlate = 1.2,
	abdomenPlate = 1.2,
	flangePlate = 1.2,
	unit = 'm',
}) {
	const systemInfo = uni.getSystemInfoSync();
	const centerX = systemInfo.screenWidth / 2;
	const centerY = systemInfo.screenHeight / 2;
	const screenWidth = systemInfo.screenWidth;
	const screenHeight = systemInfo.screenHeight;
	ctx.setFontSize(12);
	ctx.setFillStyle('#333');
	const baseHeight = 60; // 基础高度
	const drawWidth = 550; // 绘制宽度
	const drawHeight = (bottomPlate + abdomenPlate + flangePlate) * baseHeight; // 绘制高度
	const x = (systemInfo.screenWidth - drawWidth) / 2; // 左上角 x 坐标
	let y = (systemInfo.screenHeight - drawHeight) / 2; // 左上角 y 坐标
	const offsetX = 20;

	//绘制刻度
	drawRuler(ctx, x, y - 10, x + drawWidth, y - 10, 'colunm', logicalLength, 20, unit);
	// 翼缘板矩形
	// 绘制倾斜矩形（代替 strokeRect）
	ctx.beginPath();
	ctx.moveTo(x, y); // 左上
	ctx.lineTo(x + drawWidth, y); // 右上
	ctx.lineTo(x + drawWidth - offsetX, y + flangePlate * baseHeight); // 右下
	ctx.lineTo(x - offsetX, y + flangePlate * baseHeight); // 左下
	ctx.closePath();
	ctx.stroke();
	drawScaleSingle(ctx, x + drawWidth + 10, y, x + drawWidth + 10, y + flangePlate * baseHeight, flangePlate, unit)
	ctx.save(); // 保存当前状态
	ctx.translate(x - 50, (y + y + flangePlate * baseHeight) / 2); // 移动到文字起点
	ctx.fillText(`翼缘板`, 0, 0); // 在旋转后的坐标系下写文字
	ctx.restore(); // 恢复坐标系
	// 腹板矩形
	y += flangePlate * baseHeight; // 更新 y 坐标
	// 绘制倾斜矩形（代替 strokeRect）
	ctx.beginPath();
	ctx.moveTo(x - offsetX, y); // 左上
	ctx.lineTo(x + drawWidth - offsetX, y); // 右上
	ctx.lineTo(x + drawWidth - offsetX * 2, y + abdomenPlate * baseHeight); // 右下
	ctx.lineTo(x - offsetX * 2, y + abdomenPlate * baseHeight); // 左下
	ctx.closePath();
	ctx.stroke();
	drawScaleSingle(ctx, x + drawWidth + 10, y, x + drawWidth + 10, y + abdomenPlate * baseHeight, abdomenPlate, unit)
	ctx.save(); // 保存当前状态
	ctx.translate(x - 50 - offsetX, (y + y + abdomenPlate * baseHeight) / 2); // 移动到文字起点
	ctx.fillText(`腹板`, 0, 0); // 在旋转后的坐标系下写文字
	ctx.restore(); // 恢复坐标系
	// 底板矩形
	y += abdomenPlate * baseHeight; // 更新 y 坐标
	// 绘制倾斜矩形（代替 strokeRect）
	ctx.beginPath();
	ctx.moveTo(x - offsetX * 2, y); // 左上
	ctx.lineTo(x + drawWidth - offsetX * 2, y); // 右上
	ctx.lineTo(x + drawWidth - offsetX * 3, y + bottomPlate * baseHeight); // 右下
	ctx.lineTo(x - offsetX * 3, y + bottomPlate * baseHeight); // 左下
	ctx.closePath();
	ctx.stroke();
	drawScaleSingle(ctx, x + drawWidth + 10, y, x + drawWidth + 10, y + bottomPlate * baseHeight, bottomPlate, unit)
	ctx.save(); // 保存当前状态
	ctx.translate(x - 50 - offsetX * 2, (y + y + bottomPlate * baseHeight) / 2); // 移动到文字起点
	ctx.fillText(`底板`, 0, 0); // 在旋转后的坐标系下写文字
	ctx.restore(); // 恢复坐标系
}
//T梁
function drawTlTemplate1(ctx, {
	logicalLength = 8,
	bottomPlate = 1.2,
	abdomenPlate = 1.2,
	flangePlate = 1.2,
	unit = 'm',
	xl = false
}) {
	const systemInfo = uni.getSystemInfoSync();
	const centerX = systemInfo.screenWidth / 2;
	const centerY = systemInfo.screenHeight / 2;
	const screenWidth = systemInfo.screenWidth;
	const screenHeight = systemInfo.screenHeight;
	ctx.setFontSize(12);
	ctx.setFillStyle('#333');

	const baseHeight = 60;
	const drawWidth = 550;
	const totalHeight = (flangePlate * 2 + abdomenPlate * 2 + bottomPlate) * baseHeight;
	const x = (systemInfo.screenWidth - drawWidth) / 2;
	let y = (systemInfo.screenHeight - totalHeight) / 2;

	// 绘制顶部刻度尺
	drawRuler(ctx, x, y - 10, x + drawWidth, y - 10, 'colunm', logicalLength, 20, unit);

	// ===== 上翼缘板 =====
	ctx.strokeRect(x, y, drawWidth, flangePlate * baseHeight);
	drawScaleSingle(ctx, x + drawWidth + 10, y, x + drawWidth + 10, y + flangePlate * baseHeight, flangePlate, unit);
	ctx.save();
	ctx.translate(x - 50, y + flangePlate * baseHeight / 2);
	ctx.fillText('翼缘板', 0, 0);
	ctx.restore();
	y += flangePlate * baseHeight;

	// ===== 上腹板 =====
	const abdomenHeight = abdomenPlate * baseHeight;
	if (xl) {
		ctx.strokeRect(x, y, drawWidth, abdomenPlate * baseHeight);
	} else {
		ctx.beginPath();
		// 左边线
		ctx.moveTo(x, y);
		ctx.lineTo(x, y + abdomenHeight);
		// 右边线
		ctx.moveTo(x + drawWidth, y);
		ctx.lineTo(x + drawWidth, y + abdomenHeight);
		ctx.stroke();
	}

	drawScaleSingle(ctx, x + drawWidth + 10, y, x + drawWidth + 10, y + abdomenPlate * baseHeight, abdomenPlate, unit);
	ctx.save();
	ctx.translate(x - 50, y + abdomenPlate * baseHeight / 2);
	ctx.fillText('腹板', 0, 0);
	ctx.restore();
	y += abdomenPlate * baseHeight;

	// ===== 底板 =====
	const bottomHeight = bottomPlate * baseHeight;
	if (xl) {
		ctx.strokeRect(x, y, drawWidth, bottomPlate * baseHeight);
	} else {
		const cpOffset = -30; // 控制点偏移决定弯曲程度
		ctx.beginPath();
		// 上边曲线（向内凹）
		ctx.moveTo(x, y);
		ctx.quadraticCurveTo(x + drawWidth / 2, y - cpOffset, x + drawWidth, y);
		// 右边直线
		ctx.lineTo(x + drawWidth, y + bottomHeight);
		// 下边曲线（向内凹）
		ctx.quadraticCurveTo(x + drawWidth / 2, y + bottomHeight + cpOffset, x, y + bottomHeight);
		// 左边直线回起点
		ctx.closePath();
		ctx.stroke();
	}
	// 绘制右侧刻度
	drawScaleSingle(ctx, x + drawWidth + 10, y, x + drawWidth + 10, y + bottomHeight, bottomPlate, unit);

	// 注释文字
	ctx.save();
	ctx.translate(x - 50, y + bottomHeight / 2);
	ctx.fillText('底板', 0, 0);
	ctx.restore();

	y += bottomHeight; // 更新 y 值

	// ===== 下腹板 =====
	if (xl) {
		ctx.strokeRect(x, y, drawWidth, abdomenPlate * baseHeight);
	} else {
		ctx.beginPath();
		// 左边线
		ctx.moveTo(x, y);
		ctx.lineTo(x, y + abdomenHeight);
		// 右边线
		ctx.moveTo(x + drawWidth, y);
		ctx.lineTo(x + drawWidth, y + abdomenHeight);
		ctx.stroke();
	}

	drawScaleSingle(ctx, x + drawWidth + 10, y, x + drawWidth + 10, y + abdomenPlate * baseHeight, abdomenPlate, unit);
	ctx.save();
	ctx.translate(x - 50, y + abdomenPlate * baseHeight / 2);
	ctx.fillText('腹板', 0, 0);
	ctx.restore();
	y += abdomenPlate * baseHeight;

	// ===== 下翼缘板 =====
	ctx.strokeRect(x, y, drawWidth, flangePlate * baseHeight);
	drawScaleSingle(ctx, x + drawWidth + 10, y, x + drawWidth + 10, y + flangePlate * baseHeight, flangePlate, unit);
	ctx.save();
	ctx.translate(x - 50, y + flangePlate * baseHeight / 2);
	ctx.fillText('翼缘板', 0, 0);
	ctx.restore();
}

//横隔板
function drawHgbTemplate1(ctx, {
	logicalWidth = 6,
	logicalHeight = 4,
	unit = 'm',
	gl = false,
}) {
	const systemInfo = uni.getSystemInfoSync();
	const centerX = systemInfo.screenWidth / 2;
	const centerY = systemInfo.screenHeight / 2;
	const screenWidth = systemInfo.screenWidth;
	const screenHeight = systemInfo.screenHeight;
	ctx.setFontSize(12);
	ctx.setFillStyle('#333');

	const drawWidth = logicalWidth * 70;
	const drawHeight = logicalHeight * 70;
	const x = (systemInfo.screenWidth - drawWidth) / 2;
	const y = (systemInfo.screenHeight - drawHeight) / 2;
	const cutSize = 50;

	ctx.beginPath();

	if (!gl) {
		// 上切角
		ctx.moveTo(x + cutSize, y); // 左上切角起点
		ctx.lineTo(x + drawWidth - cutSize, y); // 上边横线
		ctx.lineTo(x + drawWidth, y + cutSize); // 右上切角
		ctx.lineTo(x + drawWidth, y + drawHeight); // 右侧
		ctx.lineTo(x, y + drawHeight); // 底边
		ctx.lineTo(x, y + cutSize); // 左侧
	} else {
		// 下切角
		ctx.moveTo(x, y); // 左上
		ctx.lineTo(x + drawWidth, y); // 上边横线
		ctx.lineTo(x + drawWidth, y + drawHeight - cutSize); // 右下切角起点
		ctx.lineTo(x + drawWidth - cutSize, y + drawHeight); // 右下切角
		ctx.lineTo(x + cutSize, y + drawHeight); // 底边
		ctx.lineTo(x, y + drawHeight - cutSize); // 左下切角
	}

	ctx.closePath();
	ctx.stroke();

	// 标尺绘制
	drawRuler(ctx, x, y - 10, x + drawWidth, y - 10, 'colunm', logicalWidth, 20, unit);
	drawRuler(ctx, x + drawWidth + 10, y, x + drawWidth + 10, y + drawHeight, 'row', logicalHeight, 20, unit);
}

//翼墙、耳墙
function drawYqTemplate1(ctx, {
	logicalWidth = 8,
	logicalHeight = 4,
	unit = 'm',
}) {
	const systemInfo = uni.getSystemInfoSync();
	const centerX = systemInfo.screenWidth / 2;
	const centerY = systemInfo.screenHeight / 2;
	const screenWidth = systemInfo.screenWidth;
	const screenHeight = systemInfo.screenHeight;
	ctx.setFontSize(12);
	ctx.setFillStyle('#333');
	const cutHeight = 40; // 从顶部往下削的高度
	const drawWidth = logicalWidth * 70; // 绘制宽度
	const drawHeight = logicalHeight * 70; // 绘制高度
	const x = (systemInfo.screenWidth - drawWidth) / 2;
	const y = (systemInfo.screenHeight - drawHeight) / 2;

	// 原三角形顶点
	const A = {
		x: x,
		y: y
	}; // 左上
	const B = {
		x: x,
		y: y + drawHeight
	}; // 左下
	const C = {
		x: x + drawWidth,
		y: y
	}; // 右上
	const D = {
		x: x + drawWidth,
		y: y + cutHeight
	}; // 右下

	ctx.beginPath();
	ctx.moveTo(A.x, A.y);
	ctx.lineTo(B.x, B.y);
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(A.x, A.y);
	ctx.lineTo(C.x, C.y);
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(D.x, D.y);
	ctx.lineTo(B.x, B.y);
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(D.x, D.y);
	ctx.lineTo(C.x, C.y);
	ctx.stroke();
	drawRuler(ctx, A.x, A.y - 10, A.x + drawWidth, A.y - 10, 'colunm', logicalWidth, 20, unit);
	drawRuler(ctx, A.x - 10, A.y, A.x - 10, A.y + drawHeight, 'row', logicalHeight, 20, unit, true);
}

function drawYzdTemplate1(ctx, {
	logicalHeight = 8,
	unit = 'm',
}) {
	const systemInfo = uni.getSystemInfoSync();
	const centerX = systemInfo.screenWidth / 2;
	const centerY = systemInfo.screenHeight / 2;
	const screenWidth = systemInfo.screenWidth;
	const screenHeight = systemInfo.screenHeight;
	ctx.setFontSize(12);
	ctx.setFillStyle('#333');
	const drawWidth = 400; // 绘制宽度
	const drawHeight = logicalHeight * 50; // 绘制高度
	const x = (systemInfo.screenWidth - drawWidth) / 2;
	const y = (systemInfo.screenHeight - drawHeight) / 2;
	const jiaodu = [0, 90, 180, 270, 0]
	const rectX = x + drawWidth / 2;
	const rectY = y;
	const rectWidth = 200
	ctx.strokeRect(rectX, rectY, rectWidth, drawHeight);
	// 绘制顶部刻度线
	ctx.beginPath();
	ctx.moveTo(rectX, rectY - 10);
	ctx.lineTo(rectX + rectWidth, rectY - 10);
	ctx.stroke();
	const dx = 50;
	for (let i = 0; i <= 4; i++) {
		const tx = rectX + i * dx;
		ctx.beginPath();
		ctx.moveTo(tx, y - 10);
		ctx.lineTo(tx, y - 17);
		ctx.stroke();

		ctx.fillText(`${jiaodu[i]}${"'"}`, tx - 10, y - 25); // 在旋转后的坐标系下写文字
	}
	drawRuler(ctx, rectX + rectWidth + 10, rectY, rectX + rectWidth + 10, rectY + drawHeight, 'row', logicalHeight, 20,
		unit);

	// 圆心坐标和半径
	const cx = x + 100;
	const cy = y + drawHeight / 2;
	const radius = 50;

	// 绘制圆
	ctx.beginPath();
	ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
	ctx.stroke();

	// 设置文字样式
	ctx.font = '14px Arial';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';

	// 绘制上下左右四个方向的文字
	ctx.fillText('0\'', cx, cy - radius - 15); // 上
	ctx.fillText('180\'', cx, cy + radius + 15); // 下
	ctx.fillText('90\'', cx + radius + 15, cy); // 右
	ctx.fillText('270\'', cx - radius - 20, cy); // 左

	// 绘制左侧朝下箭头
	const arrowX = cx - radius - 60;
	const arrowY = cy - radius;

	// 画箭头线
	ctx.beginPath();
	ctx.moveTo(arrowX, arrowY);
	ctx.lineTo(arrowX, arrowY + 100);
	ctx.stroke();

	// 画箭头头部
	ctx.beginPath();
	ctx.moveTo(arrowX - 5, arrowY + 90);
	ctx.lineTo(arrowX, arrowY + 100);
	ctx.lineTo(arrowX + 5, arrowY + 90);
	ctx.stroke();

	ctx.save(); // 保存当前状态
	ctx.translate(cx - radius - 80, cy); // 移动到文字起点
	ctx.rotate(90 * Math.PI / 180); // 旋转 90 度，让文字横着写
	ctx.fillText(`桩号增大方向`, 0, 0); // 在旋转后的坐标系下写文字
	ctx.restore(); // 恢复坐标系
}

const drawScaleSingle = (ctx, x, y, endX, endY, text, unit) => {
	ctx.beginPath();
	ctx.moveTo(x, y)
	ctx.lineTo(x + 8, y)
	ctx.stroke()

	ctx.beginPath();
	ctx.moveTo(x, y)
	ctx.lineTo(x, endY)
	ctx.stroke()

	ctx.beginPath();
	ctx.moveTo(x, endY)
	ctx.lineTo(x + 8, endY)
	ctx.stroke()
	ctx.save(); // 保存当前状态
	ctx.setFontSize(12);
	ctx.setFillStyle('#333');
	ctx.translate(x + 10, (y + endY) / 2); // 移动到文字起点
	ctx.fillText(`${text}${unit}`, 0, 0); // 在旋转后的坐标系下写文字
	ctx.restore(); // 恢复坐标系
}

export {
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
}