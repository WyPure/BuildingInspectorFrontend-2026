 // downloadUtils.js
 import { ref, unref } from 'vue';
 import {userStore} from '@/store/index'
 import { idStore } from '@/store/idStorage'
 // 导入writeObjectJson函数
 import { writeObjectJson } from './writeNew.js';
 import { installUserSqlitePackage } from './sqlitePackageSync.js'
 
 // 辅助函数：解析包大小字符串为字节数
 export function parsePackageSize(sizeStr) {
   if (!sizeStr) return null;
   
   try {
     // 如果已经是数字，直接返回
     if (typeof sizeStr === 'number') return sizeStr;
     
     // 尝试直接转换为数字
     const directNumber = Number(sizeStr);
     if (!isNaN(directNumber)) return directNumber;
     
     // 解析字符串格式，如"420.661MB"
     const match = String(sizeStr).match(/^([\d.]+)\s*([KMGT]?B)$/i);
     if (match) {
       const size = parseFloat(match[1]);
       const unit = match[2].toUpperCase();
       
       if (isNaN(size)) return null;
       
       switch (unit) {
         case 'B':
           return size;
         case 'KB':
           return size * 1024;
         case 'MB':
           return size * 1024 * 1024;
         case 'GB':
           return size * 1024 * 1024 * 1024;
         case 'TB':
           return size * 1024 * 1024 * 1024 * 1024;
         default:
           return null;
       }
     }
     
     return null;
   } catch (error) {
     console.error('解析包大小字符串失败:', error);
     return null;
   }
 }
 
// 新增：将UD目录下的object.json文件复制到UL目录
export async function copyUDToULObjectJson() {
  const userInfo = userStore();
  const udPath = userInfo.UDPath;
  const ulPath = userInfo.ULPath;
  
  console.log('复制object.json文件，当前路径信息:', { udPath, ulPath });
  
  // 严格检查UDPath和ULPath是否存在
  if (!udPath || !ulPath) {
    console.error('UDPath或ULPath为空，无法复制文件', { udPath, ulPath });
    return { success: false, message: 'UDPath或ULPath为空，请确保已正确设置路径' };
  }
  
  console.log(`开始从UD目录复制object.json文件到UL目录，UD路径: ${udPath}, UL路径: ${ulPath}`);
  
  try {
    // 1. 检查UD目录下的building目录
    const udBuildingPath = `_doc/${udPath}/building`;
    
    // 检查UD/building目录是否存在
    const udBuildingExists = await new Promise((resolve) => {
      plus.io.resolveLocalFileSystemURL(udBuildingPath, () => resolve(true), () => resolve(false));
    });
    
    if (!udBuildingExists) {
      console.log(`${udBuildingPath} 目录不存在，无需复制`);
      return { success: true, message: 'building目录不存在，无需复制' };
    }
    
    // 确保UL/building目录存在
    const ulBuildingPath = `_doc/${ulPath}/building`;
    const ulBuildingExists = await new Promise((resolve) => {
      plus.io.resolveLocalFileSystemURL(ulBuildingPath, () => resolve(true), () => resolve(false));
    });
    
    if (!ulBuildingExists) {
      console.log(`${ulBuildingPath} 目录不存在，创建目录`);
      await new Promise((resolve, reject) => {
        plus.io.resolveLocalFileSystemURL(`_doc/${ulPath}`, (entry) => {
          entry.getDirectory('building', { create: true }, (dirEntry) => {
            console.log('UL/building目录创建成功');
            resolve(dirEntry);
          }, (err) => {
            console.error('创建UL/building目录失败:', err);
            reject(err);
          });
        }, (err) => {
          console.error(`解析_doc/${ulPath}目录失败:`, err);
          reject(err);
        });
      });
    }
    
    // 2. 获取building目录下的所有buildingId目录
    const buildingDirs = await new Promise((resolve, reject) => {
      plus.io.resolveLocalFileSystemURL(udBuildingPath, (entry) => {
        entry.createReader().readEntries((entries) => {
          const dirs = entries.filter(e => e.isDirectory);
          resolve(dirs);
        }, (err) => {
          console.error('读取building目录失败:', err);
          reject(err);
        });
      }, (err) => {
        console.error('解析building目录失败:', err);
        reject(err);
      });
    });
    
    console.log(`找到 ${buildingDirs.length} 个buildingId目录`);
    
    // 3. 遍历每个buildingId目录，读取object.json文件并写入UL目录
    let copiedCount = 0;
    let errorCount = 0;
    
    for (const buildingDir of buildingDirs) {
      const buildingId = buildingDir.name;
      const objectJsonPath = `${udBuildingPath}/${buildingId}/object.json`;
      
      try {
        // 4. 读取object.json文件内容
        const objectJsonContent = await new Promise((resolve, reject) => {
          plus.io.resolveLocalFileSystemURL(objectJsonPath, (fileEntry) => {
            fileEntry.file((file) => {
              const reader = new plus.io.FileReader();
              reader.onloadend = function(e) {
                try {
                  const content = JSON.parse(this.result);
                  resolve(content);
                } catch (parseError) {
                  console.error(`解析object.json文件失败: ${objectJsonPath}`, parseError);
                  reject(parseError);
                }
              };
              reader.onerror = function(e) {
                console.error(`读取object.json文件失败: ${objectJsonPath}`, e);
                reject(e);
              };
              reader.readAsText(file);
            }, (err) => {
              console.error(`获取文件对象失败: ${objectJsonPath}`, err);
              reject(err);
            });
          }, (err) => {
            console.error(`解析文件路径失败: ${objectJsonPath}`, err);
            reject(err);
          });
        });
        
        console.log(`成功读取 ${objectJsonPath} 文件内容:`, objectJsonContent);
        
        // 5. 使用writeObjectJson将数据写入UL目录
        await writeObjectJson(buildingId, objectJsonContent);
        console.log(`成功将buildingId=${buildingId}的object.json写入UL目录`);
        
        copiedCount++;
      } catch (error) {
        console.error(`处理 buildingId=${buildingId} 时出错:`, error);
        errorCount++;
      }
    }
    
    console.log(`复制完成，成功: ${copiedCount}，失败: ${errorCount}`);
    return { 
      success: true, 
      message: `复制完成，成功: ${copiedCount}，失败: ${errorCount}`,
      copiedCount,
      errorCount
    };
  } catch (error) {
    console.error('复制object.json文件过程中出错:', error);
    return { success: false, message: error.message || '复制过程中出错' };
  }
}

// 新增：将UD目录下的object.json文件复制到UL目录下
export async function copyObjectJsonFiles() {
  // 调用新实现的函数
  return copyUDToULObjectJson();
}

export function useDownloader() {
   const downloadProgress = ref(0); // 下载进度
   const unzipProgress = ref(0);   // 解压进度
   const currentTaskId = ref(null); // 当前任务ID

   // 重置进度状态
   const resetProgress = () => {
     downloadProgress.value = 0;
     unzipProgress.value = 0;
     currentTaskId.value = null;
   };

   /** 数据包下载：仅 uni.downloadFile */
   const downloadFile = (url, packageSize, taskId) => {
     return new Promise((resolve, reject) => {
       if (!url.startsWith('http')) {
         reject(new Error('URL格式不正确'));
         return;
       }
       const parsedSize = parsePackageSize(packageSize);
       const TOTAL_FILE_SIZE = parsedSize || 12.5 * 1024 * 1024;
       const task = uni.downloadFile({
         url,
         timeout: 180000,
         success: (res) => {
           if (res.statusCode === 200 && res.tempFilePath) {
             resolve(res.tempFilePath);
           } else {
             reject(new Error(`下载失败: ${res.statusCode}`));
           }
         },
         fail: (err) => reject(err || new Error('downloadFile fail'))
       });
       if (task && typeof task.onProgressUpdate === 'function') {
         task.onProgressUpdate((e) => {
           if (currentTaskId.value !== taskId) return;
           const totalSize =
             e.totalBytesExpectedToWrite > 0 ? e.totalBytesExpectedToWrite : TOTAL_FILE_SIZE;
           const progress = e.totalBytesWritten / totalSize * 100;
           downloadProgress.value = progress;
           uni.$emit('download-progress', {
             progress,
             packageSize: TOTAL_FILE_SIZE,
             bytesWritten: e.totalBytesWritten,
             bytesExpected: totalSize,
             taskId
           });
         });
       }
     });
   };
 
   /** 用户工作区：v2 元数据 + uni.downloadFile + 落盘 u{userId}.db */
   const downloadAndUnzip = async (token) => {
     try {
       const taskId = Date.now()
       currentTaskId.value = taskId
       console.log('开始用户数据库下载任务，任务ID:', taskId)
       resetProgress()
       currentTaskId.value = taskId

       const uid = unref(idStore().userId)
       const useInfo = userStore()
       const username = useInfo.username
       if (!username) throw new Error('未获取到用户名')

       const { dirNew, ulDir } = await installUserSqlitePackage(token, username, uid, {
         taskId,
         onProgress: (p) => {
           downloadProgress.value = p.progress || 0
           uni.$emit('download-progress', p)
         }
       })
       useInfo.setUDPath(dirNew)
       useInfo.setULPath(ulDir)

       unzipProgress.value = 100
       uni.$emit('unzip-progress', { progress: 100, taskId })
       uni.$emit('unzip-completed', { taskId })

       return {
         targetDir: '_doc/',
         tempPath: null,
         version: dirNew
       }
     } catch (e) {
       console.error('用户数据库下载失败:', e)
       throw e
     }
   };
 
   // 辅助方法：创建目录
   const createDir = (path) => {
     return new Promise((resolve, reject) => {
       console.log('创建目录:', path);
       try {
         const parentPath = path.substring(0, path.lastIndexOf('/'));
         const dirName = path.substring(path.lastIndexOf('/') + 1);
         
         console.log('父目录:', parentPath, '目录名:', dirName);
         
         plus.io.resolveLocalFileSystemURL(
           parentPath,
           (parent) => {
             parent.getDirectory(
               dirName,
               { create: true },
               (dirEntry) => {
                 console.log('目录创建成功:', dirEntry.fullPath);
                 resolve(dirEntry);
               },
               (err) => {
                 console.error('创建目录失败:', err);
                 reject(err);
               }
             );
           },
           (err) => {
             console.error('解析父目录失败:', err);
             reject(err);
           }
         );
       } catch (err) {
         console.error('创建目录异常:', err);
         reject(err);
       }
     });
   };

  // 确保目录存在
  const ensureDirectoryExists = async (path) => {
    return new Promise((resolve, reject) => {
      console.log('确保目录存在:', path);
      
      // 处理_doc/路径
      if (path.startsWith('_doc/')) {
        // 如果是根目录_doc/，直接返回
        if (path === '_doc/') {
          plus.io.resolveLocalFileSystemURL(path, resolve, reject);
          return;
        }
        
        // 分割路径
        const parts = path.split('/').filter(p => p);
        if (parts.length === 1) {
          // 只有一级目录，直接在_doc/下创建
          plus.io.resolveLocalFileSystemURL('_doc/', (entry) => {
            entry.getDirectory(parts[0], { create: true }, resolve, reject);
          }, reject);
          return;
        }
        
        // 多级目录，递归创建
        let currentPath = '_doc/';
        let currentEntry = null;
        
        // 获取_doc/目录
        plus.io.resolveLocalFileSystemURL(currentPath, (entry) => {
          currentEntry = entry;
          createNextDir(1);
        }, reject);
        
        // 递归创建子目录
        function createNextDir(index) {
          if (index >= parts.length) {
            resolve(currentEntry);
            return;
          }
          
          const dirName = parts[index];
          console.log(`创建目录: ${currentPath}${dirName}`);
          
          currentEntry.getDirectory(dirName, { create: true }, (entry) => {
            currentEntry = entry;
            currentPath = currentPath + dirName + '/';
            createNextDir(index + 1);
          }, (err) => {
            console.error(`创建目录失败: ${currentPath}${dirName}`, err);
            reject(err);
          });
        }
      } else {
        // 非_doc路径，使用原来的逻辑
        plus.io.resolveLocalFileSystemURL(
          path,
          (entry) => {
            console.log('目录已存在:', path);
            resolve(entry);
          },
          () => {
            console.log('目录不存在，创建目录:', path);
            // 获取父目录
            const parentPath = path.substring(0, path.lastIndexOf('/'));
            const dirName = path.substring(path.lastIndexOf('/') + 1);
            
            plus.io.resolveLocalFileSystemURL(
              parentPath,
              (parent) => {
                parent.getDirectory(
                  dirName,
                  { create: true },
                  (dirEntry) => {
                    console.log('目录创建成功:', dirEntry.fullPath);
                    resolve(dirEntry);
                  },
                  (err) => {
                    console.error('创建目录失败:', err);
                    reject(err);
                  }
                );
              },
              (err) => {
                console.error('解析父目录失败:', err);
                reject(err);
              }
            );
          }
        );
      }
    });
  };
 
   // 检查目录是否存在
   const checkDirectoryExists = (path) => {
     return new Promise((resolve) => {
       plus.io.resolveLocalFileSystemURL(
         path,
         () => resolve(true),
         () => resolve(false)
       );
     });
   };
   
   // 移动目录内容
   const moveDirectoryContents = async (sourcePath, targetPath) => {
     return new Promise((resolve, reject) => {
       console.log(`移动目录内容: 从 ${sourcePath} 到 ${targetPath}`);
       
       plus.io.resolveLocalFileSystemURL(sourcePath, (sourceDir) => {
         sourceDir.createReader().readEntries((entries) => {
           if (entries.length === 0) {
             console.log('源目录为空');
             resolve();
             return;
           }
           
           let processed = 0;
           let errors = [];
           
           entries.forEach((entry) => {
             console.log(`处理文件/目录: ${entry.name}`);
             
             if (entry.isFile) {
               // 如果是文件，复制到目标目录
               copyFile(entry, targetPath).then(() => {
                 processed++;
                 if (processed === entries.length) {
                   if (errors.length > 0) {
                     reject(new Error(`移动过程中有 ${errors.length} 个错误`));
                   } else {
                     resolve();
                   }
                 }
               }).catch((err) => {
                 console.error(`复制文件失败: ${entry.name}`, err);
                 errors.push(err);
                 processed++;
                 if (processed === entries.length) {
                   reject(new Error(`移动过程中有 ${errors.length} 个错误`));
                 }
               });
             } else if (entry.isDirectory) {
               // 如果是目录，确保目标目录存在，然后递归移动
               const newTargetPath = targetPath + entry.name + '/';
               ensureDirectoryExists(newTargetPath).then(() => {
                 moveDirectoryContents(entry.fullPath, newTargetPath).then(() => {
                   processed++;
                   if (processed === entries.length) {
                     if (errors.length > 0) {
                       reject(new Error(`移动过程中有 ${errors.length} 个错误`));
                     } else {
                       resolve();
                     }
                   }
                 }).catch((err) => {
                   console.error(`移动子目录失败: ${entry.name}`, err);
                   errors.push(err);
                   processed++;
                   if (processed === entries.length) {
                     reject(new Error(`移动过程中有 ${errors.length} 个错误`));
                   }
                 });
               }).catch((err) => {
                 console.error(`创建目标子目录失败: ${entry.name}`, err);
                 errors.push(err);
                 processed++;
                 if (processed === entries.length) {
                   reject(new Error(`移动过程中有 ${errors.length} 个错误`));
                 }
               });
             } else {
               // 其他类型的条目
               console.log(`跳过未知类型的条目: ${entry.name}`);
               processed++;
               if (processed === entries.length) {
                 if (errors.length > 0) {
                   reject(new Error(`移动过程中有 ${errors.length} 个错误`));
                 } else {
                   resolve();
                 }
               }
             }
           });
         }, (err) => {
           console.error('读取源目录失败', err);
           reject(err);
         });
       }, (err) => {
         console.error('解析源目录失败', err);
         reject(err);
       });
     });
   };
   
   // 复制文件
   const copyFile = (fileEntry, targetPath) => {
     return new Promise((resolve, reject) => {
       plus.io.resolveLocalFileSystemURL(targetPath, (targetDir) => {
         fileEntry.copyTo(targetDir, fileEntry.name, (newFile) => {
           console.log(`文件复制成功: ${fileEntry.name}`);
           resolve(newFile);
         }, (err) => {
           console.error(`文件复制失败: ${fileEntry.name}`, err);
           reject(err);
         });
       }, (err) => {
         console.error('解析目标目录失败', err);
         reject(err);
       });
     });
   };
   
   // 删除目录
   const removeDirectory = (path) => {
     return new Promise((resolve, reject) => {
       console.log(`删除目录: ${path}`);
       
       plus.io.resolveLocalFileSystemURL(path, (entry) => {
         if (entry.isDirectory) {
           entry.removeRecursively(() => {
             console.log(`目录删除成功: ${path}`);
             resolve();
           }, (err) => {
             console.error(`目录删除失败: ${path}`, err);
             reject(err);
           });
         } else {
           console.error(`路径不是目录: ${path}`);
           reject(new Error(`路径不是目录: ${path}`));
         }
       }, (err) => {
         console.error(`解析目录失败: ${path}`, err);
         reject(err);
       });
     });
   };
 
   return {
     downloadProgress,
     unzipProgress,
     downloadAndUnzip,
     resetProgress,
     currentTaskId
   };
 }