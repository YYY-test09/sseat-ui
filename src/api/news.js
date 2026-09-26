import request from './request'

// ---------- 前台资讯（免登录） ----------
export const getNewsPage = (params) => request.get('/news', { params })
export const getNewsDetail = (id) => request.get(`/news/${id}`)

// ---------- 管理端资讯 ----------
export const getAdminNewsPage = (params) => request.get('/admin/news', { params })
export const getAdminNewsDetail = (id) => request.get(`/admin/news/${id}`)
export const saveAdminNews = (data) => request.post('/admin/news', data)
export const deleteAdminNews = (id) => request.delete(`/admin/news/${id}`)
