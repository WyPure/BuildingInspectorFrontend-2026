function generateDiseaseDescription(data) {
	const {
		componentName, // 构件名称
		componentCode, // 构件编号
		showColumns, // 是否显示裂缝特征
		diseaseType, // 病害类型
		diseasePosition, // 病害位置
		positionNumber, // 位置编号
		mileageStation1, // 里程桩号（公里）
		mileageStation2, // 里程桩号（米）
		crackType, // 裂缝特征（可选）
		defects = [], // 缺损数据数组
		counts = 0, // 病害数量（可选）
		units, // 单位
		threshold,// 阈值
	} = data;

	const count = defects.length;
	if (count === 0) return '还未填写病害数据';
	// 先计算里程部分
	const mileageText = (() => {
		const hasMileage = mileageStation1 !== '' || mileageStation2 !== '';
		if (!hasMileage) return '';
		return `K${mileageStation1 || '0'}+${mileageStation2 || '0'}处，`;
	})();

	let description = '';
	if(showColumns[0] == 1 && crackType) {
		description = `${componentCode}#${componentName.replace(/[（(].*[）)]/g, '')}${componentName !== diseasePosition ? (positionNumber ? `第${positionNumber}#` : '') + diseasePosition : ''}${mileageText}${crackType}裂缝${counts > 0 ? `${counts}` : ''}${units !== '' ? `${units}` : '个'}`;

	}else{
		description = `${componentCode}#${componentName.replace(/[（(].*[）)]/g, '')}${componentName !== diseasePosition ? (positionNumber ? `第${positionNumber}#` : '') + diseasePosition : ''}${mileageText}${diseaseType.split('#')[1] || diseaseType}${counts > 0 ? `${counts}` : ''}${units !== '' ? `${units}` : '个'}`;
	}
	// description = `${componentCode}#${componentName.replace(/[（(].*[）)]/g, '')}${componentName !== diseasePosition ? (positionNumber ? `第${positionNumber}#` : '') + diseasePosition : ''}${mileageText}${diseaseType.split('#')[1] || diseaseType}${counts > 0 ? `${counts}` : ''}${units !== '' ? `${units}` : '个'}`;
	// if (showColumns[0] == 1 && crackType) description += `，${crackType}裂缝`;
	let descriptionArr = [];

	if (counts < threshold) {
		const details = defects.map((item, index) => {
			// 多条时仅作为前缀展示序号，不参与 join 分隔符
			// 检查字段是否存在内容再拼接
			if (showColumns[8] == 1 && item.reference1Location && item.reference1LocationStart) {
				descriptionArr.push(`距${item.reference1Location} ${item.reference1LocationStart}m`);
			}
			if (showColumns[9] == 1 && item.reference2Location && item.reference2LocationStart) {
				descriptionArr.push(`距${item.reference2Location} ${item.reference2LocationStart}m`);
			}
			if (showColumns[1] == 1 && item.length1) {
				if(crackType === 'L型'){
					descriptionArr.push(`L1=${item.length1}m`);
					descriptionArr.push(`L2=${item.length2}m`);
				}
				else if(crackType === 'U型'){
					descriptionArr.push(`L1=${item.length1}m`);
					descriptionArr.push(`L2=${item.length2}m`);
					descriptionArr.push(`L3=${item.length3}m`);
				}else{
					descriptionArr.push(`L=${item.length1}m`);
				}
			}
			if (showColumns[2] == 1 && item.crackWidth) {
				descriptionArr.push(`W=${item.crackWidth}mm`);
			}
			if (showColumns[3] == 1 && item.heightDepth) {
				descriptionArr.push(`高度/深度：${item.heightDepth}m`);
			}
			if (showColumns[4] == 1 && item.areaLength && item.areaWidth) {
				const areaLabel = counts >= 2 ? `_${index + 1}` : '';
				descriptionArr.push(`面积S${areaLabel}=${item.areaLength}×${item.areaWidth}m²`);
			}
			if (showColumns[5] == 1 && item.deformation) {
				descriptionArr.push(`变形/位移：${item.deformation}m`);
			}
			if (showColumns[6] == 1 && item.angle) {
				descriptionArr.push(`角度：${item.angle}度`);
			}
			if (showColumns[7] == 1 && item.numeratorRatio && item.denominatorRatio) {
				descriptionArr.push(`比例：${item.numeratorRatio}/${item.denominatorRatio}`);
			}
			const prefix = counts >= 2 ? `（${index + 1}）` : '';
			const result = `${prefix}${descriptionArr.join('，')}`;
			descriptionArr = [];
			return result;
		}).join('；');

		return `${description}，${details}`;
	} else {
		const item = defects[0];
		// 检查字段是否存在内容再拼接
		if (showColumns[8] == 1 && item.reference1Location && item.reference1LocationStart) {
			descriptionArr.push(`距${item.reference1Location} ${item.reference1LocationStart}m`);
		}
		if (showColumns[9] == 1 && item.reference2Location && item.reference2LocationStart) {
			descriptionArr.push(`距${item.reference2Location} ${item.reference2LocationStart}m`);
		}
		if (showColumns[1] == 1 && item.lengthRangeStart && item.lengthRangeEnd) {
			descriptionArr.push(`长度L=${item.lengthRangeStart}~${item.lengthRangeEnd}m`);
		}
		if (showColumns[2] == 1 && item.crackWidthRangeStart && item.crackWidthRangeEnd) {
			descriptionArr.push(`缝宽：${item.crackWidthRangeStart}~${item.crackWidthRangeEnd}mm`);
		}
		if (showColumns[3] == 1 && item.heightDepthRangeStart && item.heightDepthRangeEnd) {
			descriptionArr.push(`高度/深度：${item.heightDepthRangeStart}~${item.heightDepthRangeEnd}m`);
		}
		if (showColumns[4] == 1 && item.areaLength && item.areaWidth) {
			const areaLabel = item.areaIdentifier == 1 ? '均' : item.areaIdentifier == 2 ? '总' : item.areaIdentifier;
			descriptionArr.push(`面积S_${areaLabel}=${item.areaLength}×${item.areaWidth}m²`);
		}
		if (showColumns[5] == 1 && item.deformationRangeStart && item.deformationRangeEnd) {
			descriptionArr.push(`变形/位移：${item.deformationRangeStart}~${item.deformationRangeEnd}m`);
		}
		if (showColumns[6] == 1 && item.angleRangeStart && item.angleRangeEnd) {
			descriptionArr.push(`角度：${item.angleRangeStart}~${item.angleRangeEnd}度`);
		}
		if (showColumns[7] == 1 && item.numeratorRatio && item.denominatorRatio) {
			descriptionArr.push(`比例：${item.numeratorRatio}/${item.denominatorRatio}`);
		}

		const result = descriptionArr.join('，');
		descriptionArr = [];
		return `${description}，${result}`;
	}
}

export {
	generateDiseaseDescription
}