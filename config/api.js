// api.js
import { reactive } from 'vue';

const apiConfig = reactive({
  // baseURL: "http://59.110.81.142:8090", // 基础URL
  baseURL: "http://60.205.13.156:8090",
  botURL: "http://59.110.81.142:8081",
  endpoints: {
    login: "/jwt/login",
    /** 桥梁模板库 common.db 元数据 */
    commonSqlite: "/api/v2/common/sqlite",
    /** 用户工作区库元数据，{id} 为登录返回的 userId */
    userSqlite: "/api/v2/user/{id}/sqlite",
    logOut: "/api/user/logOut",
    resetPassword: "/api/user/resetPassword"
  },

  // 登录（10 秒超时，超时后自动降级离线登录）
  login: async function(username, password) {
    return await uni.request({
      url: `${apiConfig.baseURL}${apiConfig.endpoints.login}?username=${username}&password=${password}`,
      method: 'POST',
      timeout: 10000
    });
  },

  // 获取用户工作区 db 元数据（v2）
  getUserSqliteMeta: async function(userId, token) {
    const path = apiConfig.endpoints.userSqlite.replace('{id}', encodeURIComponent(String(userId)));
    return await uni.request({
      url: `${apiConfig.baseURL}${path}`,
      method: 'GET',
      timeout: 30000,
      header: {
        'Authorization': `${token}`
      }
    });
  },

  // 获取桥梁模板 common.db 元数据（v2）
  getCommonSqliteMeta: async function(token) {
    return await uni.request({
      url: `${apiConfig.baseURL}${apiConfig.endpoints.commonSqlite}`,
      method: 'POST',
      timeout: 30000,
      header: {
        'Content-Type': 'application/json',
        'Authorization': `${token}`
      },
      data: {}
    });
  },

  // 重置密码
  resetPassword: async function(oldPassword, newPassword, token) {
    return await uni.request({
      url: `${apiConfig.baseURL}${apiConfig.endpoints.resetPassword}?oldPassword=${oldPassword}&newPassword=${newPassword}`,
      method: 'POST',
      timeout: 10000,
      header: {
        'Content-Type': 'application/json',
        'Authorization': `${token}`
      }
    });
  },

  // 退出登录
  logOut: async function(token) {
    return await uni.request({
      url: `${apiConfig.baseURL}${apiConfig.endpoints.logOut}`,
      method: 'POST',
      timeout: 10000,
      header: {
        'Content-Type': 'application/json',
        'Authorization': `${token}`
      }
    });
  }
});

export default apiConfig;