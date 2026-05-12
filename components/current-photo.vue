<template>
	<view class="container">
		<!-- 状态栏 -->
		<!-- <view class="confirm-row">
		<span class="confirm-text">结构信息状态：</span>
		<span class="confirm-status" :style="{color: isCommit === 0 ? '#f56c6c': '#333'}">
			{{ isCommit === 0 ? '未提交' : isCommit === 1 ? '已提交' : '/' }}
		</span>
	</view> -->

		<view class="content-layout">
			<!-- 第一级目录 -->
			<view class="sidebar">
				<view v-for="(item, index) in structureData?.children || []" :key="index"
					:class="['sidebar-item', selectedIndex === index ? 'active' : '']" @click="changeTab(index)">
					<view class="sidebar-item-content">
						<image v-if="hasPhotos(item)" src="@/static/image/yes.png" class="menu-icon"></image>
						<text class="treeName">{{ item.name || '未命名' }}</text>
					</view>
				</view>
			</view>

			<!-- 第二级目录 -->
			<view class="sidebar second-sidebar">
				<view v-if="secondLevelItems.length > 0">
					<view v-for="(item, index) in secondLevelItems" :key="index"
						:class="['sidebar-item', selectedSecondIndex === index ? 'active' : '']"
						@click="changeSecondTab(index)">
						<view class="sidebar-item-content">
							<image v-if="hasPhotos(item)" src="@/static/image/yes.png" class="menu-icon"></image>
							<text class="treeName">{{ item.name || '未命名' }}</text>
						</view>
					</view>
				</view>
				<view v-else class="no-data-tip">
					正在加载
				</view>
			</view>

			<!-- 照片区域 -->
			<view class="photo-section">
				<!-- 桥址周边环境 → 检测情况：情况描述 + 上传图片 -->
				<view v-if="isBridgeSurroundingsNav && surroundingsInspectionLeaf" class="surroundings-pane">
					<view class="surroundings-field surroundings-field--desc">
						<view class="surroundings-desc-title-bar">
							<text class="surroundings-desc-title-text">情况描述</text>
						</view>
						<textarea
							class="surroundings-textarea"
							v-model="surroundingsInspectionLeaf.situationDescription"
							placeholder="可按实际情况修改"
							placeholder-style="color:#CCCCCC;"
							auto-height
							maxlength="2000"
							@blur="onSurroundingsFieldBlur"
						/>
					</view>
					<view class="surroundings-field surroundings-field--upload">
						<text class="surroundings-field-label">上传图片</text>
						<view class="surroundings-picker-wrap">
							<myPhotoPicker
								v-model="surroundingsInspectionLeaf.photo"
								:currentSecondIndex="selectedSecondIndex"
								:currentSecondItem="surroundingsInspectionLeaf"
								:limit="9"
								@select="(photoNumber) => handlePhotoChange(photoNumber, surroundingsInspectionLeaf)"
								@delete="handleDeletePhoto"
								@showPhotoInfo="(photoIdx) => showPhotoInfo(photoIdx)"
							/>
						</view>
					</view>
				</view>
				<template v-else>
					<view v-for="(item, index) in secondLevelItems" :key="index">
						<view class="photo-controls-wrapper">
							<myPhotoPicker v-if="selectedSecondIndex === index" v-model="item.photo"
								:currentSecondIndex=selectedSecondIndex :currentSecondItem=item
	                           @select="(photoNumber) => handlePhotoChange(photoNumber, item)" @delete="handleDeletePhoto"
								@showPhotoInfo="(photoIdx) => showPhotoInfo(photoIdx)" />
						</view>
					</view>
				</template>
			</view>
			<!--      <view class="photo-section">
				<myPhotoPicker
					v-model="photos"
					@select="handlePhotoChange"
				/>
		</view>-->
		</view>

		<!-- 弹窗 -->
		<!--		<view v-if="show" class="popup-overlay">
		<view class="edit-popup-content">
			<view class="popup-title">照片序号</view>

			<view class="edit-row">
				<text class="edit-label">结构部位</text>
				<text class="edit-value">{{ structureData?.children?.[selectedIndex]?.name || '未选中' }}</text>
			</view>

			<view class="edit-row">
				<text class="edit-label">结构名称</text>
				<text class="edit-value">{{ secondLevelItems?.[selectedSecondIndex]?.name || '未选中' }}</text>
			</view>

			<view class="edit-row">
				<text class="edit-label">照片序号</text>
				<view class="input-container">
					<textarea class="hand-input" v-model="photoNumber" :placeholder="'请输入照片序号'" auto-height />
					<image src="@/static/image/No.png" class="input-icon" @click.stop="clearInput"></image>
				</view>
			</view>

			<view class="popup-buttons">
				<view class="btn cancel-btn" @click="cancel">取消</view>
				<view class="btn confirm-btn" @click="confirm">确定</view>
			</view>
		</view>
	</view>-->

		<!-- 图片信息弹窗 -->
		<view v-if="photoInfoVisible" class="popup-overlay">
			<view class="photo-info-popup">
				<view class="popup-title">图片备注</view>
				<textarea class="photo-info-textarea" v-model="photoInfoText" placeholder="请输入备注内容" />
				<view class="popup-buttons">
					<view class="btn cancel-btn" @click="cancelPhotoInfo">取消</view>
					<view class="btn confirm-btn" @click="confirmPhotoInfo">确定</view>
				</view>
			</view>
		</view>
	</view>

</template>

<script setup>
	import {
		ref,
		computed,
		onMounted,
		watch,
		reactive
	} from 'vue';
	import {
		buildingImagesFromAbsoluteToRelative,
		getObject,
		readBridgeImage,
		removeDiseaseImage
	} from '../utils/readJsonNew';
	import {
		userStore
	} from '@/store/index.js'
	import {
		getObjectUL
	} from '../utils/readUL';
	import {
		saveBridgeImages,
		setObject
	} from '../utils/writeNew'
	import myFilePicker from '@/components/myFilePicker/myFilePicker.vue';
	import myPhotoPicker from './myPhotoPicker.vue';
	import {
		setBuildingUnCommitted
	} from "@/utils/isBuildingCommited";
	import {
		idStore
	} from "@/store/idStorage";
	import {
		setCommit0
	} from "@/utils/CurrentPhoto";
	import {
		ButtonStore
	} from '@/store/button.js';
	import {
		useObject
	} from "@/store/object";

	//桥梁id
	const TaskBridgeId = ref(0)
	const structureData = ref(null);
	const userInfo = userStore()
	const selectedIndex = ref(0);
	const selectedSecondIndex = ref(0);
	const photo = ref([]);
	const show = ref(false);
	const idStorageInfo = idStore()
	const buttonInfo = ButtonStore()
	const isCommit = ref(2)
	const objectData = useObject();

	/** 现状照：固定一级「桥址周边环境」→ 二级「检测情况」（写入 object JSON，与既有结构并存） */
	const BRIDGE_SURROUNDINGS_FIRST_ID = '__builtin_bridge_surroundings__';
	const BRIDGE_SURROUNDINGS_LEAF_ID = '__builtin_bridge_surroundings_inspection__';
	/** 检测情况「情况描述」缺省正文（新建或历史数据缺字段时写入，已保存空串不覆盖） */
	const DEFAULT_BRIDGE_SURROUNDINGS_SITUATION_DESCRIPTION =
		'桥梁安全保护区域未发生采砂、抽取地下水、采矿、采石、取土、爆破作业等危及公路桥梁安全的活动；未见生成、储存、销售易燃、易爆、剧毒、放射性等危险物品的场所、设施。';

	const ensureBridgeSurroundingsBranch = (root) => {
		if (!root || !Array.isArray(root.children)) return;
		const idx = root.children.findIndex((c) => c.id === BRIDGE_SURROUNDINGS_FIRST_ID);
		if (idx < 0) {
			root.children.push({
				id: BRIDGE_SURROUNDINGS_FIRST_ID,
				name: '桥址周边环境',
				__builtinBridgeSurroundings: true,
				children: [{
					id: BRIDGE_SURROUNDINGS_LEAF_ID,
					name: '检测情况',
					__builtinBridgeSurroundingsLeaf: true,
					photo: [],
					information: [],
					imgNoExp: [],
					situationDescription: DEFAULT_BRIDGE_SURROUNDINGS_SITUATION_DESCRIPTION,
				}],
			});
			return;
		}
		const node = root.children[idx];
		if (!node.children || !Array.isArray(node.children)) node.children = [];
		let leaf = node.children.find((c) => c.id === BRIDGE_SURROUNDINGS_LEAF_ID);
		if (!leaf) {
			leaf = {
				id: BRIDGE_SURROUNDINGS_LEAF_ID,
				name: '检测情况',
				__builtinBridgeSurroundingsLeaf: true,
				photo: [],
				information: [],
				imgNoExp: [],
				situationDescription: DEFAULT_BRIDGE_SURROUNDINGS_SITUATION_DESCRIPTION,
			};
			node.children.unshift(leaf);
		}
		if (leaf.situationDescription === undefined || leaf.situationDescription === null) {
			leaf.situationDescription = DEFAULT_BRIDGE_SURROUNDINGS_SITUATION_DESCRIPTION;
		}
		if (!leaf.photo) leaf.photo = [];
		if (!leaf.information) leaf.information = [];
		if (!leaf.imgNoExp) leaf.imgNoExp = [];
		/* 一级导航固定项始终排在最末（旧数据若插在中间则移到底部） */
		if (idx !== root.children.length - 1) {
			root.children.splice(idx, 1);
			root.children.push(node);
		}
	};

	// 确保每个二级菜单项都有独立的照片数组
	const ensurePhotoArrays = () => {
		if (!structureData.value?.children) return;

		structureData.value.children.forEach(firstLevel => {
			if (firstLevel.children) {
				firstLevel.children.forEach(secondLevel => {
					if (!secondLevel.photo) {
						secondLevel.photo = [];
					}
					if (secondLevel.id === BRIDGE_SURROUNDINGS_LEAF_ID) {
						if (secondLevel.situationDescription === undefined || secondLevel.situationDescription === null) {
							secondLevel.situationDescription = DEFAULT_BRIDGE_SURROUNDINGS_SITUATION_DESCRIPTION;
						}
					}
				});
			}
		});
	};

	// 照片变化处理函数
	const handlePhotoChange = async (photoNum, item) => {
		console.log('item.photos', item.photo);
    console.log('photoNum', photoNum)
		// 1. 先获取当前item中已有的图片的绝对路径（除了最新添加的图片）
		let oldPhotoPaths = [];
		if (item.photo.length > 1) {
			// 获取除了最后一个新添加图片外的所有图片
			oldPhotoPaths = item.photo.slice(0, item.photo.length - 1);
		}

		//传入的item.photos是上传图片的临时路径(拍照/从相册选择)
		//"_doc/uniapp_temp_1752056512594/camera/1752056522301.jpg" 拍照的临时路径
		///storage/emulated/0/Android/data/io.dcloud.HBuilder/apps/HBuilder/doc/UD25-07-06-inspector1@znjc/building/1837/images/bridge_1752056908276_1.jpg 相册选择的临时路径
		// 2. 保存图片到本地，转为相对路径存到json
		item.photo = await saveBridgeImages(userInfo.username, TaskBridgeId.value, item.photo);
		item.information.push(item.name);
    if(item.imgNoExp === undefined){
      item.imgNoExp = [];
    }
    if (item.photo.length !== item.imgNoExp.length + 1) {
      // 计算需要补充的空字符串数量
      const targetLength = item.photo.length - 1;
      const needAdd = targetLength - item.imgNoExp.length;

      // 如果需要补充，添加相应数量的空字符串
      if (needAdd > 0) {
        for (let i = 0; i < needAdd; i++) {
          item.imgNoExp.push('');
        }
      }
    }
    item.imgNoExp.push(photoNum);

		// 3. 转为绝对路径显示
		item.photo = await readBridgeImage(userInfo.username, TaskBridgeId.value, item.photo);

		// 4. 保存结构数据到json
		await autoSavePhotos();

		// 5. 删除旧的物理文件以避免重复
		if (oldPhotoPaths.length > 0) {
			try {
				const deleteResult = await removeDiseaseImage(oldPhotoPaths);
				console.log('删除旧图片结果:', deleteResult);
			} catch (error) {
				console.error('删除旧图片失败:', error);
			}
		}
	};

	const autoSavePhotos = async () => {
		try {
			if (structureData.value && structureData.value.children) {
				for (const firstLevel of structureData.value.children) {
					if (firstLevel.children) {
						for (const secondLevel of firstLevel.children) {
							if (!secondLevel.photo) {
								secondLevel.photo = [];
							} else {
								secondLevel.photo = await buildingImagesFromAbsoluteToRelative(secondLevel.photo);
							}
						}
					}
				}
			}
			console.log('保存到全局变量的structureData.value', structureData.value)

			objectData.setData(JSON.parse(JSON.stringify(structureData.value)))
			await setObject(userInfo.username, TaskBridgeId.value, structureData.value);
			if (structureData.value && structureData.value.children) {
				for (const firstLevel of structureData.value.children) {
					if (firstLevel.children) {
						for (const secondLevel of firstLevel.children) {
							if (!secondLevel.photo) {
								secondLevel.photo = [];
							} else {
								secondLevel.photo = await readBridgeImage(userInfo.username, TaskBridgeId.value,
									secondLevel.photo);
							}
						}
					}
				}
			}
			await setBuildingUnCommitted(userInfo.username, idStorageInfo.projectId, idStorageInfo.buildingId);
			uni.$emit('setBuildingUnCommit', idStorageInfo.buildingId)
			isCommit.value = 0;
			await setCommit0(userInfo.username, idStorageInfo.buildingId)
			console.log('照片数据已保存');
		} catch (error) {
			console.error('保存照片数据失败:', error);
			uni.showToast({
				title: '保存失败',
				icon: 'error',
				duration: 1500
			});
		}
		uni.$emit('currentPhotoStatusChanged')
	};

	// 添加hasPhotos函数来检查菜单项是否有照片（含桥址周边环境文字描述）
	const hasPhotos = (item) => {
		if (item.photo && item.photo.length > 0) {
			return true;
		}
		if (item.id === BRIDGE_SURROUNDINGS_LEAF_ID || item.__builtinBridgeSurroundingsLeaf) {
			const d = item.situationDescription;
			if (typeof d === 'string' && d.trim()) {
				return true;
			}
		}

		if (item.children && item.children.length > 0) {
			return item.children.some(child => hasPhotos(child));
		}

		return false;
	};

	// 处理删除照片事件
	/* 	const handleDeletePhoto = async (data) => {
		try {
			const {
				index,
				image
			} = data;
			// 先确保选中的二级菜单项存在
			const secondLevelItem = secondLevelItems.value[selectedSecondIndex.value];
			if (!secondLevelItem) return;
			
			// 记录详细日志，用于调试
			console.log('===== 删除照片开始 =====');
			console.log('删除的索引:', index);
			console.log('删除前照片数组长度:', secondLevelItem.photo ? secondLevelItem.photo.length : 0);
			console.log('删除前照片数组:', JSON.stringify(secondLevelItem.photo));
			console.log('删除前信息数组:', JSON.stringify(secondLevelItem.information));
			
			// 确保photo和information字段是数组
			if (!secondLevelItem.photo || !Array.isArray(secondLevelItem.photo)) {
				secondLevelItem.photo = [];
				console.log('初始化空照片数组');
			}
			
			if (!secondLevelItem.information || !Array.isArray(secondLevelItem.information)) {
				secondLevelItem.information = new Array(secondLevelItem.photo.length).fill('');
				console.log('初始化空信息数组');
			}
			
			// 检查并修正图片路径，避免路径重复拼接
			let imagePath = image;
			
			// 检查路径是否包含多个file:///
			if (imagePath.includes('file:///') && imagePath.indexOf('file:///') !== 0) {
				imagePath = 'file:///' + imagePath.substring(imagePath.lastIndexOf('/storage'));
			}
			
			// 检查路径是否重复包含/storage/emulated/0
			const storagePattern = /\/storage\/emulated\/0/g;
			const matches = imagePath.match(storagePattern);
			if (matches && matches.length > 1) {
				// 只保留最后一个完整路径
				imagePath = 'file:///storage/emulated/0' + imagePath.substring(imagePath.lastIndexOf('/Pictures'));
			}
			
			console.log('修正后的图片路径:', imagePath);

			// 调用removeDiseaseImage删除文件
			const result = await removeDiseaseImage(imagePath);
			console.log('删除文件结果:', result);

			// 创建照片数组和信息数组的副本
			const photosCopy = Array.isArray(secondLevelItem.photo) ? [...secondLevelItem.photo] : [];
			const infoCopy = Array.isArray(secondLevelItem.information) ? 
				[...secondLevelItem.information] : 
				new Array(photosCopy.length).fill('');
			
			console.log('删除前副本照片数组长度:', photosCopy.length);
			console.log('删除前副本信息数组长度:', infoCopy.length);
			
			// 删除特定索引的照片和信息
			if (index >= 0 && index < photosCopy.length) {
				photosCopy.splice(index, 1);
				console.log('删除照片后数组长度:', photosCopy.length);
			} else {
				console.error('删除照片索引超出范围:', index, photosCopy.length);
			}
			
			if (index >= 0 && index < infoCopy.length) {
				infoCopy.splice(index, 1);
				console.log('删除信息后数组长度:', infoCopy.length);
			} else {
				console.error('删除信息索引超出范围:', index, infoCopy.length);
			}
			
			console.log('删除后副本照片数组长度:', photosCopy.length);
			console.log('删除后副本信息数组长度:', infoCopy.length);
			console.log('删除后副本照片数组:', JSON.stringify(photosCopy));
			console.log('删除后副本信息数组:', JSON.stringify(infoCopy));
			
			// 创建一个新的对象，避免引用问题
			const updatedStructureData = JSON.parse(JSON.stringify(structureData.value));
			
			// 获取当前一级和二级菜单项
			const firstLevelItem = updatedStructureData.children[selectedIndex.value];
			if (!firstLevelItem || !firstLevelItem.children) {
				throw new Error('无法找到要更新的菜单项');
			}
			
			const updatedSecondLevelItem = firstLevelItem.children[selectedSecondIndex.value];
			if (!updatedSecondLevelItem) {
				throw new Error('无法找到要更新的二级菜单项');
			}
			
			// 确保updatedSecondLevelItem.photo是数组
			if (!updatedSecondLevelItem.photo || !Array.isArray(updatedSecondLevelItem.photo)) {
				updatedSecondLevelItem.photo = [];
			}
			
			// 确保updatedSecondLevelItem.information是数组
			if (!updatedSecondLevelItem.information || !Array.isArray(updatedSecondLevelItem.information)) {
				updatedSecondLevelItem.information = [];
			}
			
			// 直接替换照片数组和信息数组
			updatedSecondLevelItem.photo = [...photosCopy];
			updatedSecondLevelItem.information = [...infoCopy];
			
			console.log('更新结构数据前照片数组长度:', updatedSecondLevelItem.photo.length);
			console.log('更新结构数据前信息数组长度:', updatedSecondLevelItem.information.length);
			
			// 将照片路径转为相对路径
			if (updatedSecondLevelItem.photo.length > 0) {
				try {
					const relativePhotos = await buildingImagesFromAbsoluteToRelative(updatedSecondLevelItem.photo);
					console.log('相对路径照片数组长度:', relativePhotos.length);
					console.log('相对路径照片数组:', JSON.stringify(relativePhotos));
					updatedSecondLevelItem.photo = relativePhotos;
				} catch (error) {
					console.error('转换相对路径失败:', error);
					// 如果转换失败，使用空数组
					updatedSecondLevelItem.photo = [];
				}
			}
			
			console.log('保存前结构数据照片数组长度:', updatedSecondLevelItem.photo.length);
			console.log('保存前结构数据信息数组长度:', updatedSecondLevelItem.information.length);
			
			// 保存更新后的数据
			await setObject(userInfo.username, TaskBridgeId.value, updatedStructureData);
			
			// 更新结构数据
			structureData.value = updatedStructureData;
			
			// 重新加载照片（绝对路径）
			if (updatedSecondLevelItem.photo.length > 0) {
				try {
					const absolutePhotos = await readBridgeImage(userInfo.username, TaskBridgeId.value, updatedSecondLevelItem.photo);
					console.log('绝对路径照片数组长度:', absolutePhotos.length);
					console.log('绝对路径照片数组:', JSON.stringify(absolutePhotos));
					secondLevelItem.photo = absolutePhotos;
				} catch (error) {
					console.error('读取绝对路径失败:', error);
					// 如果读取失败，使用空数组
					secondLevelItem.photo = [];
				}
			} else {
				secondLevelItem.photo = [];
			}
			
			// 同步更新信息数组
			secondLevelItem.information = [...updatedSecondLevelItem.information];
			
			console.log('更新后照片数组长度:', secondLevelItem.photo.length);
			console.log('更新后信息数组长度:', secondLevelItem.information.length);
			console.log('更新后照片数组:', JSON.stringify(secondLevelItem.photo));
			console.log('更新后信息数组:', JSON.stringify(secondLevelItem.information));
			console.log('===== 删除照片结束 =====');
			
			// 显示操作结果
			if (result.success) {
				uni.showToast({
					title: '删除成功',
					icon: 'success',
					duration: 1500
				});
			} else {
				uni.showToast({
					title: '已从列表移除',
					icon: 'none',
					duration: 1500
				});
			}
		} catch (error) {
			console.error('处理删除照片时出错:', error);
			uni.showToast({
				title: '删除失败',
				icon: 'error',
				duration: 1500
			});
		}
	};
	*/

	// 处理删除照片事件
	const handleDeletePhoto = async (data) => {
		try {
			const {
				index,
				image
			} = data;
			// 先确保选中的二级菜单项存在
			const secondLevelItem = secondLevelItems.value[selectedSecondIndex.value];
			if (!secondLevelItem) return;
			console.log('删除的照片', image);

			// 调用removeDiseaseImage删除文件
			const result = await removeDiseaseImage(image);

			if (result.success) {
				console.log('删除照片成功', index);
				// 从数据中删除对应的图片记录
				// secondLevelItem.photo.splice(index, 0);
				// 保存json时将绝对路径转为相对路径存储
				// secondLevelItem.photos = await buildingImagesFromAbsoluteToRelative(secondLevelItem.photos);
				// 更新数据
				secondLevelItem.information.splice(index, 1);
        if(secondLevelItem.imgNoExp !== undefined){
          secondLevelItem.imgNoExp.splice(index, 1);
        }
				await autoSavePhotos();
				// 读取相对路径为绝对路径
				/*secondLevelItem.photos = await readBridgeImage(userInfo.username, TaskBridgeId.value,
					secondLevelItem.photos)*/
			} else {
				console.error('删除照片失败:', result.error);
				uni.showToast({
					title: '删除失败',
					icon: 'error',
					duration: 1500
				});
			}
		} catch (error) {
			console.error('处理删除照片时出错:', error);
			uni.showToast({
				title: '删除失败',
				icon: 'error',
				duration: 1500
			});
		}
	};

	// 通过计算属性获取URL中的bridgeId参数
	const bridgeIdFromURL = computed(() => {
		const pages = getCurrentPages();
		if (pages.length > 0) {
			const currentPage = pages[pages.length - 1];
			const options = currentPage.$page?.options;

			if (options && options.bridgeId) {
				return options.bridgeId;
			}
		}
		return 0;
	});

	const init = async () => {
		console.log('=== init 函数开始执行 ===');
		if (bridgeIdFromURL.value) {
			TaskBridgeId.value = bridgeIdFromURL.value;
		}
		try {
			// const latestData = await getObjectUL(userInfo.username, TaskBridgeId.value);
			// console.log('获取到的原始数据:', JSON.stringify(latestData));
			// const latestData = objectData.getData();
			console.log('获取到的全局变量数据:', objectData.getData())
			const latestData = JSON.parse(JSON.stringify(objectData.getData()));
			console.log('获取到的现状照数据:', latestData);


			// 确保数据结构完整
			if (!latestData) {
				throw new Error('获取数据失败');
			}

			if (!latestData.children) {
				latestData.children = [];
			}

			ensureBridgeSurroundingsBranch(latestData);

			// 初始化照片数组
			if (latestData.children) {
				for (const firstLevel of latestData.children) {
					if (!firstLevel.children) {
						firstLevel.children = [];
					}

					for (const secondLevel of firstLevel.children) {
						// 确保photo字段是数组
						if (!secondLevel.photo || !Array.isArray(secondLevel.photo)) {
							secondLevel.photo = [];
							console.log('初始化空照片数组');
						} else if (secondLevel.photo.length > 0) {
							try {
								console.log('读取照片前:', JSON.stringify(secondLevel.photo));
								secondLevel.photo = await readBridgeImage(userInfo.username, TaskBridgeId.value,
									secondLevel.photo);
								console.log('读取照片后:', JSON.stringify(secondLevel.photo));
							} catch (error) {
								console.error('读取照片失败:', error);
								// 如果读取失败，重置为空数组
								secondLevel.photo = [];
							}
						}

						// 确保information字段是数组
						if (!secondLevel.information || !Array.isArray(secondLevel.information)) {
							secondLevel.information = [];
						}

						// 确保information数组长度与照片数组匹配
						while (secondLevel.information.length < secondLevel.photo.length) {
							secondLevel.information.push('');
						}
						while (secondLevel.information.length > secondLevel.photo.length) {
							secondLevel.information.pop();
						}
					}
				}
			}

			structureData.value = latestData;
			if (structureData.value.commit !== undefined) {
				isCommit.value = structureData.value.commit;
			}

			selectedIndex.value = 0;
			selectedSecondIndex.value = 0;

			// 确保所有二级菜单项都有独立的照片数组
			ensurePhotoArrays();

			objectData.setData(JSON.parse(JSON.stringify(structureData.value)));

			// console.log('初始化完成，结构数据:', JSON.stringify(structureData.value));
		} catch (error) {
			console.error('获取数据失败:', error);
			uni.showToast({
				title: '数据加载失败',
				icon: 'error',
				duration: 1500
			});
		}
	};

	const changeTab = (index) => {
		selectedIndex.value = index;
		selectedSecondIndex.value = 0;
	};

	// 计算第二个侧边栏的数据
	const secondLevelItems = computed(() => {
		if (!structureData.value?.children?.[selectedIndex.value]?.children) {
			return [];
		}
		return structureData.value.children[selectedIndex.value].children;
	});

	const isBridgeSurroundingsNav = computed(() => {
		const ch = structureData.value?.children?.[selectedIndex.value];
		return ch?.id === BRIDGE_SURROUNDINGS_FIRST_ID;
	});

	const surroundingsInspectionLeaf = computed(() => {
		if (!isBridgeSurroundingsNav.value) return null;
		const ch = structureData.value?.children?.[selectedIndex.value];
		const leaf = ch?.children?.find((c) => c.id === BRIDGE_SURROUNDINGS_LEAF_ID);
		return leaf || null;
	});

	const onSurroundingsFieldBlur = async () => {
		try {
			await autoSavePhotos();
		} catch (e) {
			console.error('桥址周边环境描述保存失败', e);
		}
	};

	const changeSecondTab = async (index) => {
		selectedSecondIndex.value = index;
	};

	onMounted(async () => {
		if (bridgeIdFromURL.value) {
			TaskBridgeId.value = bridgeIdFromURL.value;
		}
		// 设置图片信息按钮显示，确保只在current-photo页面显示
		buttonInfo.showPhotoInfo();
		await init();
	});

	// 打开弹窗
	const dowindow = () => {
		show.value = true;
		photoNumber.value = '';
	};

	// 取消弹窗
	const cancel = () => {
		show.value = false;
	};

	// 确认弹窗
	const confirm = () => {
		if (photoNumber.value.trim()) {
			console.log('确认照片序号:', photoNumber.value);
		}
		show.value = false;
	};

	// 清空输入框
	const clearInput = () => {
		photoNumber.value = '';
	};

	const props = defineProps({
		activeTabTop: {
			type: Number,
			default: 0
		}
	});

	watch(() => props.activeTabTop, async (newval, oldval) => {
		if (newval == 3) {
			console.log('当前activeTabTop为：', newval) // 使用newval而不是activeTabTop
			// 设置图片信息按钮显示，确保只在current-photo页面显示
			buttonInfo.showPhotoInfo();
			// 添加延时确保页面已完全显示
			setTimeout(async () => {
				await init();
			}, 300);
		}
	}, {
		immediate: true
	}) // 添加immediate:true确保首次加载时也会执行

	const photoInfoVisible = ref(false);
	const photoInfoText = ref('');

	// 添加当前编辑的照片索引
	const currentEditingPhotoIndex = ref(-1);

	// 显示图片信息弹窗
	const showPhotoInfo = (photoIndex) => {
		// 保存当前编辑的照片索引
		currentEditingPhotoIndex.value = photoIndex;

		// 获取当前选中的二级菜单项
		const secondLevelItem = secondLevelItems.value[selectedSecondIndex.value];
		if (!secondLevelItem) return;

		// 确保information是数组
		if (!secondLevelItem.information) {
			secondLevelItem.information = [];
		}

		if (!Array.isArray(secondLevelItem.information)) {
			secondLevelItem.information = new Array(secondLevelItem.photo.length).fill('');
		}

		// 确保information数组长度与照片数组匹配
		while (secondLevelItem.information.length < secondLevelItem.photo.length) {
			secondLevelItem.information.push('');
		}

		// 获取特定照片的信息
		photoInfoText.value = secondLevelItem.information[photoIndex] || '';

		photoInfoVisible.value = true;
	};

	// 取消图片信息弹窗
	const cancelPhotoInfo = () => {
		photoInfoVisible.value = false;
		currentEditingPhotoIndex.value = -1; // 重置编辑索引
		buttonInfo.showPhotoInfo();
	};

	// 确认图片信息
	const confirmPhotoInfo = async () => {
		try {
			// 获取当前选中的二级菜单项
			const secondLevelItem = secondLevelItems.value[selectedSecondIndex.value];
			if (!secondLevelItem) return;

			// 确保information是数组
			if (!secondLevelItem.information) {
				secondLevelItem.information = [];
			}

			if (!Array.isArray(secondLevelItem.information)) {
				secondLevelItem.information = new Array(secondLevelItem.photo.length).fill('');
			}

			// 确保information数组长度与照片数组匹配
			while (secondLevelItem.information.length < secondLevelItem.photo.length) {
				secondLevelItem.information.push('');
			}
			buttonInfo.showPhotoInfo();
			photoInfoVisible.value = false;

			// 更新特定照片的信息
			if (currentEditingPhotoIndex.value >= 0 && currentEditingPhotoIndex.value < secondLevelItem.information
				.length) {
				secondLevelItem.information[currentEditingPhotoIndex.value] = photoInfoText.value;

				// 发送事件通知myPhotoPicker组件更新按钮内容
				uni.$emit('photoInfoUpdated', {
					structureData: structureData.value,
					firstIndex: selectedIndex.value,
					secondIndex: selectedSecondIndex.value
				});
			}
			if (structureData.value && structureData.value.children) {
				for (const firstLevel of structureData.value.children) {
					if (firstLevel.children) {
						for (const secondLevel of firstLevel.children) {
							if (!secondLevel.photo) {
								secondLevel.photo = [];
							} else {
								secondLevel.photo = await buildingImagesFromAbsoluteToRelative(secondLevel.photo);
							}
						}
					}
				}
			}

			objectData.setData(JSON.parse(JSON.stringify(structureData.value)))
			console.log('保存数据:', structureData.value)
			// 保存数据
			await setObject(userInfo.username, TaskBridgeId.value, structureData.value);
			if (structureData.value && structureData.value.children) {
				for (const firstLevel of structureData.value.children) {
					if (firstLevel.children) {
						for (const secondLevel of firstLevel.children) {
							if (!secondLevel.photo) {
								secondLevel.photo = [];
							} else {
								secondLevel.photo = await readBridgeImage(userInfo.username, TaskBridgeId.value,
									secondLevel.photo);
							}
						}
					}
				}
			}

			// 设置为未提交状态
			await setBuildingUnCommitted(userInfo.username, idStorageInfo.projectId, idStorageInfo.buildingId);
			uni.$emit('setBuildingUnCommit', idStorageInfo.buildingId);
			isCommit.value = 0;
			await setCommit0(userInfo.username, idStorageInfo.buildingId);

			// 显示图片信息按钮
			// buttonInfo.showPhotoInfo();

			// photoInfoVisible.value = false;
		} catch (error) {
			console.error('保存图片信息失败:', error);
			uni.showToast({
				title: '保存失败',
				icon: 'error',
				duration: 1500
			});
		}
	};
</script>

<style scoped>
	.active {
		position: relative;
	}

	.active::before {
		content: '';
		position: absolute;
		left: 0;
		top: 17%;
		height: 66%;
		width: 3rpx;
		background-color: #0F4687;
	}

	.active .treeName {
		color: #0F4687 !important;
	}

	.container {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		bottom: 0;
	}

	.content-layout {
		height: 100%;
		display: flex;
		flex: 1;
		overflow: hidden;
	}

	.confirm-row {
		width: 100%;
		background-color: #BDCBE0;
		font-size: 20rpx;
		display: flex;
		align-items: center;
		justify-content: flex-start;
		padding: 10rpx;
		box-sizing: border-box;
	}

	.confirm-text {
		text-align: center;
		font-size: 20px;
		color: #333;
	}

	.confirm-status {
		text-align: center;
		font-size: 20px;
	}

	.sidebar-item {
		padding: 20rpx 0;
		text-align: left;
		color: #666;
		border-bottom: 1px solid #eeeeee;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		min-height: 56rpx;
		justify-content: center;
		position: relative;
		box-sizing: border-box;
	}

	.sidebar-item-content {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		padding-left: 12rpx;
		padding-right: 4rpx;
		width: 100%;
		box-sizing: border-box;
	}

	/* 侧边栏样式 */
	.sidebar {
		width: 127rpx;
		flex-shrink: 0;
		background-color: #f5f5f5;
		border-right: 1rpx solid #eeeeee;
		height: 100%;
		display: flex;
		flex-direction: column;
		overflow-y: auto;
	}

	.second-sidebar {
		background-color: #fafafa;
		width: 127rpx;
		flex-shrink: 0;
		overflow-y: auto;
	}

	.treeName {
		margin-left: 4rpx;
		font-size: 15rpx;
		line-height: 1.4;
		flex: 1;
		min-width: 0;
		word-break: break-all;
		white-space: normal;
	}

	/* 添加无数据提示样式 */
	.no-data-tip {
		padding: 30rpx;
		text-align: center;
		color: #999;
		font-size: 24rpx;
	}

	/* 菜单图标样式 */
	.menu-icon {
		width: 15rpx;
		height: 15rpx;
		margin-right: 5rpx;
		flex-shrink: 0;
	}

	/* 照片区域 */
	.photo-section {
		flex: 1;
		padding: 20rpx;
		overflow-y: auto;
	}

	/* 照片控件包装器，确保拍照控件和图片信息按钮一起显示 */
	.photo-controls-wrapper {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	/* 弹窗样式 */
	.popup-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 999;
	}

	.edit-popup-content {
		background-color: #fff;
		padding: 0;
		width: 500rpx;
		border-radius: 10rpx;
		overflow: hidden;
	}

	.popup-title {
		font-size: 20rpx;
		text-align: center;
		color: #333;
		background-color: #BDCBE0;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.edit-row {
		display: flex;
		align-items: center;
		margin: 20rpx 30rpx;
		padding-bottom: 20rpx;
		border-bottom: 1px solid #eee;
	}

	.edit-row:last-child {
		border-bottom: none;
		margin-bottom: 0;
		padding-bottom: 0;
	}

	.edit-label {
		font-size: 20rpx;
		color: #666;
		width: 150rpx;
		flex-shrink: 0;
		display: flex;
		align-items: center;
	}

	.edit-value {
		font-size: 20rpx;
		color: #333;
		flex: 1;
		margin-left: 10rpx;
	}

	.hand-input {
		flex: 1;
		border: 1px solid #ddd;
		border-radius: 0;
		padding: 5rpx;
		height: 20rpx;
		line-height: 20rpx;
		font-size: 20rpx;
		box-sizing: border-box;
		min-height: 20rpx;
		width: 100%;
	}

	.input-container {
		display: flex;
		align-items: center;
		flex: 1;
		margin-left: 10rpx;
		position: relative;
	}

	.input-icon {
		width: 20rpx;
		height: 20rpx;
		position: absolute;
		right: 5rpx;
		top: 50%;
		transform: translateY(-50%);
		z-index: 1;
		cursor: pointer;
	}

	.popup-buttons {
		display: flex;
		justify-content: center;
		gap: 40rpx;
		margin-top: 20rpx;
		padding: 0 30rpx 20rpx;
	}

	.btn {
		width: 100rpx;
		height: 50rpx;
		font-size: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 8rpx;
		margin: 0;
	}

	.cancel-btn {
		background-color: #fff;
		color: #1677FF;
		border: 1px solid #1677FF;
	}

	.confirm-btn {
		background-color: #1677FF;
		color: #fff;
		border: none;
	}

	/* 照片选择器区域 */
	.photo-section {
		flex: 1;
		padding: 20rpx;
		overflow-y: auto;
	}

	/* 图片信息按钮样式 */
	.button-container {
		display: flex;
		justify-content: flex-start;
		width: 100%;
		padding: 10rpx 0;
	}

	.info-button {
		width: 200rpx;
		height: 60rpx;
		background-color: #BDCBE0;
		color: #333;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 8rpx;
		font-size: 24rpx;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
		border: none;
	}

	/* 图片信息弹窗样式 */
	.photo-info-popup {
		background-color: #fff;
		padding: 0;
		width: 600rpx;
		border-radius: 10rpx;
		overflow: hidden;
	}

	.photo-info-textarea {
		width: 100%;
		height: 300rpx;
		padding: 20rpx;
		border: none;
		border-top: 1px solid #eee;
		border-bottom: 1px solid #eee;
		font-size: 28rpx;
		box-sizing: border-box;
	}

	/* 桥址周边环境 → 检测情况 */
	.surroundings-pane {
		width: 100%;
		box-sizing: border-box;
	}

	.surroundings-field {
		margin-bottom: 24rpx;
	}

	.surroundings-field--desc {
		border: 1rpx solid #e5e5e5;
		border-radius: 8rpx;
		overflow: hidden;
	}

	.surroundings-field--upload {
		margin-bottom: 0;
	}

	.surroundings-field-label {
		display: block;
		font-size: 20rpx;
		color: #333;
		margin-bottom: 12rpx;
	}

	.surroundings-desc-title-bar {
		width: 100%;
		box-sizing: border-box;
		background-color: #e3efff;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 8rpx 12rpx;
	}

	.surroundings-desc-title-text {
		font-size: 18rpx;
		line-height: 1.25;
		color: #333;
	}

	.surroundings-field--desc .surroundings-textarea {
		border: none;
		border-radius: 0;
	}

	.surroundings-textarea {
		width: 100%;
		min-height: 160rpx;
		padding: 16rpx;
		font-size: 18rpx;
		line-height: 1.5;
		color: #333333;
		background-color: #fff;
		border: 1rpx solid #e5e5e5;
		border-radius: 8rpx;
		box-sizing: border-box;
	}

	.surroundings-picker-wrap {
		width: 100%;
		box-sizing: border-box;
	}
</style>