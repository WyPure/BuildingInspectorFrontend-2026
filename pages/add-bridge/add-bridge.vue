<template>
	<view>
    <view class="add-bridge">
      <view class="add-bridge-item">
        <view class="add-bridge-item-title">所属项目</view>
        <input class="add-bridge-item-input" :value="projectName" placeholder="请输入项目名称" placeholder-style="color: #CCCCCC;" readonly="readonly" disabled="true" />
      </view>
      <view class="add-bridge-item">
        <view class="add-bridge-item-title">父桥</view>
        <view class="select-wrapper">
          <view
            class="add-bridge-item-input display-input"
            :class="{ 'is-placeholder': !parentBridgeSelected }"
            @tap="parentBridgeOpen = true"
          >{{ parentBridgeSelected || '请选择父桥' }}</view>
          <view class="dropdown" v-if="parentBridgeOpen" @tap.stop>
            <view class="dropdown-search">
              <input class="dropdown-search-input" v-model="parentBridgeSearch" placeholder="搜索父桥" />
            </view>
            <scroll-view scroll-y class="dropdown-scroll">
              <view
                class="dropdown-item"
                v-for="item in filteredParentBridge"
                :key="item"
                @tap="selectParentBridge(item)"
              >{{ item }}</view>
              <view class="dropdown-empty" v-if="filteredParentBridge.length === 0">无匹配结果</view>
            </scroll-view>
          </view>
        </view>
      </view>
      <view class="add-bridge-item">
        <view class="add-bridge-item-title">桥梁名称</view>
        <input class="add-bridge-item-input" v-model="bridgeName" placeholder="请输入桥梁名称" placeholder-style="color: #CCCCCC;"/>
      </view>
<!--      <view class="add-bridge-item">
        <view class="add-bridge-item-title">状态</view>
        <view class="select-wrapper">
          <view
            class="add-bridge-item-input display-input"
            :class="{ 'is-placeholder': !statusSelected }"
            @tap="statusOpen = true"
          >{{ statusSelected || '请选择状态' }}</view>
          <view class="dropdown" v-if="statusOpen" @tap.stop>
            <scroll-view scroll-y class="dropdown-scroll">
              <view
                class="dropdown-item"
                v-for="item in statusOptions"
                :key="item"
                @tap="selectStatus(item)"
              >{{ item }}</view>
            </scroll-view>
          </view>
        </view>
      </view>-->
      <view class="add-bridge-item">
        <view class="add-bridge-item-title">片区</view>
        <view class="select-wrapper">
          <view
            class="add-bridge-item-input display-input"
            :class="{ 'is-placeholder': !areaSelected }"
            @tap="areaOpen = true"
          >{{ areaSelected || '请选择片区' }}</view>
          <view class="dropdown" v-if="areaOpen" @tap.stop>
            <view class="dropdown-search">
              <input class="dropdown-search-input" v-model="areaSearch" placeholder="搜索片区" />
            </view>
            <scroll-view scroll-y class="dropdown-scroll">
              <view
                class="dropdown-item"
                v-for="item in filteredArea"
                :key="item"
                @tap="selectArea(item)"
              >{{ item }}</view>
              <view class="dropdown-empty" v-if="filteredArea.length === 0">无匹配结果</view>
            </scroll-view>
          </view>
        </view>
      </view>
      <view class="add-bridge-item">
        <view class="add-bridge-item-title">线路</view>
        <view class="select-wrapper">
          <view
            class="add-bridge-item-input display-input"
            :class="{ 'is-placeholder': !lineSelected }"
            @tap="lineOpen = true"
          >{{ lineSelected || '请选择线路' }}</view>
          <view class="dropdown" v-if="lineOpen" @tap.stop>
            <view class="dropdown-search">
              <input class="dropdown-search-input" v-model="lineSearch" placeholder="搜索线路" />
            </view>
            <scroll-view scroll-y class="dropdown-scroll">
              <view
                class="dropdown-item"
                v-for="item in filteredLine"
                :key="item"
                @tap="selectLine(item)"
              >{{ item }}</view>
              <view class="dropdown-empty" v-if="filteredLine.length === 0">无匹配结果</view>
            </scroll-view>
          </view>
        </view>
      </view>
      <view class="add-bridge-item">
        <view class="add-bridge-item-title">桥梁模板</view>
        <view class="select-wrapper">
          <view
            class="add-bridge-item-input display-input"
            :class="{ 'is-placeholder': !templateSelected }"
            @tap="templateOpen = true"
          >{{ templateSelected || '请选择桥梁模板' }}</view>
          <view class="dropdown" v-if="templateOpen" @tap.stop>
            <view class="dropdown-search">
              <input class="dropdown-search-input" v-model="templateSearch" placeholder="搜索模板" />
            </view>
            <scroll-view scroll-y class="dropdown-scroll">
              <view
                class="dropdown-item"
                v-for="item in filteredTemplate"
                :key="item.id"
                @tap="selectTemplate(item)"
              >{{ item.label }}</view>
              <view class="dropdown-empty" v-if="filteredTemplate.length === 0">无匹配结果</view>
            </scroll-view>
          </view>
        </view>
      </view>
      <view class="btn-row">
        <button class="btn btn-ghost" @click="clearForm">清空</button>
        <button class="btn btn-primary" @click="confirmCreateBridge">确认</button>
      </view>
      <view v-if="anyOpen" class="overlay" @tap="closeAll"></view>
    </view>
	</view>
</template>

<script setup>
import {ref, computed, onMounted} from 'vue';
import { onLoad } from '@dcloudio/uni-app'
  import {userStore} from "@/store";
  import {idStore} from "@/store/idStorage";
import apiConfig from '../../config/api';

  const idStorageInfo = idStore();
  const userInfo = userStore();

  // 路由参数：所属项目名称
  const projectName = ref('')
  
  // 表单数据
  const bridgeName = ref('')

  // 数据源（可替换为接口返回的数据）
  const areaOptions = ref([])
  const lineOptions = ref([])
  const parentBridgeOptions = ref([])
  
  // 保存完整的原始数据，用于获取 dictValue
  const lineRawData = ref([]) // 保存线路的原始数据
  const areaRawData = ref([]) // 保存片区的原始数据
  const parentBridgeRawData = ref([]) // 保存父桥的原始数据
  // 桥梁模板：名称 + ID
  const templateOptions = ref([
    { label: '梁式桥', id: 1 },
    { label: '箱形拱桥', id: 3 },
    { label: '双曲拱桥', id: 4 },
    { label: '板拱桥', id: 5 },
    { label: '刚架拱桥', id: 6 },
    { label: '桁架拱桥', id: 7 },
    { label: '钢-混凝土组合拱桥', id: 8 },
    { label: '预应力混凝土悬索桥', id: 9 },
    { label: '预应力混凝土斜拉桥', id: 10 },
    { label: '钢箱梁斜拉桥', id: 11 },
    { label: '肋拱桥', id: 12 },
    { label: '钢箱梁悬索桥', id: 13 },
    { label: '钢桁梁悬索桥', id: 14 },
    { label: '叠合梁悬索桥', id: 15 },
    { label: '钢桁梁斜拉桥', id: 16 },
    { label: '叠合梁斜拉桥', id: 17 },
  ])

  // 片区
  const areaSelected = ref('')
  const areaSelectedValue = ref('') // 保存片区的 dictValue
  const areaSearch = ref('')
  const areaOpen = ref(false)
  const filteredArea = computed(() => {
    const q = areaSearch.value.trim().toLowerCase()
    if (!q) return areaOptions.value
    return areaOptions.value.filter(v => String(v).toLowerCase().includes(q))
  })
  const selectArea = (val) => {
    areaSelected.value = val
    // 根据选中的 dictLabel 找到对应的 dictValue
    const selectedItem = areaRawData.value.find(item => item.dictLabel === val)
    areaSelectedValue.value = selectedItem ? selectedItem.dictValue : ''
    console.log('selectedItem',selectedItem)
    console.log('areaSelectedValue',areaSelectedValue.value)
    areaSearch.value = ''
    areaOpen.value = false
  }

  // 线路
  const lineSelected = ref('')
  const lineSelectedValue = ref('') // 保存线路的 dictValue
  const lineSearch = ref('')
  const lineOpen = ref(false)
  const filteredLine = computed(() => {
    const q = lineSearch.value.trim().toLowerCase()
    if (!q) return lineOptions.value
    return lineOptions.value.filter(v => String(v).toLowerCase().includes(q))
  })
  const selectLine = (val) => {
    lineSelected.value = val
    // 根据选中的 dictLabel 找到对应的 dictValue
    const selectedItem = lineRawData.value.find(item => item.dictLabel === val)
    lineSelectedValue.value = selectedItem ? selectedItem.dictValue : ''
    console.log('selectedItem',selectedItem)
    console.log('lineSelectedValue',lineSelectedValue.value)
    lineSearch.value = ''
    lineOpen.value = false
  }

  // 父桥
  const parentBridgeSelected = ref('')
  const parentId = ref(null) // 保存父桥的 id
  const parentBridgeSearch = ref('')
  const parentBridgeOpen = ref(false)
  const filteredParentBridge = computed(() => {
    const q = parentBridgeSearch.value.trim().toLowerCase()
    if (!q) return parentBridgeOptions.value
    return parentBridgeOptions.value.filter(v => String(v).toLowerCase().includes(q))
  })
  const selectParentBridge = (val) => {
    parentBridgeSelected.value = val
    // 如果是"暂无"或不在原始数据中，则 parentId 为空值
    if (val === '暂无') {
      parentId.value = null
    } else {
      // 根据选中的 name 找到对应的 id
      const selectedItem = parentBridgeRawData.value.find(item => item.name === val)
      parentId.value = selectedItem ? selectedItem.id : null
    }
    parentBridgeSearch.value = ''
    parentBridgeOpen.value = false
    console.log('parentId',parentId.value)
  }

  // 桥梁模板
  const templateSelected = ref('') // 展示用名称
  const templateSelectedId = ref(null) // 选中模板的ID
  const templateSearch = ref('')
  const templateOpen = ref(false)
  const filteredTemplate = computed(() => {
    const q = templateSearch.value.trim().toLowerCase()
    if (!q) return templateOptions.value
    return templateOptions.value.filter(item => String(item.label).toLowerCase().includes(q))
  })
  const selectTemplate = (val) => {
    // val 现在为对象或字符串（防御处理）
    const item = typeof val === 'object' && val !== null ? val : templateOptions.value.find(o => o.label === val)
    if (item) {
      templateSelected.value = item.label
      templateSelectedId.value = item.id
    } else {
      templateSelected.value = ''
      templateSelectedId.value = null
    }
    templateSearch.value = ''
    templateOpen.value = false
  }

  // 点击空白处关闭下拉
  const closeAll = () => {
    areaOpen.value = false
    lineOpen.value = false
    templateOpen.value = false
    statusOpen.value = false
    parentBridgeOpen.value = false
  }

  const anyOpen = computed(() => areaOpen.value || lineOpen.value || templateOpen.value || statusOpen.value || parentBridgeOpen.value)
  
  // 状态（正常/停用）
  const statusOptions = ref(['正常', '停用'])
  const statusSelected = ref('')
  const statusOpen = ref(false)
  const selectStatus = (val) => {
    statusSelected.value = val
    statusOpen.value = false
  }

  // 清空表单
  const clearForm = () => {
    bridgeName.value = ''
    
    // 清空父桥
    parentBridgeSelected.value = ''
    parentId.value = null
    parentBridgeSearch.value = ''
    parentBridgeOpen.value = false
    
    // 清空片区
    areaSelected.value = ''
    areaSelectedValue.value = ''
    areaSearch.value = ''
    areaOpen.value = false
    
    // 清空线路
    lineSelected.value = ''
    lineSelectedValue.value = ''
    lineSearch.value = ''
    lineOpen.value = false
    
    // 清空桥梁模板
    templateSelected.value = ''
    templateSelectedId.value = null
    templateSearch.value = ''
    templateOpen.value = false
    
    // 清空状态
    statusSelected.value = ''
    statusOpen.value = false
  }

  // 表单验证
  const validateForm = () => {
    if (!projectName.value || !projectName.value.trim()) {
      return '请选择所属项目'
    }
    if (!bridgeName.value || !bridgeName.value.trim()) {
      return '请输入桥梁名称'
    }
    if (!parentBridgeSelected.value) {
      return '请选择父桥'
    }
    if (!areaSelected.value) {
      return '请选择片区'
    }
    if (!lineSelected.value) {
      return '请选择线路'
    }
    if (!templateSelected.value || !templateSelectedId.value) {
      return '请选择桥梁模板'
    }
    return null
  }

  const confirmCreateBridge = async () => {
    // 先验证表单
    const errorMsg = validateForm()
    if (errorMsg) {
      uni.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 2000
      })
      return
    }
    
    // 获取线路和片区的 dictValue
    const lineDictValue = lineSelectedValue.value
    const areaDictValue = areaSelectedValue.value
    
    // 获取父桥的 id
    const parentIdValue = parentId.value
    
    // 可以在这里使用获取到的值，例如打印或发送到后端
    console.log('线路 dictValue:', lineDictValue)
    console.log('片区 dictValue:', areaDictValue)
    console.log('父桥 parentId:', parentIdValue)

    const formData = {
      parentId: parentIdValue,
      name: bridgeName.value,
      area: areaDictValue,
      line: lineDictValue,
      isLeaf: "1",
      templateId: templateSelectedId.value,
      projectId: idStorageInfo.projectId,
    }
    console.log('formData',formData)

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

    const response = await uni.request({
      url: `${apiConfig.baseURL}/api/addBuilding`,
      method: 'POST',
      data: formData,
      header: {
        Authorization: token,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    console.log('response',response)
    if(response.data.code === 0){
      // 验证通过，显示成功弹窗
      uni.showModal({
        title: '提示',
        content: '新建桥梁成功，稍后会下发数据包',
        showCancel: false,
        confirmText: '确定',
        success: (res) => {
          if (res.confirm) {
            // 可以在这里添加后续操作，比如返回上一页
            uni.navigateBack()
          }
        }
      })
    }
    else{
      uni.showToast({
        title: response.data.msg,
        icon: 'none'
      });
    }

  }

  onMounted (async () => {
    // 获取 Token
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
    const lineResponse = await uni.request({
      url: `${apiConfig.baseURL}/api/dict/data/list?dictType=bi_buildeing_line`,
      method: 'POST',
      header: {
        'Authorization': token
      }
    })
    const areaResponse = await uni.request({
      url: `${apiConfig.baseURL}/api/dict/data/list?dictType=bi_building_area`,
      method: 'POST',
      header: {
        'Authorization': token
      }
    })
    const parentBuildingResponse = await uni.request({
      url: `${apiConfig.baseURL}/api/getParentBuilding`,
      method: 'POST',
      header: {
        'Authorization': token
      }
    })
    console.log(lineResponse.data)
    
    // 解析父桥列表
    const rawParentBridgeList = Array.isArray(parentBuildingResponse.data?.data)
      ? parentBuildingResponse.data.data
      : (Array.isArray(parentBuildingResponse.data)
        ? parentBuildingResponse.data
        : [])
    
    // 保存原始数据，用于后续获取 id
    parentBridgeRawData.value = rawParentBridgeList.filter(item => item && typeof item === 'object' && item.name)
    
    // 提取 name 字段作为选项
    const parentBridgeNames = parentBridgeRawData.value.map(item => item.name)
    
    // 在最前面添加"暂无"选项
    parentBridgeOptions.value = ['暂无', ...parentBridgeNames]
    
    // 解析线路列表，优先支持后端直接返回数组或包裹在 data/rows 中
    const rawList = Array.isArray(lineResponse.data)
      ? lineResponse.data
      : (Array.isArray(lineResponse.data?.data)
        ? lineResponse.data.data
        : (Array.isArray(lineResponse.data?.rows) ? lineResponse.data.rows : []))

    // 过滤有效项并按 dictSort 排序，保存原始数据
    const filteredLineData = rawList
      .filter(item => !item || typeof item !== 'object' ? false : item.status === '0')
      .sort((a, b) => (Number(a.dictSort || 0) - Number(b.dictSort || 0)))
    
    // 保存原始数据，用于后续获取 dictValue
    lineRawData.value = filteredLineData
    
    // 仅取 dictLabel 作为展示/搜索内容
    const labels = filteredLineData.map(item => item.dictLabel)
    lineOptions.value = labels
    // 若需要默认值，可在此设定：例如首项
    // if (!lineSelected.value && labels.length) lineSelected.value = labels[0]

    // 解析片区列表
    const rawAreaList = Array.isArray(areaResponse.data)
      ? areaResponse.data
      : (Array.isArray(areaResponse.data?.data)
        ? areaResponse.data.data
        : (Array.isArray(areaResponse.data?.rows) ? areaResponse.data.rows : []))

    // 过滤有效项并按 dictSort 排序，保存原始数据
    const filteredAreaData = rawAreaList
      .filter(item => !item || typeof item !== 'object' ? false : item.status === '0')
      .sort((a, b) => (Number(a.dictSort || 0) - Number(b.dictSort || 0)))
    
    // 保存原始数据，用于后续获取 dictValue
    areaRawData.value = filteredAreaData
    
    // 仅取 dictLabel 作为展示/搜索内容
    const areaLabels = filteredAreaData.map(item => item.dictLabel)
    areaOptions.value = areaLabels
    // if (!areaSelected.value && areaLabels.length) areaSelected.value = areaLabels[0]
  });

  // 获取路由参数中的 projectName
  onLoad((options) => {
    projectName.value = options?.projectName || ''
  })
</script>

<style scoped>
  .add-bridge {
    padding: 24rpx 32rpx;
    background-color: #f7f8fa;
    min-height: 100vh;
    box-sizing: border-box;
  }

  .add-bridge-item {
    display: flex;
    align-items: center;
    padding: 8rpx 14rpx;
    background-color: #ffffff;
    border-radius: 12rpx;
    margin-bottom: 8rpx;
  }

  .add-bridge-item-title {
    width: 200rpx;
    font-size: 20rpx;
    color: #333333;
    line-height: 1.2;
  }

  .add-bridge-item-input {
    flex: 1;
    height: 44rpx;
    line-height: 44rpx;
    border: 1rpx solid #e5e6eb;
    border-radius: 10rpx;
    padding: 0 12rpx;
    font-size: 20rpx;
    color: #1d2129;
    background-color: #ffffff;
    box-sizing: border-box;
  }

  .add-bridge-item-input::placeholder {
    color: #c0c4cc;
  }

  /* 只读输入框的视觉禁用效果 */
  .add-bridge-item-input[readonly] {
    background-color: #f5f7fa;
    color: #8a8f99;
    border-color: #e5e6eb;
  }

  .add-bridge-item-input[disabled] {
    background-color: #f5f7fa;
    color: #8a8f99;
    border-color: #e5e6eb;
  }

  /* 可搜索下拉选择样式 */
  .select-wrapper {
    position: relative;
    flex: 1;
  }

  .dropdown {
    position: absolute;
    left: 0;
    right: 0;
    top: 50rpx; /* 与输入框高度+间距对齐 */
    background: #ffffff;
    border: 1rpx solid #e5e6eb;
    border-radius: 10rpx;
    box-shadow: 0 6rpx 24rpx rgba(0, 0, 0, 0.06);
    z-index: 10;
  }

  .dropdown-search {
    padding: 16rpx 16rpx 0 16rpx;
  }

  .dropdown-search-input {
    height: 40rpx;
    line-height: 40rpx;
    border: 1rpx solid #e5e6eb;
    border-radius: 8rpx;
    padding: 0 12rpx;
    font-size: 18rpx;
    background-color: #fff;
  }

  .dropdown-scroll {
    max-height: 220rpx;
  }

  .dropdown-item {
    padding: 10rpx 14rpx;
    font-size: 20rpx;
    color: #1d2129;
    border-bottom: 1rpx solid #f2f3f5;
  }

  .dropdown-item:last-child {
    border-bottom-width: 0;
  }

  .dropdown-item:active {
    background-color: #f5f7fa;
  }

  .dropdown-empty {
    padding: 24rpx;
    font-size: 26rpx;
    color: #8a8f99;
    text-align: center;
  }

  /* 遮罩用于点击空白处关闭下拉 */
  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0);
    z-index: 5;
  }

  /* 确认按钮样式 */
  .confirm-btn {
    width: 100%;
    height: 84rpx;
    line-height: 84rpx;
    margin-top: 24rpx;
    background: #1677ff;
    color: #ffffff;
    border-radius: 12rpx;
    font-size: 16rpx;
  }

  .confirm-btn:active {
    background: #1463d6;
  }

  /* 展示用的“输入框”外观（不可编辑） */
  .display-input {
    display: flex;
    align-items: center;
    color: #1d2129;
  }

  .display-input.is-placeholder {
    color: #cccccc;
  }

  /* 按钮行与按钮样式 */
  .btn-row {
    display: flex;
    gap: 16rpx;
    margin-top: 16rpx;
  }

  .btn {
    flex: 1;
    height: 40rpx;
    line-height: 40rpx;
    border-radius: 5rpx;
    font-size: 16rpx;
    padding: 0 10rpx;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .btn-primary {
    background: #1677ff;
    color: #ffffff;
  }

  .btn-primary:active {
    background: #1463d6;
  }

  .btn-ghost {
    background: #ffffff;
    color: #1677ff;
    border: 1rpx solid #1677ff;
  }

  .btn-ghost:active {
    background: #f0f6ff;
  }
</style>
