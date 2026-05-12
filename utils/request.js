// 导入读写操作的工具函数
import {
    saveBridgeImage,      // 保存桥梁图片
    saveDiseaseImages,    // 保存病害图片
    setDisease,           // 写入病害数据
    setProperty,          // 写入桥梁属性
    setTask,              // 写入任务数据
    setObject,            // 写入构件数据
    setProject,           // 写入项目数据
    coverProject          // 覆盖项目数据
} from "@/utils/writeNew";
import {
    getProject,          // 读取项目数据
    getTask,             // 读取任务数据
    getAllFirstLevelDirs,// 获取一级目录列表
    getHadProject        // 获取已有项目
} from "@/utils/readJsonNew.js";
import { deleteFolderInApp } from "@/utils/deleteFolder.js" // 删除文件夹
import { userStore } from '@/store/index.js' // 用户状态管理

// 主同步函数：将服务器数据同步到本地
export async function getAllDataAndSetToLocal(projects, projectResponse, token, username) {
    try {
        const userInfo = userStore()
        let localProjectsAsync = null;
        // 1. 读取所有用户目录
        const allUsers = await readUserFolders();
        let findUser = false;
        
        // 2. 检查当前用户是否已存在
        for (const user of allUsers) {
            const hadUsernameArrBySplit = user.split('-');
            const hadUsername = hadUsernameArrBySplit[hadUsernameArrBySplit.length - 1];
            if (hadUsername === username) {
                findUser = true;
                // 已存在用户：读取旧数据
                userInfo.setHadUsername(user); 
                localProjectsAsync = await getHadProject(user);
                break;
            }
        }
        
        // 3. 获取本地项目数据
        if (!localProjectsAsync) {
            localProjectsAsync = await getProject(username)
        }
        if(findUser===false){
            username = ''; // 新用户处理
        }
        const localProjects = localProjectsAsync.data.projects
        
        // 4. 过滤项目（增删同步）
        filtProjects(localProjects, projects)

        // 5. 创建/更新项目JSON
        await createProjectJson(username, projectResponse);
        
        // 6. 遍历所有项目
        for (const project of projects) {
            const projectId = project.id;
            
            // 检查项目是否需要更新
            const localProject = localProjects.find(p => p.id === projectId);
            if (localProject && localProject.updateTime === project.updateTime) {
                continue; // 跳过未更新的项目
            }
            
            // 7. 获取项目下的桥梁任务
            const buildings = await getBuildingIdByProjectId(projectId, token, username);
            const localBuildings = await getTask(username, projectId)
            
            // 8. 遍历桥梁任务
            for (const building of buildings) {
                const buildingId = building.buildingId;
                
                // 检查桥梁是否需要更新
                const localBuilding = localBuildings.find(b => b.buildingId === buildingId);
                if (localBuilding && localBuilding.updateTime === building.updateTime) {
                    continue; // 跳过未更新的桥梁
                }
                
                // 9. 更新桥梁数据
                await propertyRequest(buildingId, token, username);   // 属性数据
                await diseaseRequest(buildingId, token, username);   // 病害数据
                await getStructureInfoByBuildingId(buildingId, token, username); // 构件数据
            }
        }
    } catch (error) {
        // 异常处理：全量下载
        await downloadProjects(username, projectResponse, projects, token)
    }
}

// 全量下载项目数据
export async function downloadProjects(username, projectResponse, projects, token) {
    // 1. 保存项目数据
    await setProject(username, projectResponse);
    
    // 2. 遍历所有项目
    for (const project of projects) {
        const projectId = project.id;
        // 3. 获取项目下的桥梁
        const buildings = await getBuildingIdByProjectId(projectId, token, username);
        
        // 4. 下载每个桥梁的数据
        for (const building of buildings) {
            const buildingId = building.buildingId;
            await propertyRequest(buildingId, token, username);
            await diseaseRequest(buildingId, token, username);
            await getStructureInfoByBuildingId(buildingId, token, username);
        }
    }
}

// 创建/更新项目JSON文件
const createProjectJson = async (username, projectResponse) => {
    const fileArray = await getAllFirstLevelDirs();
    let oldProjectUsername = null;
    
    // 1. 检查用户目录是否存在
    for (let i = 0; i < fileArray.length; i++) {
        const dir = fileArray[i];
        const name = extractUserNameFromDir(dir); // 提取用户名
        if (name === username) {
            oldProjectUsername = fileArray[i];
            break;
        }
    }
    
    // 2. 目录处理
    if (!oldProjectUsername) {
        // 新用户：创建目录
        await setProject(username, projectResponse);
    } else {
        // 老用户：覆盖数据
        await coverProject(username, projectResponse, oldProjectUsername);
    }
}

// 从目录名提取用户名 (格式: UD日期-用户名)
function extractUserNameFromDir(dirName) {
    if (dirName && dirName.startsWith('UD') && dirName.includes('-')) {
        const lastDashIndex = dirName.lastIndexOf('-');
        if (lastDashIndex !== -1) {
            return dirName.substring(lastDashIndex + 1);
        }
    }
    return '';
}

// 项目过滤与同步
const filtProjects = async (oldProjects, newProjects) => {
    const toAddProject = []
    
    // 1. 删除本地多余项目
    for (let i = oldProjects.length - 1; i >= 0; i--) {
        if (!newProjects.some(p => p.id === oldProjects[i].id)) {
            deleteFolderInApp('_doc/' + FILE_NAMING.projectsFolder(username) + '/' + oldProjects[i].id)
            oldProjects.splice(i, 1);
        }
    }
    
    // 2. 识别新增项目
    for (const newProject of newProjects) {
        if (!oldProjects.some(p => p.id === newProject.id)) {
            toAddProject.push(newProject);
            oldProjects.push({...newProject}); // 添加到本地列表
        }
    }
    
    // 3. 下载新增项目
    await downloadProjects(username, projectResponse, toAddProject, token);
}

// 获取单个项目数据
const getNewProject = async (projectId, token, username) => {
    const buildings = await getBuildingIdByProjectId(projectId, token, username);
    for (const building of buildings) {
        const buildingId = building.buildingId;
        await propertyRequest(buildingId, token, username);
        await diseaseRequest(buildingId, token, username);
        await getStructureInfoByBuildingId(buildingId, token, username);
    }
}

// 获取项目下的桥梁列表
const getBuildingIdByProjectId = async (projectId, token, username) => {
    try {
        const response = await uni.request({
            url: `${apiConfig.baseURL}/api/project/${projectId}/task`,
            method: 'GET',
            header: { 'Authorization': `${token}` }
        });
        
        if (response.data.code === 0) {
            setTask(username, projectId, response.data) // 保存到本地
            return response.data.data.tasks
        } else {
            uni.showToast({ title: '获取桥梁列表失败', icon: 'none' });
        }
    } catch (error) {
        console.error('获取桥梁列表失败:', error);
    }
}

// 获取桥梁属性数据
export async function propertyRequest(buildingId, token, username) {
    try {
        const response = await uni.request({
            url: `${apiConfig.baseURL}/api/building/${buildingId}/property`,
            method: 'GET',
            header: { 'Authorization': `${token}` }
        });

        if (response.data.code === 0) {
            const bridgedata = response.data.data;
            
            // 处理并保存两张桥梁图片
            const imgFields = bridgedata.property.children[7].children;
            for (let i = 0; i < 2; i++) {
                if (imgFields[i].value !== '/') {
                    const savedUrl = await saveBridgeImage(username, buildingId, imgFields[i].value);
                    if (savedUrl) imgFields[i].value = savedUrl;
                }
            }
            
            await setProperty(username, buildingId, bridgedata); // 保存属性数据
        }
    } catch (error) {
        console.error('获取桥梁属性失败:', error);
    }
}

// 获取病害数据
export async function diseaseRequest(buildingId, token, username) {
    try {
        const response = await uni.request({
            url: `${apiConfig.baseURL}/api/building/${buildingId}/disease`,
            method: 'GET',
            header: { 'Authorization': `${token}` }
        });
        
        if (response.data.code === 0) {
            const currentYear = new Date().getFullYear();
            
            for (const yearDisease of response.data.data) {
                // 排除当前年份数据
                if (yearDisease.year !== currentYear) {
                    // 处理病害图片
                    for (const disease of yearDisease.diseases) {
                        if (disease.images) {
                            disease.images = await saveDiseaseImages(username, buildingId, disease.images);
                        }
                        if (disease.ADImgs) {
                            disease.ADImgs = await saveDiseaseImages(username, buildingId, disease.ADImgs);
                        }
                    }
                    // 按年份保存病害数据
                    await setDisease(username, buildingId, yearDisease.year, yearDisease)
                }
            }
        }
    } catch (error) {
        console.error('获取病害数据失败:', error);
    }
}

// 获取桥梁构件数据
const getStructureInfoByBuildingId = async (buildingId, token, username) => {
    try {
        const response = await uni.request({
            url: `${apiConfig.baseURL}/api/building/${buildingId}/object`,
            method: 'GET',
            header: { 'Authorization': `${token}` }
        });
        
        if (response.data.code === 0) {
            setObject(username, buildingId, response.data.data); // 保存构件数据
        }
    } catch (error) {
        console.error('获取构件数据失败:', error);
    }
}

// 读取用户目录列表
function readUserFolders() {
    return new Promise((resolve, reject) => {
        plus.io.resolveLocalFileSystemURL('_doc/', (entry) => {
            entry.createReader().readEntries((entries) => {
                // 过滤并返回目录名称
                const folders = entries.filter(e => e.isDirectory);
                resolve(folders.map(f => f.name));
            }, reject);
        }, reject);
    });
}