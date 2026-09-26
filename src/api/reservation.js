import request from './request'

// ---------- 用户端预约 ----------
export const getSlots = (params) => request.get('/user/reservations/slots', { params })
export const getOccupiedSeats = (params) => request.get('/user/reservations/seats', { params })
export const bookRoom = (data) => request.post('/user/reservations', data)
export const getMyReservations = (params) => request.get('/user/reservations/my', { params })
export const cancelReservation = (id) => request.put(`/user/reservations/${id}/cancel`)

// ---------- 管理端预约 ----------
export const getAdminReservationPage = (params) => request.get('/admin/reservations', { params })
export const saveAdminReservation = (data) => request.post('/admin/reservations', data)
export const setAdminReservationStatus = (data) => request.put('/admin/reservations/status', data)
export const deleteAdminReservation = (id) => request.delete(`/admin/reservations/${id}`)

// 预约状态文案与颜色
export const STATUS_TEXT = { 0: '待确认', 1: '已确认', 2: '已完成', 3: '已取消' }
export const STATUS_TYPE = { 0: 'warning', 1: 'success', 2: 'info', 3: 'danger' }
