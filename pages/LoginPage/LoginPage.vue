<!-- 登录页面
	author ：ykx
	date : 2025 . 6.3
 -->
<template>
	<view class='loginPage'>
		<view class="logo">
			<view class="logo-container">
				<image src="@/static/image/loginLogo.jpg" mode="widthFix"
					style="width: 100%; background-color: #FFFFFF;"></image>
			</view>
		</view>
		<view class="form">
			<view class="item_1">
				<view class="name">用户名</view>
				<view class="input-line-wrap">
					<input class="uni-input" v-model="username" placeholder="请输入用户名" placeholder-style="color: #cccccc" />
				</view>
			</view>
			<view class="item_2">
				<view class="name">密码</view>
				<view class="input-line-wrap">
					<view class="container">
						<view class="container_1">
							<input class="uni-input" v-model="password" :type="showPassword ? 'text' : 'password'"
								placeholder="请输入密码" placeholder-style="color: #cccccc" />
							<view class="password-icons">
								<image :src="showPassword ? '/static/image/EyeOutline.png' : '/static/image/open.png'"
									mode="widthFix" style="width:5%" class="password-icon"
									@click="togglePasswordVisibility">
								</image>
							</view>
						</view>
					</view>
				</view>
			</view>
			<view class="item_3">
				<radio-group name="radio">
					<label>
						<radio :checked="rememberPassword" @click.stop="toggleRememberPassword" />
						<span @click.stop="toggleRememberPassword">记住密码</span>
					</label>
				</radio-group>
			</view>
		<view class="item_4">
			<button size="default" type="default" style="color:#ffffff;backgroundColor:#0F4687;borderColor:#1AAD19"
				hover-class="is-hover" :disabled="loading" @click="handleLogin">
				{{ loading ? '登录中...' : '登录' }}
			</button>
		</view>

		</view>
	</view>
</template>

<script setup>
	import {
		ref,
		onMounted
	} from 'vue';
	import {
		setAllUserInfo,
	} from '../../utils/writeNew';
	import {
		userStore
	} from '@/store/index.js'
	import {
		idStore
	} from '../../store/idStorage';
	import {
		setRootDir
	} from '../../utils/writeNew';
	// 引入配置文件
	import apiConfig from '@/config/api.js';
	import checkUpdate from '../../uni_modules/uni-upgrade-center-app/utils/check-update';
	const username = ref('');
	const password = ref('');
	const userInfo = userStore()
	const rememberPassword = ref(true);
	const showPassword = ref(false);
	const loading = ref(false);
	const idInfo = idStore();
	// 添加双击事件处理函数
	const toggleRememberPassword = () => {
		console.log('切换记住密码状态，当前状态:', rememberPassword.value);
		rememberPassword.value = !rememberPassword.value;
		console.log('切换后的状态:', rememberPassword.value);
	};

	onMounted(async () => {
		checkUpdate();
		const isRemember = uni.getStorageSync('isRemember');
		rememberPassword.value = !!isRemember;
		if (isRemember) {
			username.value = uni.getStorageSync('lastUsername');
			password.value = uni.getStorageSync('lastPassword');
		}
	})

	const togglePasswordVisibility = () => {
		showPassword.value = !showPassword.value;
	};

	// 离线登录时设置本地路径
	const setOfflineUserPaths = async (username) => {
		return new Promise((resolve) => {
			console.log('开始检查离线用户的本地路径，用户名:', username);

			plus.io.resolveLocalFileSystemURL('_doc/', (entry) => {
				entry.createReader().readEntries((entries) => {
					console.log('检查_doc/目录内容，寻找用户目录:');

					const udTailName = (dirName) => {
						const i = dirName.lastIndexOf('-')
						return i >= 0 && i < dirName.length - 1 ? dirName.substring(i + 1) : ''
					}
					// 查找匹配当前用户的UD目录（目录名 UD-时间戳-用户名，用户名在最后一段）
					const udDirs = entries
						.filter(e => e.isDirectory && e.name.startsWith('UD'))
						.filter(e => udTailName(e.name) === username)
						.sort((a, b) => b.name.localeCompare(a.name)); // 最新的在前

					// 查找匹配当前用户的UL目录
					const ulDirs = entries
						.filter(e => e.isDirectory && e.name.startsWith('UL'))
						.filter(e => udTailName(e.name) === username)
						.sort((a, b) => b.name.localeCompare(a.name)); // 最新的在前

					let hasData = false;

					if (udDirs.length > 0) {
						const latestUDDir = udDirs[0].name;
						console.log('找到匹配用户的UD目录:', latestUDDir);
						userInfo.setUDPath(latestUDDir);
						hasData = true;
					} else {
						console.log('未找到匹配用户的UD目录');
					}

					if (ulDirs.length > 0) {
						const latestULDir = ulDirs[0].name;
						console.log('找到匹配用户的UL目录:', latestULDir);
						userInfo.setULPath(latestULDir);
						hasData = true;
					} else {
						console.log('未找到匹配用户的UL目录');
					}

					console.log('离线登录路径设置完成，UDPath:', userInfo.UDPath, 'ULPath:', userInfo
						.ULPath);
					console.log('是否找到数据:', hasData);
					resolve({
						hasData
					});
				}, (err) => {
					console.error('读取_doc/目录失败:', err);
					resolve({
						hasData: false
					}); // 失败时返回无数据
				});
			}, (err) => {
				console.error('解析_doc/目录失败:', err);
				resolve({
					hasData: false
				}); // 失败时返回无数据
			});
		});
	};

	const handleLogin = async () => {
		if (!username.value || !password.value) {
			uni.showToast({
				title: '请输入用户名和密码',
				icon: 'none'
			});
			return;
		}

		loading.value = true;

		// 登录前先清理之前的用户数据
		userInfo.clearUserData();

		try {
			// 在线登录逻辑
			const response = await apiConfig.login(username.value, password.value)
			// const response = await uni.request({
			// 	url: `${apiConfig.baseURL}${apiConfig.endpoints.login}?username=${username.value}&password=${password.value}`,
			// 	method: 'POST'
			// });

			console.log('登录响应:', response.data);

			if (response.data.code === 0) {
				userInfo.setUserInfo({
					username: username.value,
					password: password.value,
					infoData: response.data,
				})
				idInfo.setUserId({
					value: response.data.userId
				})

				// 调用setRootDir方法创建根目录
				try {
					console.log('开始调用setRootDir创建根目录');
					const rootDir = await setRootDir();
					console.log('根目录创建成功');

					// 检查返回的目录对象
					if (rootDir && rootDir.fullPath) {
						console.log('创建的目录路径:', rootDir.fullPath);
						console.log('创建的目录名称:', rootDir.name);
					} else {
						console.warn('根目录创建成功但返回对象不完整');
					}
				} catch (error) {
					console.error('创建根目录失败，错误详情:', error);
					// 尝试显示更详细的错误信息
					if (error.message) {
						console.error('错误信息:', error.message);
					}
					if (error.stack) {
						console.error('错误堆栈:', error.stack);
					}
				}

				// 在线登录成功后也设置本地路径
				try {
					console.log('在线登录：开始检查和设置本地路径');
					const pathResult = await setOfflineUserPaths(username.value);
					console.log('在线登录：路径设置结果:', pathResult);
				} catch (error) {
					console.error('在线登录：设置本地路径失败:', error);
					// 设置路径失败不影响登录流程，继续执行
				}

				console.log('登录成功，准备跳转');
				uni.navigateTo({
					url: '/pages/home/home'
				});
				// 在线登录后保存用户信息到 Storage
				console.log('准备保存用户信息到 Storage');
				const accountArray = uni.getStorageSync('accountArray') || [];
				const nextAccountArray = accountArray.filter(a => a.username !== username.value);
				nextAccountArray.unshift({
					username: username.value,
					password: password.value,
					infoData: response.data
				});
				uni.setStorageSync('accountArray', nextAccountArray);
				uni.setStorageSync('isRemember', rememberPassword.value);
				if (rememberPassword.value) {
					uni.setStorageSync('lastUsername', username.value);
					uni.setStorageSync('lastPassword', password.value);
				} else {
					uni.removeStorageSync('lastUsername');
					uni.removeStorageSync('lastPassword');
				}
			} else {
				uni.showToast({
					title: response.data.msg || '登录失败',
					icon: 'none'
				});
			}
		} catch (error) {
			console.error('在线登录失败，尝试离线登录:', error);

			// 离线登录：从 Storage 的账号缓存校验
			let cachedAccount = null;
			const _accountArray = uni.getStorageSync('accountArray') || [];
			const _match = _accountArray.find(a =>
				a.username === username.value && a.password === password.value
			);
			if (_match) cachedAccount = _match;

			if (cachedAccount) {
				console.log('离线登录成功，准备跳转');
				userInfo.setUserInfo({
					username: username.value,
					password: password.value,
					infoData: cachedAccount.infoData,
				})

				// 离线登录时也需要设置本地路径
				try {
					console.log('离线登录：开始检查和设置本地路径');
					const pathResult = await setOfflineUserPaths(username.value);

					if (!pathResult.hasData) {
						// 没有找到数据包，提示用户需要联网下载
						uni.showModal({
							title: '本地无数据',
							content: '检测到本地没有数据包，请先联网登录下载数据包后再使用离线模式。',
							showCancel: false,
							confirmText: '确定',
							success: () => {
								// 清理用户数据，返回登录页面
								userInfo.clearUserData();
								console.log('用户确认后返回登录页面');
							}
						});
						return; // 不继续登录流程
					}
				} catch (error) {
					console.error('离线登录：设置本地路径失败:', error);
					// 设置路径失败，也提示用户需要联网
					uni.showModal({
						title: '数据检查失败',
						content: '无法检查本地数据，请先联网登录下载数据包。',
						showCancel: false,
						confirmText: '确定',
						success: () => {
							userInfo.clearUserData();
						}
					});
					return;
				}

				// 登录成功，跳转到bridge页面
				uni.navigateTo({
					url: '/pages/home/home'
				});
			} else {
				console.log('离线登录失败：本地无匹配账号');
				uni.showToast({
					title: '用户名或密码错误',
					icon: 'none'
				});
			}
			// uni.showToast({
			// 	title: '登录失败，请稍后重试',
			// 	icon: 'none'
			// });
		} finally {
			loading.value = false;
		}
	};
</script>

<style lang="scss" scoped>
	.loginPage {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background-color: #FFFFFF;

		.logo {
			height: 508rpx;
			background-color: #FFFFFF;

			.logo-container {
				background-color: #FFFFFF;
				width: 100%;
				height: 100%;
				display: flex;
				align-items: flex-start;
				justify-content: center;
				position: relative;
				padding-top: 0;

				image {
					background: #FFFFFF !important;
					display: block;
					position: relative;
					z-index: 1;
				}
			}
		}

		.form {
			display: flex;
			flex-direction: column;
			align-items: center;

			.item_1,
			.item_2 {
				width: 400rpx;
				height: auto;
				margin-bottom: 20rpx;

				.name {
					font-size: 20px;
					color: #666666;
					margin-bottom: 5px;
				}

				/* 底线画在包裹层上，避免 text / password 两种 input 原生描边一深一浅 */
				.input-line-wrap {
					width: 100%;
					box-sizing: border-box;
					padding-bottom: 10rpx;
					border-bottom: 1rpx solid #CCCCCC;
				}

				.uni-input {
					font-size: 22px;
					color: var(--font-color);
					width: 100%;
					border: none;
					outline: none;
					padding: 0;
					margin: 0;
					background: transparent;
				}
			}

			.item_2 {
				margin-bottom: 0;
			}

			.item_3 {
				width: 400rpx;
				display: flex;
				justify-content: space-between;
				margin-top: 20rpx;

				radio-group {
					width: 100%;
					display: flex;
					justify-content: space-between;

					label {
						display: flex;
						align-items: flex-end;
						height: 22px;
						font-size: 23px;
						color: #333333;
						line-height: 22px;

						radio {
							position: relative;
							top: 0;
							margin-right: 5rpx;
						}
					}
				}
			}

			.item_4 {
				width: 400rpx;
				margin-top: 40rpx;

				button {
					width: 100%;
					height: 60px;
					line-height: 60px;
					font-size: 24rpx !important;
				}
			}
		}
	}

	.container_1 {
		position: relative;
		display: flex;
		align-items: center;
		width: 100%;
	}

	.password-icons {
		position: absolute;
		right: 10rpx;
		bottom: 10rpx;
		display: flex;
		align-items: center;
		gap: 10rpx;
	}

	.password-icon {
		cursor: pointer;
		width: 22px !important;
		height: 22px;
		padding: 0;
		margin-bottom: 2px;
	}

	/* 手机端适配 */
	@media (max-width: 767px) {
		.loginPage {
			.form {
				padding-left: 100rpx;
				padding-right: 100rpx;

				.item_1,
				.item_2 {
					width: 100%;
					
					.name{
						font-size: 16px;
					}
					.uni-input{
						font-size: 18px;
					}
				}

				.item_3 {
					margin-right: auto;
					
					radio-group{
						label{
							font-size: 18px;
						}
					}
				}
				
			.item_4{
				button{
					width: 80%;
					height: 50px;
					line-height: 50px;
					font-size: 22rpx;
				}
			}
		}
	}

}
</style>