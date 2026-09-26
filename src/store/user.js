import { defineStore } from 'pinia'

// 全局登录状态：token 与当前用户信息
// 持久化到 localStorage，刷新页面后仍保持登录
export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('sseat_token') || '',
    user: JSON.parse(localStorage.getItem('sseat_user') || 'null')
  }),
  actions: {
    setLogin(token, user) {
      this.token = token
      this.user = user
      localStorage.setItem('sseat_token', token)
      localStorage.setItem('sseat_user', JSON.stringify(user))
    },
    setUser(user) {
      this.user = user
      localStorage.setItem('sseat_user', JSON.stringify(user))
    },
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('sseat_token')
      localStorage.removeItem('sseat_user')
    }
  }
})
