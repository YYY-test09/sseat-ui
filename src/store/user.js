import { defineStore } from 'pinia'

// 全局登录状态：token 与当前用户信息
// 持久化到 sessionStorage：每个浏览器标签页独立一份登录状态，
// 可以同时开两个页签分别登录 student 和 admin 演示（关闭页签即退出登录）
export const useUserStore = defineStore('user', {
  state: () => ({
    token: sessionStorage.getItem('sseat_token') || '',
    user: JSON.parse(sessionStorage.getItem('sseat_user') || 'null')
  }),
  actions: {
    setLogin(token, user) {
      this.token = token
      this.user = user
      sessionStorage.setItem('sseat_token', token)
      sessionStorage.setItem('sseat_user', JSON.stringify(user))
    },
    setUser(user) {
      this.user = user
      sessionStorage.setItem('sseat_user', JSON.stringify(user))
    },
    logout() {
      this.token = ''
      this.user = null
      sessionStorage.removeItem('sseat_token')
      sessionStorage.removeItem('sseat_user')
    }
  }
})
