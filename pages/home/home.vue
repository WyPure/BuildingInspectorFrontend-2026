<!-- 桥梁定检/系统设置页面
 author:ykx
 date:2025 . 6 .3
 -->

<template>
	<view class="navbar">湖北交投桥梁定检现场检测</view>
	<view id="homePage" class="homePage">
		<view class="logo">
			<image src="@/static/image/loginLogo.png" mode="widthFix" style="width: 100%"></image>
		</view>
		<view class="container">
			<view class="content">
				<view class="section" v-for="item in HOME_MENU_LIST" :key="item.key"
					:class="{ 'active': activeSection === item.key }" @click="handleClick(item)">
					<view class="icon-item">
						<view class="icon-box">
							<image :src="item.icon" mode="widthFix" class="home-icon"></image>
						</view>
						<text class="leftText">{{ item.label }}</text>
					</view>
				</view>
			</view>
		</view>
		<ChatAgentButton />
	</view>
</template>

<script setup>
	import {
		onMounted,
		ref
	} from 'vue';
	import checkUpdate from '../../uni_modules/uni-upgrade-center-app/utils/check-update';
	import {
		HOME_MENU_LIST
	} from './data';
	import ChatAgentButton from "../../components/ChatAgentButton.vue";

	const activeSection = ref('');

	const handleClick = (item) => {
		activeSection.value = item.key;
		uni.navigateTo({
			url: item.path
		});
	};

	onMounted(() => {
		checkUpdate();
	});
</script>

<style lang="scss" scoped>
	.navbar {
		width: 100vw;
		background-color: #0F4687;
		color: #FFFFFF;
		font-size: 16px;
		line-height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding-top: 40px;
		padding-bottom: 7px;
		box-sizing: border-box;
	}

	.homePage {
		min-height: 100vh;
		background-color: #FFFFFF;
	}

	.logo {
		width: 100%;
	}

	.container {
		width: 100%;
	}

	.content {
		display: flex;
		flex-wrap: wrap;
		width: 100%;
	}

	.section {
		width: 50%;
		height: 230rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		transition: background-color 0.3s;

		&.active {
			background-color: #dcdcdc;
		}
	}

	.icon-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10rpx;
		margin-top: 30rpx;
	}

	.icon-box {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.home-icon {
		width: 60rpx !important;
		height: 60rpx;
	}

	.leftText {
		font-size: 16px;
		color: #333;
	}
</style>