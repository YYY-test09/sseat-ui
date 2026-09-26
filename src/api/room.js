import request from './request'

// ---------- 自习室（前台浏览，GET 均免登录） ----------
export const getRoomPage = (params) => request.get('/rooms', { params })
export const getRoomDetail = (id) => request.get(`/rooms/${id}`)
// 自习室点赞/收藏接口后端仍保留，但详情页已按需求移除该入口（论坛帖子的点赞收藏不受影响）

// ---------- 自习室（管理端） ----------
export const getAdminRoomPage = (params) => request.get('/admin/rooms', { params })
export const saveAdminRoom = (data) => request.post('/admin/rooms', data)
export const deleteAdminRoom = (id) => request.delete(`/admin/rooms/${id}`)

// ---------- 我的收藏 ----------
export const getMyFavorites = () => request.get('/user/favorites')
export const removeFavorite = (type, targetId) => request.delete(`/user/favorites/${type}/${targetId}`)
