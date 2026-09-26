import request from './request'

// ---------- 自习室（前台浏览，GET 均免登录） ----------
export const getRoomPage = (params) => request.get('/rooms', { params })
export const getRoomDetail = (id) => request.get(`/rooms/${id}`)
export const toggleRoomLike = (id) => request.post(`/rooms/${id}/like`)
export const toggleRoomFavorite = (id) => request.post(`/rooms/${id}/favorite`)

// ---------- 自习室（管理端） ----------
export const getAdminRoomPage = (params) => request.get('/admin/rooms', { params })
export const saveAdminRoom = (data) => request.post('/admin/rooms', data)
export const deleteAdminRoom = (id) => request.delete(`/admin/rooms/${id}`)

// ---------- 我的收藏 ----------
export const getMyFavorites = () => request.get('/user/favorites')
export const removeFavorite = (type, targetId) => request.delete(`/user/favorites/${type}/${targetId}`)
