// 文档基础路径
const DOC_BASE_PATH = '_doc/';
import {
	userStore
} from '@/store/index.js'
import {
	idStore
} from '@/store/idStorage.js'
import {
	readUdDocument,
	readUdRelationalProjects,
	readUdRelationalTasks,
	readUdRelationalObjectTree,
	readUdBuildingCatalogTemplateId,
	readUlBridgeDocument,
	udDiseaseDocId,
	listUdDiseaseYears,
	listUlDiseaseYears
} from './businessDocumentStore.js'
import { unref } from 'vue'
import { hasBusinessSqlite } from './businessSqliteCore.js'
// #ifdef APP-PLUS
import { loadBridgeTemplateTree } from './bridgeCatalogDb.js'
// #endif
import { directoryLookupCache, taskBuildingCache } from './directoryLookupCache.js'

export { clearAllPathLookupCaches } from './directoryLookupCache.js'

/** App 端有 plus.sqlite 时，业务数据只认库内记录 **/
function sqliteReadsOnly() {
	return hasBusinessSqlite()
}

const emptyProjectsPayload = () => ({
	code: 0,
	msg: 'success',
	data: { projects: [] }
})

const emptyTaskPayload = () => ({
	code: 0,
	msg: 'success',
	data: { tasks: [] }
})

const emptyPropertyPayload = () => ({
	code: 0,
	msg: 'success',
	data: {}
})

const emptyDiseasePayload = () => ({
	code: 0,
	msg: 'success',
	diseases: []
})

const emptyObjectPayload = (buildingId) => ({
	code: 0,
	msg: 'success',
	buildingId,
	Iscommit: false,
	children: []
})

const emptyULFrontPhoto = () => ({
	frontLeft: [],
	frontRight: [],
	sideLeft: [],
	sideRight: [],
	commitType: 2
})

const emptyULDisease = () => ({
	code: 0,
	msg: 'success',
	diseases: []
})

/**
 * 项目列表：库/接口常为 { data: { projects } }，页面侧习惯用顶层 projects。
 * 保证返回值始终包含顶层 projects 数组。
 */
function normalizeProjectsPayload(parsed) {
	if (!parsed || typeof parsed !== 'object') {
		return { code: 0, msg: 'success', projects: [], data: { projects: [] } }
	}
	if (Array.isArray(parsed.projects)) {
		return parsed
	}
	if (parsed.data && Array.isArray(parsed.data.projects)) {
		return { ...parsed, projects: parsed.data.projects }
	}
	// 兜底：注入空 projects 以防页面 undefined
	if (!Array.isArray(parsed.projects)) {
		return { ...parsed, projects: [] }
	}
	return parsed
}

/**
 * 任务列表：库/接口常为 { data: { tasks } }，与下游 normalizeTaskPayload(projectId) 区分。
 * 保证返回值始终包含顶层 tasks 数组。
 */
function unwrapTaskPayloadFromStore(parsed) {
	if (!parsed || typeof parsed !== 'object') {
		return { code: 0, msg: 'success', tasks: [], data: { tasks: [] } }
	}
	if (Array.isArray(parsed.tasks)) {
		return parsed
	}
	if (parsed.data && Array.isArray(parsed.data.tasks)) {
		return { ...parsed, tasks: parsed.data.tasks }
	}
	if (!Array.isArray(parsed.tasks)) {
		return { ...parsed, tasks: [] }
	}
	return parsed
}

/** 开发时可选：设为 true 打出业务读库摘要（排查数据空白时打开） */
const LOG_SQLITE_READS = true

/**
 * UD 数据根目录前缀：
 * - 命中顶层 `project/`（matchedDir === 'project'）时，UD 数据实际在 `_doc/project/*`、`_doc/building/*`，不再额外套一层目录
 * - 命中 `UD-xxxx-user` 时，UD 数据在 `_doc/<UD-...>/*`
 */
function udRootPrefix(matchedDir) {
	return matchedDir === 'project' ? '' : `${matchedDir}/`
}

function logUdRead(label, rootDir, docType, docId, legacyFullPath) {
	if (LOG_SQLITE_READS && sqliteReadsOnly() && rootDir) {
		console.log(`[SQLite] ${label} u{userId}.db ${docType}/${docId}`)
	} else if (!sqliteReadsOnly()) {
		console.log(`${label}:`, legacyFullPath)
	}
}

function logUlBridgeRead(label, ulRoot, buildingId, docType, docId, legacyFullPath) {
	if (LOG_SQLITE_READS && sqliteReadsOnly() && ulRoot) {
		console.log(`[SQLite] ${label} building/${buildingId}/data.db ${docType}/${docId}`)
	} else if (!sqliteReadsOnly()) {
		console.log(`${label}:`, legacyFullPath)
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
          reject(`获取文件对象失败: ${path}, 错误: ${err.message || '未知错误'}`);
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
export async function findMatchingDirectory(userName) {
  try {
    const userInfo = userStore();
    const cacheKeys = [userName || '', userInfo.UDPath || ''].filter(Boolean);
    for (const cacheKey of cacheKeys) {
      const cachedDir = directoryLookupCache.get(cacheKey);
      if (cachedDir) {
        return cachedDir;
      }
    }

    // 获取_doc目录下的所有子目录
    const allDirs = await getAllFirstLevelDirs();

    console.log('[findMatchingDirectory] userName=', userName,
      'UDPath=', userInfo.UDPath, 'sqliteOnly=', sqliteReadsOnly(),
      'allDirs=', allDirs.slice(0, 15))

    // SQLite 模式下：必须优先命中 UDPath（真实数据包目录，内含 u{userId}.db）
    if (sqliteReadsOnly() && userInfo.UDPath && allDirs.includes(userInfo.UDPath)) {
      console.log('[findMatchingDirectory] 命中 UDPath:', userInfo.UDPath)
      cacheKeys.forEach(cacheKey => directoryLookupCache.set(cacheKey, userInfo.UDPath));
      return userInfo.UDPath;
    }

    // SQLite：在命中顶层 project/ 之前，先按用户名匹配 UD-xxxx-用户名（下载后的库在此目录）
    if (sqliteReadsOnly() && userName) {
      const udDirsEarly = allDirs.filter(dir => dir.startsWith('UD'));
      for (const dir of udDirsEarly) {
        const lastDashIndex = dir.lastIndexOf('-');
        if (lastDashIndex !== -1 && lastDashIndex < dir.length - 1) {
          const dirUsername = dir.substring(lastDashIndex + 1);
          if (dirUsername === userName) {
            userInfo.setUDPath(dir);
            cacheKeys.forEach(cacheKey => directoryLookupCache.set(cacheKey, dir));
            directoryLookupCache.set(userName, dir);
            directoryLookupCache.set(dir, dir);
            return dir;
          }
        }
      }
    }

    // 仅非 SQLite 时使用顶层 project/（SQLite 下易被空目录占位误判）
    if (!sqliteReadsOnly() && allDirs.includes('project')) {
      cacheKeys.forEach(cacheKey => directoryLookupCache.set(cacheKey, 'project'));
      return 'project';
    }

    if (userInfo.UDPath && allDirs.includes(userInfo.UDPath)) {
      cacheKeys.forEach(cacheKey => directoryLookupCache.set(cacheKey, userInfo.UDPath));
      return userInfo.UDPath;
    }

    const udDirs = allDirs.filter(dir => dir.startsWith('UD'));

    for (const dir of udDirs) {
      const lastDashIndex = dir.lastIndexOf('-');
      if (lastDashIndex !== -1 && lastDashIndex < dir.length - 1) {
        const dirUsername = dir.substring(lastDashIndex + 1);

        if (userName && dirUsername === userName) {
          userInfo.setUDPath(dir);
          directoryLookupCache.set(userName, dir);
          directoryLookupCache.set(dir, dir);
          return dir;
        }
      }
    }

    console.warn('[findMatchingDirectory] 未找到匹配目录, userName=', userName, 'udDirs=', allDirs.filter(d => d.startsWith('UD')))
    return null;
  } catch (error) {
    console.error('查找匹配UD目录时出错:', error);
    return null;
  }
}

// 修改getProject函数，使用辅助函数
export async function getProject(userName) {
  try {
    const matchedDir = await findMatchingDirectory(userName);
    const projectPath = DOC_BASE_PATH + udRootPrefix(matchedDir) + 'project/projects.json'
    logUdRead('getProject 项目列表', matchedDir, 'projects', 'root', projectPath)
    console.log('[getProject] matchedDir=', matchedDir, 'userName=', userName, 'sqliteOnly=', sqliteReadsOnly())

    try {
      if (matchedDir) {
        const uid = unref(idStore().userId)
        console.log('[getProject] 尝试 document_store, uid=', uid)

        const fromDb = await readUdDocument(matchedDir, 'projects', 'root', uid || undefined)
        if (fromDb != null) {
          console.log('[getProject] document_store 命中')
          return normalizeProjectsPayload(fromDb)
        }

        // document_store 无数据 → 尝试 bi_project 关系表
        console.log('[getProject] document_store 未命中, 尝试 bi_project 关系表')
        const fromRel = await readUdRelationalProjects(matchedDir, uid || undefined)
        if (fromRel != null) {
          console.log('[getProject] bi_project 命中, 项目数:', fromRel.projects?.length)
          return normalizeProjectsPayload(fromRel)
        }

        // 关系表也无数据 → 尝试 JSON 文件
        console.log('[getProject] bi_project 也无数据, 尝试 JSON 回退')
        if (sqliteReadsOnly()) {
          try {
            const fromJson = await getJsonData(projectPath)
            if (fromJson != null) return normalizeProjectsPayload(fromJson)
          } catch {
            /* ignore */
          }
          return normalizeProjectsPayload(emptyProjectsPayload())
        }
      }
      if (sqliteReadsOnly()) return normalizeProjectsPayload(emptyProjectsPayload())
      const rawJson = await getJsonData(projectPath)
      return normalizeProjectsPayload(rawJson)
    } catch (readError) {
      console.error('读取项目文件失败:', readError);
      return normalizeProjectsPayload(emptyProjectsPayload())
    }
  } catch (error) {
    console.error('获取项目数据失败:', error);
    return normalizeProjectsPayload(emptyProjectsPayload())
  }
}

//此username是带日期的（目录名如 UD25-04-12-user）
export async function getHadProject(userNameWithDate) {
	const path = DOC_BASE_PATH + `${userNameWithDate}/project/projects.json`
	logUdRead('getHadProject 项目列表', userNameWithDate, 'projects', 'root', path)
	try {
		if (userNameWithDate) {
			const uid = unref(idStore().userId)
			const fromDb = await readUdDocument(userNameWithDate, 'projects', 'root', uid || undefined)
			if (fromDb != null) return normalizeProjectsPayload(fromDb)
			// document_store 无数据 → 尝试 bi_project 关系表
			const fromRel = await readUdRelationalProjects(userNameWithDate, uid || undefined)
			if (fromRel != null) return normalizeProjectsPayload(fromRel)
		}
		return normalizeProjectsPayload(await getJsonData(path))
	} catch (readError) {
		console.error('读取 had 用户项目文件失败:', readError);
		return normalizeProjectsPayload(emptyProjectsPayload())
	}
}

// 修改getTask函数，使用辅助函数
export async function getTask(userName, projectId) {
  try {
    const matchedDir = await findMatchingDirectory(userName);
    const taskPath = DOC_BASE_PATH + udRootPrefix(matchedDir) + `project/${projectId}/task.json`
    logUdRead(`getTask project=${projectId}`, matchedDir, 'task', String(projectId), taskPath)
    console.log('[getTask] matchedDir=', matchedDir, 'projectId=', projectId)

    try {
      if (matchedDir) {
        const uid = unref(idStore().userId)
        const fromDb = await readUdDocument(matchedDir, 'task', String(projectId), uid || undefined)
        if (fromDb != null) return unwrapTaskPayloadFromStore(fromDb)

        // document_store 无数据 → 尝试 bi_task 关系表
        console.log('[getTask] document_store 未命中, 尝试 bi_task 关系表')
        const fromRel = await readUdRelationalTasks(matchedDir, projectId, uid || undefined)
        if (fromRel != null) return unwrapTaskPayloadFromStore(fromRel)
      }
      return unwrapTaskPayloadFromStore(await getJsonData(taskPath))
    } catch (readError) {
      console.error('读取任务文件失败:', readError);
      return unwrapTaskPayloadFromStore(emptyTaskPayload())
    }
  } catch (error) {
    console.error('获取任务数据失败:', error);
    return unwrapTaskPayloadFromStore(emptyTaskPayload())
  }
}

// 修改getTaskByHadUsername函数
export async function getTaskByHadUsername(hadUsername, projectId) {
  try {
    const path = DOC_BASE_PATH + `${hadUsername}/project/${projectId}/task.json`
    logUdRead(`getTaskByHadUsername project=${projectId}`, hadUsername, 'task', String(projectId), path)

    try {
      if (hadUsername) {
        const fromDb = await readUdDocument(hadUsername, 'task', String(projectId))
        if (fromDb != null) return unwrapTaskPayloadFromStore(fromDb)
        // document_store 无数据 → 尝试 bi_task 关系表
        const fromRel = await readUdRelationalTasks(hadUsername, projectId)
        if (fromRel != null) return unwrapTaskPayloadFromStore(fromRel)
      }
      return unwrapTaskPayloadFromStore(await getJsonData(path))
    } catch (readError) {
      console.error('读取指定用户任务文件失败:', readError);
      return unwrapTaskPayloadFromStore(emptyTaskPayload())
    }
  } catch (error) {
    console.error('获取指定用户任务数据失败:', error);
    return unwrapTaskPayloadFromStore(emptyTaskPayload())
  }
}

export async function getProperty(userName, buildingId) {
  try {
    // 查找匹配的目录
    const matchedDir = await findMatchingDirectory(userName);

    // 构建属性文件路径
    const propertyPath = DOC_BASE_PATH + udRootPrefix(matchedDir) + `building/${buildingId}/property.json`
	logUdRead(`getProperty building=${buildingId}`, matchedDir, 'property', String(buildingId), propertyPath)

    try {
      if (matchedDir) {
        const fromDb = await readUdDocument(matchedDir, 'property', String(buildingId))
        if (fromDb != null) return fromDb
        // SQLite 无数据时回退 JSON
      }
      return await getJsonData(propertyPath)
    } catch (readError) {
      console.log('属性文件不存在，返回默认数据结构:', readError);
      // 返回默认的属性数据结构
      return {
        code: 0,
        msg: "success",
        data: {}
      };
    }
  } catch (error) {
    console.error('获取属性数据失败:', error);
    // 返回默认的属性数据结构，而不是抛出错误
    return {
      code: 0,
      msg: "success",
      data: {}
    };
  }
}

function findPropertyValue(node, names) {
	if (!node) return ''
	if (Array.isArray(node)) {
		for (const item of node) {
			const value = findPropertyValue(item, names)
			if (value !== '') return value
		}
		return ''
	}
	if (typeof node !== 'object') return ''

	const nodeNames = [node.name, node.label, node.title, node.fieldName, node.key].filter(Boolean)
	const matchedName = nodeNames.some(name => names.includes(name))
	if (matchedName) {
		const candidates = [
			node.value,
			node.defaultValue,
			node.text,
			node.label,
			node.content,
			node.inputValue,
			node.selectedLabel,
			node.selectedValue,
			node.dictLabel,
			node.dictValue
		]
		const matched = candidates.find(value => value !== undefined && value !== null && value !== '')
		if (matched !== undefined) {
			return matched
		}
	}

	if (Array.isArray(node.children)) {
		for (const child of node.children) {
			const value = findPropertyValue(child, names)
			if (value !== '') return value
		}
	}

	return ''
}

function buildFallbackBuilding(task, propertyPayload) {
	const propertyRoot = propertyPayload?.property || propertyPayload?.data?.property || propertyPayload?.data || propertyPayload
	const readValue = (names, fallback = '') => {
		const value = findPropertyValue(propertyRoot, names)
		return value !== '' ? value : fallback
	}

	return {
		id: task.buildingId,
		name: task?.building?.name || task?.name || readValue(['桥梁名称', '名称'], ''),
		buildingCode: task?.building?.buildingCode || task?.buildingCode || readValue(['桥梁编号', '桥梁代码', '编号'], ''),
		routeName: task?.building?.routeName || task?.routeName || readValue(['路线名称', '线路名称', '路线'], ''),
		routeCode: task?.building?.routeCode || task?.routeCode || readValue(['路线编号', '线路编号', '路线代码'], ''),
		bridgePileNumber: task?.building?.bridgePileNumber || task?.bridgePileNumber || readValue(['中心桩号', '桩号', '桥位桩号'], ''),
		bridgeLength: task?.building?.bridgeLength || task?.bridgeLength || readValue(['桥长', '桥梁全长', '全长', '总长', '桥梁长度'], ''),
		bridgeRank: task?.building?.bridgeRank || task?.bridgeRank || readValue(['技术等级', '桥梁技术等级', '桥梁等级'], '/'),
		bridgeType: task?.building?.bridgeType || task?.bridgeType || readValue(['桥型', '桥梁类型', '桥型类别', '结构类型'], '')
	}
}

function normalizeTaskPayload(taskPayload, projectId) {
	if (!taskPayload) {
		return {
			projectId,
			tasks: []
		}
	}

	if (Array.isArray(taskPayload.tasks)) {
		return {
			...taskPayload,
			projectId: taskPayload.projectId || projectId,
			tasks: taskPayload.tasks
		}
	}

	if (Array.isArray(taskPayload?.data?.tasks)) {
		return {
			...taskPayload,
			projectId: taskPayload?.data?.projectId || taskPayload.projectId || projectId,
			tasks: taskPayload.data.tasks
		}
	}

	return {
		...taskPayload,
		projectId: taskPayload.projectId || projectId,
		tasks: []
	}
}

async function getCachedTaskBuilding(userName, task) {
	if (!task?.buildingId) {
		return buildFallbackBuilding(task || {}, null)
	}

	const cacheKey = `${userName || ''}:${task.buildingId}`
	if (!taskBuildingCache.has(cacheKey)) {
		taskBuildingCache.set(cacheKey, (async () => {
			try {
				const propertyPayload = await getProperty(userName, task.buildingId)
				return buildFallbackBuilding(task, propertyPayload)
			} catch (error) {
				console.error('聚合任务桥梁信息失败:', task.buildingId, error)
				return buildFallbackBuilding(task, null)
			}
		})())
	}

	return await taskBuildingCache.get(cacheKey)
}

export async function getTaskListWithBuildings(userName, projectId) {
	const taskPayload = normalizeTaskPayload(await getTask(userName, projectId), projectId)
	if (!Array.isArray(taskPayload.tasks) || taskPayload.tasks.length === 0) {
		return taskPayload
	}

	const tasks = await Promise.all(taskPayload.tasks.map(async (task) => {
		if (!task || !task.buildingId) return task
		if (task.building && (task.building.name || task.building.buildingCode)) {
			return task
		}

		const building = await getCachedTaskBuilding(userName, task)
		return {
			...task,
			building
		}
	}))

	return {
		...taskPayload,
		tasks
	}
}

export async function getDisease(userName, buildingId, yearId) {
  try {
    // 查找匹配的目录
    const matchedDir = await findMatchingDirectory(userName);
    
    // 构建病害文件路径
    const diseasePath = DOC_BASE_PATH + udRootPrefix(matchedDir) + `building/${buildingId}/disease/${yearId}.json`
	logUdRead(
		`getDisease building=${buildingId} year=${yearId}`,
		matchedDir,
		'disease',
		udDiseaseDocId(buildingId, yearId),
		diseasePath
	)
    
    try {
      if (matchedDir) {
        const fromDb = await readUdDocument(matchedDir, 'disease', udDiseaseDocId(buildingId, yearId))
        if (fromDb != null) return fromDb
        // SQLite 无数据时回退 JSON
      }
      return await getJsonData(diseasePath)
    } catch (readError) {
      console.log('病害文件不存在，返回默认数据结构:', readError);
      // 返回默认的病害数据结构
      return {
        code: 0,
        msg: "success",
        diseases: []
      };
    }
  } catch (error) {
    console.error('获取病害数据失败:', error);
    // 返回默认的病害数据结构，而不是抛出错误
    return {
      code: 0,
      msg: "success",
      diseases: []
    };
  }
}

export async function getObject(userName, buildingId) {
  try {
    const matchedDir = await findMatchingDirectory(userName);
    const objectPath = DOC_BASE_PATH + udRootPrefix(matchedDir) + `building/${buildingId}/object.json`
    logUdRead(`getObject building=${buildingId}`, matchedDir, 'object', String(buildingId), objectPath)

    try {
      if (matchedDir) {
        // 1. document_store
        const fromDb = await readUdDocument(matchedDir, 'object', String(buildingId))
        if (fromDb != null) {
          console.log('[getObject] document_store 命中')
          return fromDb
        }

        // 2. UD：优先完整实例子树；否则用实例根上的 template_object_id 从 common.db 拉桥型模板
        if (sqliteReadsOnly()) {
          const uid = unref(idStore().userId)

          const fromRel = await readUdRelationalObjectTree(matchedDir, buildingId, uid || undefined)
          if (fromRel != null && Array.isArray(fromRel.children) && fromRel.children.length > 0) {
            let out = fromRel
            const rid = out.id != null ? Number(out.id) : NaN
            const tid = out.templateObjectId != null ? Number(out.templateObjectId) : NaN
            if (!Number.isFinite(tid) || tid <= 0 || tid === rid) {
              const catalogId = await readUdBuildingCatalogTemplateId(
                matchedDir,
                buildingId,
                uid || undefined
              )
              if (catalogId) {
                out = { ...out, templateObjectId: catalogId }
              }
            }
            console.log('[getObject] bi_object 实例子树命中, children:', out.children.length,
              'templateObjectId=', out.templateObjectId)
            return out
          }

          const catalogId = await readUdBuildingCatalogTemplateId(matchedDir, buildingId, uid || undefined)
          console.log('[getObject] common.db 模板根 template_object_id=', catalogId,
            '（root_object_id 为实例 id，不可直接当模板 id）')
          // #ifdef APP-PLUS
          if (catalogId) {
            try {
              const template = await loadBridgeTemplateTree(catalogId)
              if (template && Array.isArray(template.children) && template.children.length > 0) {
                console.log('[getObject] common.db 模板树命中, children:', template.children.length)
                return {
                  ...template,
                  buildingId: Number(buildingId),
                  templateObjectId: catalogId,
                  Iscommit: false,
                  status: 0,
                  commit: 2,
                  warning: false
                }
              }
            } catch (e) {
              console.error('[getObject] loadBridgeTemplateTree(common.db) 失败:', e)
            }
          }
          // #endif

          if (fromRel != null) {
            console.log('[getObject] 退回 bi_object 根节点（无子节点且无模板）')
            return fromRel
          }
        }
      }

      // 3. JSON 文件回退（兼容旧数据包）
      try {
        const fromJson = await getJsonData(objectPath)
        if (fromJson != null) return fromJson
      } catch { /* ignore */ }

      return emptyObjectPayload(buildingId)
    } catch (readError) {
      console.log('对象文件不存在，返回默认数据结构:', readError);
      return emptyObjectPayload(buildingId)
    }
  } catch (error) {
    console.error('获取对象数据失败:', error);
    return emptyObjectPayload(buildingId)
  }
}

// 获取历史年份方法（返回除当前年份外的所有年份字符串倒序数组）
export async function getHistoryYear(userName, buildingId, projectYear) {
	try {
		const matchedDir = await findMatchingDirectory(userName);
		const matchedUlDir = await findMatchingULDirectory(userName);
		const yearSet = new Set();

		// 1) 磁盘 disease 目录下的 YYYY.json
		if (matchedDir) {
			const dirPath = DOC_BASE_PATH + udRootPrefix(matchedDir) + `building/${buildingId}/disease`;
			try {
				const files = await listDirectoryFiles(dirPath);
				const yearFiles = files.filter((file) => file.name && /^\d{4}\.json$/.test(file.name));
				yearFiles.forEach((file) => yearSet.add(file.name.split('.')[0]));
			} catch (error) {
				console.warn('读取历史病害年份（磁盘目录）失败，已忽略:', error?.message || error);
			}
		}

		// 2) UD 用户库：病害已迁入 SQLite 时目录可能已无 .json，需从库中补全年份
		if (sqliteReadsOnly() && matchedDir) {
			const fromUd = await listUdDiseaseYears(matchedDir, buildingId);
			fromUd.forEach((y) => yearSet.add(y));
		}

		// 3) UL data.db：本地编辑库中的病害年份
		if (sqliteReadsOnly() && matchedUlDir) {
			const fromUl = await listUlDiseaseYears(matchedUlDir, buildingId);
			fromUl.forEach((y) => yearSet.add(y));
		}

		const currentYear = projectYear != null ? String(projectYear) : '';

		const filteredYears = [...yearSet]
			.filter((year) => year !== currentYear)
			.sort((a, b) => Number(b) - Number(a));

		return filteredYears;
	} catch (error) {
		console.error('获取历史年份时出错:', error);
		return [];
	}
}

// 辅助方法：列出目录中的文件
export function listDirectoryFiles(path) {
	return new Promise((resolve, reject) => {
		// 1. 获取完整的沙盒目录路径
		const fullPath = plus.io.convertLocalFileSystemURL(path);
		plus.io.resolveLocalFileSystemURL(fullPath, entry => {
			if (entry.isDirectory) {
				const directoryReader = entry.createReader();
				directoryReader.readEntries(
					entries => resolve(Array.from(entries)),
					reject
				);
			} else {
				reject(new Error('路径不是目录'));
			}
		}, reject);
	});
}

// 将图片相对路径转为绝对路径进行读取
export async function readDiseaseImages(userName, buildingId, relativePaths) {
  try {
    // 查找匹配的目录
    const matchedDir = await findMatchingULDirectory(userName);
    
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
    console.error('读取病害图片失败:', error);
    throw error;
  }
}

export async function readDiseaseUDImages(userName, buildingId, relativePaths) {
    try {
        // 查找匹配的目录
        const matchedDir = await findMatchingDirectory(userName);

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
        console.error('读取病害图片失败:', error);
        throw error;
    }
}

//从UL中读取图片
export async function readBridgeImage(userName, buildingId, relativePaths) {
  try {
    // 查找匹配的目录
    const matchedDir = await findMatchingULDirectory(userName);
    
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

//从UD中读取图片
export async function readBridgeUDImage(userName, buildingId, relativePaths){
    try {
        // 查找匹配的目录
        const matchedDir = await findMatchingDirectory(userName);

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

/** 与 getULFrontPhoto 一致：优先 UL 桥 data.db，再 JSON，避免 frontPhoto.json 已迁入库后仍读文件报错 */
export async function getFrontPhoto(userName, buildingId) {
    return getULFrontPhoto(userName, buildingId)
}

export async function getUDFrontPhoto(userName, buildingId) {
    const matchedDir = await findMatchingDirectory(userName)
    const path = DOC_BASE_PATH + udRootPrefix(matchedDir) + `building/${buildingId}/frontPhoto.json`
    logUdRead(`getUDFrontPhoto building=${buildingId}`, matchedDir, 'frontPhoto', String(buildingId), path)
    if (sqliteReadsOnly() && matchedDir) {
        const fromDb = await readUdDocument(matchedDir, 'frontPhoto', String(buildingId))
        if (fromDb != null) return fromDb
        // SQLite 无数据时回退 JSON（旧包 frontPhoto.json）
    }
    return getJsonData(path)
}

export function removeDiseaseImage(paths) {
	return new Promise((resolve, reject) => {
		try {
			// 如果是数组，处理多个文件
			if (Array.isArray(paths)) {
				const results = [];
				const errors = [];

				// 处理每个文件
				paths.forEach((absolutePath, index) => {
					plus.io.resolveLocalFileSystemURL(absolutePath, (entry) => {
						entry.remove(
							() => {
								console.log(`成功删除图片: ${absolutePath}`);
								results.push({
									path: absolutePath,
									success: true
								});

								// 当所有文件处理完成后，返回结果
								if (results.length + errors.length === paths.length) {
									resolve({
										success: errors.length === 0,
										results: results,
										errors: errors
									});
								}
							},
							(err) => {
								console.error(`删除图片失败: ${absolutePath}`, err);
								errors.push({
									path: absolutePath,
									error: err.message || '删除失败'
								});

								// 当所有文件处理完成后，返回结果
								if (results.length + errors.length === paths.length) {
									resolve({
										success: errors.length === 0,
										results: results,
										errors: errors
									});
								}
							}
						);
					}, (err) => {
						console.error(`无法解析文件路径: ${absolutePath}`, err);
						errors.push({
							path: absolutePath,
							error: '无法解析文件路径'
						});

						// 当所有文件处理完成后，返回结果
						if (results.length + errors.length === paths.length) {
							resolve({
								success: errors.length === 0,
								results: results,
								errors: errors
							});
						}
					});
				});
			} else {
				// 处理单个文件
				const absolutePath = paths;

				plus.io.resolveLocalFileSystemURL(absolutePath, (entry) => {
					entry.remove(
						() => {
							console.log(`成功删除图片: ${absolutePath}`);
							resolve({
								success: true,
								path: absolutePath
							});
						},
						(err) => {
							console.error(`删除图片失败: ${absolutePath}`, err);
							reject({
								success: false,
								path: absolutePath,
								error: err.message || '删除失败'
							});
						}
					);
				}, (err) => {
					console.error(`无法解析文件路径: ${absolutePath}`, err);
					reject({
						success: false,
						path: absolutePath,
						error: '无法解析文件路径'
					});
				});
			}
		} catch (error) {
			console.error('删除图片时发生错误:', error);
			reject({
				success: false,
				error: error.message || '删除过程中发生错误'
			});
		}
	});
}

//是否有未提交病害
export async function readDiseaseCommit(userName, buildingId, yearId) {
	try {
		// 获取病害数据并等待Promise解析
		const diseaseData = await getULDisease(userName, buildingId, yearId);

		// 检查diseases数组是否存在
		if (!diseaseData || !diseaseData.diseases || !Array.isArray(diseaseData.diseases)) {
			console.log('没有找到病害数据或数据格式不正确');
			return false;
		}

		// 使用some方法检查是否有任何病害的commit_type为1（未提交）或为2（需要删除）
		const hasUncommittedDiseases = diseaseData.diseases.some(disease => disease.commitType === 1 || disease
			.commitType === 2);

		console.log(`检查未提交病害: ${hasUncommittedDiseases ? '有未提交病害' : '全部已提交'}`);
		return hasUncommittedDiseases;
	} catch (error) {
		console.error('检查病害提交状态时出错:', error);
		return false; // 出错时返回false
	}
}

// 统计某个构件中病害构件数量
export async function readDiseaseComponent(userName, buildingId, biObjectId) {
	const currentYear = new Date().getFullYear().toString();

	try {
		// 获取当前年份的病害数据
		const diseaseData = await getULDisease(userName, buildingId, currentYear);

		// 检查数据是否有效
		if (!diseaseData || !diseaseData.diseases || !Array.isArray(diseaseData.diseases)) {
			console.log('没有找到病害数据或数据格式不正确');
			return 0; // 如果没有数据或格式不正确，返回0
		}

		// 用于存储已经统计过的code，避免重复计数
		const countedCodes = new Set();

		// 统计符合条件的病害数量
		let count = 0;

		// 遍历所有病害
		diseaseData.diseases.forEach(disease => {
			// 排除已删除的病害记录(commit_type为2)
			if (disease.commitType === 2) {}

			// 检查component字段是否存在且biObjectId匹配
			else if (disease.component &&
				disease.component.biObjectId === biObjectId &&
				disease.component.code) {

				const code = disease.component.code;

				// 检查这个code是否已经被统计过
				if (!countedCodes.has(code)) {
					// 如果没有被统计过，计数加1并将code添加到Set中
					count++;
					countedCodes.add(code);
				}
			}
		});

		console.log(`biObjectId ${biObjectId} 下不重复的code数量: ${count}`);
		return count;

	} catch (error) {
		console.error('统计病害组件出错:', error);
		return 0; // 出错时返回0
	}
}

// 新增病害时判断某一构建下面是否有病害
/*export async function isExistDisease(userName, buildingId, componentName, biObjectId) {
	try {
		// 获取当前年份
		const currentYear = new Date().getFullYear().toString();

		// 获取当前年份的病害数据
		const diseaseData = await getULDisease(userName, buildingId, currentYear);

		// 检查数据是否有效
		if (!diseaseData || !diseaseData.diseases || !Array.isArray(diseaseData.diseases)) {
			console.log('没有找到病害数据或数据格式不正确');
			return false; // 如果没有数据或格式不正确，返回false
		}

		// 过滤掉已删除的病害记录，然后检查剩余记录中是否存在匹配的componentName
		const exists = diseaseData.diseases.filter(disease => disease.commitType !== 2)
			.some(disease => disease.component && disease.component.name === componentName && disease.component.biObject.id === biObjectId);

		console.log(`检查componentName为 ${componentName} 的病害${exists ? '存在' : '不存在'}`);
		return exists;

	} catch (error) {
		console.error('检查病害是否存在与某个构件上时出错:', error);
		return false; // 出错时返回false
	}
}*/

// 删除病害时判断某一构建下面是否只有一个病害
/*export async function isOnlyDisease(userName, buildingId, componentName, biObjectId) {
	try {
		// 获取当前年份
		const currentYear = new Date().getFullYear().toString();

		// 获取当前年份的病害数据
		const diseaseData = await getULDisease(userName, buildingId, currentYear);

		// 检查数据是否有效
		if (!diseaseData || !diseaseData.diseases || !Array.isArray(diseaseData.diseases)) {
			console.log('没有找到病害数据或数据格式不正确');
			return false; // 如果没有数据或格式不正确，返回false
		}

		// 过滤出与指定componentName匹配且未删除的病害记录
		const matchingDiseases = diseaseData.diseases.filter(disease =>
			disease.component &&
			disease.component.name === componentName &&
            disease.component.biObject.id === biObjectId &&
			disease.commitType !== 2 // 排除已删除的病害记录
		);

		// 检查是否只有一个匹配的记录
		const isOnly = matchingDiseases.length === 1;

		console.log(`componentName为 ${componentName},biObjectId为${biObjectId} 的病害${isOnly ? '只有一个' : '有多个或没有'}`);
		return isOnly;

	} catch (error) {
		console.error('检查病害是否唯一时出错:', error);
		return false; // 出错时返回false
	}
}*/
// 判断是否编辑过 
export async function isCommit(userName, buildingId) {
	const data = await getObject(userName, buildingId);
	if (data.Iscommit == true) {
		return true;
	} else {
		return false;
	}
}

//提交时判断是否有未完成的病害，commitType == 3的病害
export async function isUnFinishDisease(userName, buildingId, yearId) {
	try {
		// 获取病害数据并等待Promise解析
		const diseaseData = await getULDisease(userName, buildingId, yearId);

		// 检查diseases数组是否存在
		if (!diseaseData || !diseaseData.diseases || !Array.isArray(diseaseData.diseases)) {
			console.log('没有找到病害数据或数据格式不正确');
			return false;
		}

		// 使用some方法检查是否有任何病害的commit_type为3（未完成）
		const hasUnFinishDiseases = diseaseData.diseases.some(disease => disease.commitType === 3);

		console.log(`检查未完成病害: ${hasUnFinishDiseases ? '有未完成病害' : '没有未完成病害'}`);
		return hasUnFinishDiseases;
	} catch (error) {
		console.error('检查病害完成状态时出错:', error);
		return false; // 出错时返回false
	}
}

//读取绝对路径为相对路径
export function buildingImagesFromAbsoluteToRelative(absolutePaths) {
	return absolutePaths.map(path => {
		const parts = path.split('/building/');
		if (parts.length < 2) {
			return '';
		}
		return parts[1]; // 返回'/building/'后面的部分
	});
}

//读取UL下的数据
export async function findMatchingULDirectory(userName) {
    try {
        // 获取_doc目录下的所有子目录
        const allDirs = await getAllFirstLevelDirs();

        // 首先检查是否有project目录（优先使用）
        if (allDirs.includes('project')) {
            return 'project';
        }

        const ulDirs = allDirs.filter(dir => dir.startsWith('UL'));

        for (const dir of ulDirs) {
            const lastDashIndex = dir.lastIndexOf('-');
            if (lastDashIndex !== -1 && lastDashIndex < dir.length - 1) {
                const dirUsername = dir.substring(lastDashIndex + 1);

                if (userName && dirUsername === userName) {
                    return dir;
                }
            }
        }

        return null;
    } catch (error) {
        console.error('查找匹配目录时出错:', error);
        return null;
    }
}

//UL下的病害（data.db）
export async function getULDisease(userName, buildingId, yearId) {
    try {
        const matchedDir = await findMatchingULDirectory(userName)
        if (!matchedDir) {
            return emptyULDisease()
        }

        const diseasePath =
            DOC_BASE_PATH + `${matchedDir}/building/${buildingId}/disease/${yearId}.json`

        logUlBridgeRead(
            `getULDisease building=${buildingId} year=${yearId}`,
            matchedDir,
            buildingId,
            'disease',
            String(yearId),
            diseasePath
        )

        const fromDb = await readUlBridgeDocument(
            matchedDir,
            String(buildingId),
            'disease',
            String(yearId)
        )
        if (fromDb != null) {
            return fromDb
        }
        if (sqliteReadsOnly()) return emptyULDisease()
        return await getJsonData(diseasePath)
    } catch (error) {
        console.error('获取病害数据失败:', error)
        return emptyULDisease()
    }
}

//UL下的正立面照（data.db）
export async function getULFrontPhoto(userName, buildingId) {
    try {
        const matchedDir = await findMatchingULDirectory(userName)
        if (!matchedDir) {
            return emptyULFrontPhoto()
        }

        const diseasePath =
            DOC_BASE_PATH + `${matchedDir}/building/${buildingId}/frontPhoto.json`

        logUlBridgeRead(
            `getULFrontPhoto building=${buildingId}`,
            matchedDir,
            buildingId,
            'frontPhoto',
            'default',
            diseasePath
        )

        const fromDb = await readUlBridgeDocument(
            matchedDir,
            String(buildingId),
            'frontPhoto',
            'default'
        )
        if (fromDb != null) {
            return fromDb
        }
        if (sqliteReadsOnly()) return emptyULFrontPhoto()
        return await getJsonData(diseasePath)
    } catch (error) {
        console.error('获取正立面照数据失败:', error)
        return emptyULFrontPhoto()
    }
}

/** 将 getTask（UD 用户库 / task.json）结果规范为 UL 侧使用的 { tasks: [] } 形态 */
function normalizeULTaskPayload(raw) {
    if (!raw) {
        return { tasks: [] }
    }
    if (Array.isArray(raw.tasks)) {
        return raw
    }
    if (raw.data && Array.isArray(raw.data.tasks)) {
        return { tasks: raw.data.tasks }
    }
    return { tasks: [] }
}

// UL 侧任务与 UD 用户库同源；App+SQLite 时只走 getTask（库），不读 UL 下 task.json
export async function getULTask(userName, projectId) {
    try {
        if (sqliteReadsOnly()) {
            const fromUd = await getTask(userName, projectId)
            return normalizeULTaskPayload(fromUd)
        }
        const matchedDir = await findMatchingULDirectory(userName)
        if (matchedDir) {
            const taskPath = DOC_BASE_PATH + `${matchedDir}/project/${projectId}/task.json`
            try {
                const ulJson = await getJsonData(taskPath)
                if (ulJson && Array.isArray(ulJson.tasks)) {
                    return ulJson
                }
            } catch {
                /* 忽略 */
            }
        }
        const fromUd = await getTask(userName, projectId)
        return normalizeULTaskPayload(fromUd)
    } catch (error) {
        console.error('获取UL中task数据失败:', error)
        try {
            const fromUd = await getTask(userName, projectId)
            return normalizeULTaskPayload(fromUd)
        } catch {
            return { tasks: [] }
        }
    }
}
