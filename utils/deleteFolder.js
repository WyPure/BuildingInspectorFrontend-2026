// export function deleteFolderInApp(folderPath) {
// 	// const nativePath = plus.io.convertLocalFileSystemURL(folderPath);
// 	// console.log('准备删除的真实路径:', nativePath);

// 	plus.io.resolveLocalFileSystemURL(nativePath, function(entry) {
// 		if (entry.isDirectory) {
// 			entry.removeRecursively(() => {
// 				console.log('目录删除成功:', nativePath);
// 			}, (err) => {
// 				console.error('目录删除失败:', err);
// 			});
// 		} else {
// 			console.warn('目标不是目录，无法删除:', nativePath);
// 		}
// 	}, function(err) {
// 		console.error('路径解析失败，文件可能已被删或路径拼错:', err);
// 	});
// }

export function deleteFolderInApp(folderPath) {
	plus.io.resolveLocalFileSystemURL(folderPath, function(entry) {
		if (entry.isDirectory) {
			entry.removeRecursively(() => {
				console.log('目录删除成功');
			}, (err) => {
				console.error('目录删除失败', err);
			});
		}
	}, function(err) {
		console.error('路径解析失败', err);
	});
}