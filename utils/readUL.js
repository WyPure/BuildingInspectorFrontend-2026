import {
	userStore
} from '@/store/index.js';
import {
	readUlBridgeDocument,
	enrichObjectPayloadCatalogTemplateId,
} from './businessDocumentStore.js'
import { hasBusinessSqlite } from './businessSqliteCore.js'
import { findMatchingDirectory } from './readJsonNew.js'
import { idStore } from '@/store/idStorage.js'
import { unref } from 'vue'
// 文档基础路径
const DOC_BASE_PATH = '_doc/'

/** UD 目录：主用户名与 hadUsername 都试一次（SQLite 下目录匹配依赖 UDPath） */
export async function findUdDirForUser(primaryUserName) {
	const um = userStore()
	const names = [...new Set([primaryUserName, um?.username, um?.hadUsername].filter(Boolean))]
	for (const un of names) {
		const d = await findMatchingDirectory(un)
		if (d) return d
	}
	return null
}
// 获取当前日期字符串 (格式: YY-MM-DD)
function getCurrentDateStr() {
	const now = new Date();
	const year = now.getFullYear().toString().slice(-2);
	const month = (now.getMonth() + 1).toString().padStart(2, '0');
	const day = now.getDate().toString().padStart(2, '0');
	return `${year}-${month}-${day}`;
}

// 生成用户目录名（格式: UD25-06-11-userName）
function getUserDir(userName) {
	const userInfo = userStore()
	if (userInfo.hadUsername !== '') {
		//即找到了相同用户名但不同日期的文件夹
		//console.log("找到了，返回保存的hadname:", userInfo.hadUsername);
		return userInfo.hadUsername;
	} else {
		//console.log("没找到新拼一个");
		return `UD${getCurrentDateStr()}-${userName}`;
	}
}

// 路径生成规则（基于userName）
export const FILE_NAMING = {
	project: userName => `project/projects.json`,
	projectWithDate: userNameWithDate => `project/projects.json`,
	projectsFolder: userName => `project`,
	task: (userName, projectId) => `project/${projectId}/task.json`,
	taskWithDate: (userNameWithDate, projectId) => `project/${projectId}/task.json`,
	property: (userName, buildingId) => `building/${buildingId}/property.json`,
	disease: (userName, buildingId, yearId) =>
		`building/${buildingId}/disease/${yearId}.json`,
	Object: (userName, buildingId) => `building/${buildingId}/object.json`,
	// 新增用户信息路径规则
	user: userName => `user.json`,
	historyYear: (userName, buildingId) => `building/${buildingId}/disease`,
	AllUserInfo: userName => `AllUserInfo.json`,
	frontPhoto: (userName, buildingId) => `building/${buildingId}/frontPhoto.json`,
};

// 核心文件读取方法
async function getJsonData(path) {
  return new Promise((resolve, reject) => {
    plus.io.requestFileSystem(plus.io.PRIVATE_DOC, fs => {
      fs.root.getFile(path, {
        create: false
      }, fileEntry => {
        fileEntry.file(file => {
          const reader = new plus.io.FileReader();
          reader.onload = () => {
            try {
              resolve(JSON.parse(reader.result));
            } catch (e) {
              reject(`JSON解析失败: ${path}, 错误: ${e.message}`);
            }
          };
          reader.onerror = (e) => {
            reject(`文件读取失败: ${path}, 错误: ${e.message || '未知错误'}`);
          };
          reader.readAsText(file);
        }, err => {
          reject(`获取文件对象失败: ${path}, 错误: ${err.message || '未知错误'}`)
        });
      }, err => {
        reject(`获取文件条目失败: ${path}, 错误: ${err.message || '未知错误'}`);
      });
    }, err => {
      reject(`获取文件系统失败: ${path}, 错误: ${err.message || '未知错误'}`);
    });
  });
}

// 辅助函数：查找匹配的目录
async function findMatchingDirectoryUL(userName) {
  try {
    // 获取_doc目录下的所有子目录
    const allDirs = await getAllFirstLevelDirs();
    
    // 获取用户信息store
    const userInfo = userStore();
    
    // 优先使用ULPath（用于读取数据）
    if (userInfo.ULPath && allDirs.includes(userInfo.ULPath)) {
      return userInfo.ULPath;
    }
    
    // 查找以UL开头的目录（用于读取数据）
    const ulDirs = allDirs.filter(dir => dir.startsWith('UL'));

    for (const dir of ulDirs) {
      const lastDashIndex = dir.lastIndexOf('-');
      if (lastDashIndex !== -1 && lastDashIndex < dir.length - 1) {
        const dirUsername = dir.substring(lastDashIndex + 1);

        if (userName && dirUsername === userName) {
          userInfo.setULPath(dir);
          return dir;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('查找匹配UL目录时出错:', error);
    return null;
  }
}

export async function getObjectUL(userName, buildingId) {
  try {
    // 查找匹配的目录
    const matchedDir = await findMatchingDirectoryUL(userName);
    
    // 构建对象文件路径
    const objectPath = DOC_BASE_PATH + `${matchedDir}/building/${buildingId}/object.json`

    try {
      if (matchedDir) {
        const fromDb = await readUlBridgeDocument(matchedDir, String(buildingId), 'object', 'default')
        if (fromDb != null) {
          const udDir = await findUdDirForUser(userName)
          const uid = unref(idStore().userId)
          return await enrichObjectPayloadCatalogTemplateId(
            fromDb,
            udDir,
            buildingId,
            uid || undefined
          )
        }
        // data.db 尚无 object 行时，回退读 UL 目录下 object.json（仅写文件、库未同步或首写尚未入库时常见）
        try {
          const jsonPayload = await getJsonData(objectPath)
          if (jsonPayload && typeof jsonPayload === 'object') {
            const udDir = await findUdDirForUser(userName)
            const uid = unref(idStore().userId)
            return await enrichObjectPayloadCatalogTemplateId(
              jsonPayload,
              udDir,
              buildingId,
              uid || undefined
            )
          }
        } catch (jsonErr) {
          console.log('[getObjectUL] readUlBridgeDocument 为空，object.json 回退:', jsonErr?.message || jsonErr)
        }
        if (hasBusinessSqlite()) {
          return {
            code: 0,
            msg: 'success',
            buildingId: buildingId,
            Iscommit: false,
            children: []
          }
        }
      }
      return await getJsonData(objectPath)
    } catch (readError) {
      console.log('对象文件不存在，返回默认数据结构:', readError);
      // 返回默认的对象数据结构
      return {
        code: 0,
        msg: "success",
        buildingId: buildingId,
        Iscommit: false,
        children: []
      };
    }
  } catch (error) {
    console.error('获取对象数据失败:', error);
    // 返回默认的对象数据结构，而不是抛出错误
    return {
      code: 0,
      msg: "success",
      buildingId: buildingId,
      Iscommit: false,
      children: []
    };
  }
}

// export async function getAllUserInfo(userName) {
//   try {
//     // 查找匹配的目录
//     const matchedDir = await findMatchingDirectoryUL(userName);
    
//     // 构建用户信息文件路径
//     let userInfoPath;
//     if (matchedDir === 'project') {
//       // 如果是project目录，使用默认路径
//       userInfoPath = DOC_BASE_PATH + 'AllUserInfo.json';
//     } else if (matchedDir) {
//       // 如果找到匹配的用户目录，使用该目录
//       userInfoPath = DOC_BASE_PATH + `${matchedDir}/AllUserInfo.json`;
//     } else {
//       // 如果没有找到匹配的目录，尝试使用默认路径
//       userInfoPath = DOC_BASE_PATH + 'AllUserInfo.json';
//     }
    
//     console.log('用户信息文件路径:', userInfoPath);
//     trackPath(userInfoPath);
    
//     // 读取用户信息文件
//     return await getJsonData(userInfoPath);
//   } catch (error) {
//     console.error('获取用户信息数据失败:', error);
//     throw error;
//   }
// }

export async function readBridgeImage(userName, buildingId, relativePaths) {
  try {
    // 查找匹配的目录
    const matchedDir = await findMatchingDirectoryUL(userName);
    
    // 处理数组情况
    if (Array.isArray(relativePaths)) {
      return Promise.all(relativePaths.map(async (path) => {
        let fullPath;
        if (matchedDir === 'project') {
          // 如果是project目录，使用默认building路径
          fullPath = DOC_BASE_PATH + 'building/' + path;
        } else if (matchedDir) {
          // 如果找到匹配的用户目录，使用该目录
          fullPath = DOC_BASE_PATH + `${matchedDir}/building/` + path;
        } else {
          // 如果没有找到匹配的目录，尝试使用默认路径
          fullPath = DOC_BASE_PATH + 'building/' + path;
        }
        
        // 转为本地绝对路径
        return plus.io.convertLocalFileSystemURL(fullPath);
      }));
    } else {
      // 保持原有单个路径的处理逻辑
      let fullPath;
      if (matchedDir === 'project') {
        // 如果是project目录，使用默认building路径
        fullPath = DOC_BASE_PATH + 'building/' + relativePaths;
      } else if (matchedDir) {
        // 如果找到匹配的用户目录，使用该目录
        fullPath = DOC_BASE_PATH + `${matchedDir}/building/` + relativePaths;
      } else {
        // 如果没有找到匹配的目录，尝试使用默认路径
        fullPath = DOC_BASE_PATH + 'building/' + relativePaths;
      }
      
      // 转为本地绝对路径
      return plus.io.convertLocalFileSystemURL(fullPath);
    }
  } catch (error) {
    console.error('读取桥梁图片失败:', error);
    throw error;
  }
}
//读取所有一级子目录
export function getAllFirstLevelDirs() {
	return new Promise((resolve, reject) => {
		const fullPath = DOC_BASE_PATH;

		plus.io.requestFileSystem(plus.io.PRIVATE_DOC, fs => {
			fs.root.getDirectory(fullPath, {
				create: false
			}, dirEntry => {
				const directoryReader = dirEntry.createReader();
				directoryReader.readEntries(entries => {
					const dirNames = entries
						.filter(entry => entry.isDirectory)
						.map(entry => entry.name);
					resolve(dirNames);
				}, reject);
			}, err => {
				// 如果目录不存在，返回空数组而不是reject
				if (err.code === err.NOT_FOUND_ERR) {
					resolve([]);
				} else {
					reject(`无法访问目录: ${fullPath}`);
				}
			});
		}, reject);
	});
}

