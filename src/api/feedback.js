import request from './request'

// ---------- 用户端反馈 ----------
export const submitFeedback = (content) => request.post('/user/feedbacks', { content })
export const getMyFeedbacks = (params) => request.get('/user/feedbacks/mine', { params })

// ---------- 管理端反馈 ----------
export const getAdminFeedbackPage = (params) => request.get('/admin/feedbacks', { params })
export const replyFeedback = (data) => request.put('/admin/feedbacks/reply', data)
export const deleteAdminFeedback = (id) => request.delete(`/admin/feedbacks/${id}`)
