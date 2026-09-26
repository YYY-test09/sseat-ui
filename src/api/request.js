import axios from 'axios'
import { ElMessage } from 'element-plus'

// axios 实例：统一配置后端地址前缀和超时
const request = axios.create({
  baseURL: '/api', // 由 vite.config.js 的 proxy 转发到 localhost:8080
  timeout: 15000
})

// 请求拦截器：每个请求自动带上登录令牌
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('sseat_token')
  if (token) {
    config.headers.Authorization = 'Bearer ' + token
  }
  return config
})

// 响应拦截器：统一处理后端返回格式 { code, msg, data }
request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code !== undefined && res.code !== 200) {
      // 业务错误：弹出后端给的文字提示
      ElMessage.error(res.msg || '请求失败')
      return Promise.reject(new Error(res.msg))
    }
    return res.data !== undefined ? res.data : res
  },
  (error) => {
    const status = error.response?.status
    const url = error.config?.url || ''
    if (status === 401) {
      // 令牌失效/未登录。登录和验证码接口本身的 401 不跳转，避免死循环
      if (!url.includes('/auth/')) {
        localStorage.removeItem('sseat_token')
        localStorage.removeItem('sseat_user')
        ElMessage.warning('登录已过期，请重新登录')
        const path = location.pathname
        location.href = path.startsWith('/admin') ? '/admin/login' : '/login'
      } else {
        ElMessage.error(error.response?.data?.msg || '账号或密码错误')
      }
    } else if (status === 403) {
      ElMessage.error('没有权限执行此操作')
    } else {
      ElMessage.error(error.response?.data?.msg || '网络异常，请检查后端是否启动')
    }
    return Promise.reject(error)
  }
)

export default request
