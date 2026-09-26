import request from './request'

// ---------- 管理端：用户管理 ----------
export const getUserPage = (params) => request.get('/admin/users', { params })
export const createUser = (data) => request.post('/admin/users', data)
export const updateUser = (data) => request.put('/admin/users', data)
export const setUserStatus = (data) => request.put('/admin/users/status', data)
export const resetUserPassword = (id) => request.put(`/admin/users/${id}/reset-password`)
export const deleteUser = (id) => request.delete(`/admin/users/${id}`)

// ---------- 管理端：角色管理 ----------
export const getRoleList = () => request.get('/admin/roles')
export const saveRole = (data) => request.post('/admin/roles', data)
export const setRoleStatus = (data) => request.put('/admin/roles/status', data)
export const deleteRole = (id) => request.delete(`/admin/roles/${id}`)

// ---------- 个人中心 ----------
export const getProfile = () => request.get('/user/profile')
export const updateProfile = (data) => request.put('/user/profile', data)
export const changePassword = (data) => request.put('/user/profile/password', data)

// ---------- 通用上传 ----------
export const uploadImage = (file) => {
  const fd = new FormData()
  fd.append('file', file)
  return request.post('/common/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
}
