<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	/*每个页面公共css */

	/* 全局：所有原生按钮内文字统一 16rpx（覆盖各页 scoped 中对 button 的字号） */
	button,
	uni-button {
		font-size: 16rpx !important;
	}

	/*
	 * 与 SystemSetting.vue 中 .profile-btn 完全一致（高 40rpx、行高 40rpx、左右 10rpx、圆角 5rpx、去 ::after）
	 * 桥梁病害工具条「新增病害 / 选择 / 桥跨数量」等统一用 class：bd-setting-tool-btn
	 */
	button.bd-setting-tool-btn {
		flex-shrink: 0;
		height: 40rpx !important;
		min-height: 40rpx !important;
		max-height: 40rpx !important;
		line-height: 40rpx !important;
		padding: 0 10rpx !important;
		margin: 0 !important;
		font-size: 16rpx !important;
		color: #fff !important;
		background: #0f4687 !important;
		border-radius: 5rpx !important;
		border: none !important;
		box-sizing: border-box !important;
		display: flex !important;
		align-items: center !important;
		justify-content: center !important;
		-webkit-appearance: none !important;
		appearance: none !important;
	}

	button.bd-setting-tool-btn::after {
		border: none !important;
		border-radius: 5rpx !important;
	}

	.bd-setting-tool-btn-hover {
		opacity: 0.88;
	}

	button.bd-setting-tool-btn.bd-setting-tool-btn--disabled,
	button.bd-setting-tool-btn[disabled] {
		background-color: #c5c5c5 !important;
		color: #fff !important;
		opacity: 1 !important;
	}

	button.bd-setting-tool-btn.bd-setting-tool-btn--mini {
		min-width: 132rpx !important;
	}

	/* 以 view + text 实现的工具条按钮（桥梁病害顶栏等） */
	.bd-toolbar-btn-text {
		font-size: 16rpx !important;
	}

	/* 桥跨条上可点击药片，与按钮字号一致 */
	.span-pill {
		font-size: 16rpx !important;
	}

	/* 以 view 模拟的底部操作按钮（图片选择、照片信息等） */
	view.btn {
		font-size: 16rpx !important;
	}
	
	/* 覆盖myFilePicker组件中的删除按钮样式 */
	.icon-del-box {
		position: absolute !important;
		top: 3px !important;
		right: 3px !important;
		height: 26px !important;
		width: 26px !important;
		border-radius: 50% !important;
		background-color: rgba(0, 0, 0, 0.5) !important;
		z-index: 999 !important;
		transform: rotate(-45deg) !important;
		bottom: auto !important;
	}
  .icon-del {
    width: 15px !important;
    height: 2px !important;
    background-color: #fff !important;
    border-radius: 2px !important;
  }

</style>
