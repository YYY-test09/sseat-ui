import request from './request'

// ---------- 前台论坛（浏览免登录） ----------
export const getPostPage = (params) => request.get('/posts', { params })
export const getPostDetail = (id) => request.get(`/posts/${id}`)
export const addComment = (id, content) => request.post(`/posts/${id}/comments`, { content })
export const deleteComment = (commentId) => request.delete(`/posts/comments/${commentId}`)
export const togglePostLike = (id) => request.post(`/posts/${id}/like`)
export const togglePostFavorite = (id) => request.post(`/posts/${id}/favorite`)

// ---------- 我的帖子 ----------
export const getMyPosts = (params) => request.get('/user/posts/mine', { params })
export const publishPost = (data) => request.post('/user/posts', data)
export const updateMyPost = (data) => request.put('/user/posts', data)
export const deleteMyPost = (id) => request.delete(`/user/posts/${id}`)

// ---------- 管理端论坛 ----------
export const getAdminPostPage = (params) => request.get('/admin/posts', { params })
export const auditPost = (data) => request.put('/admin/posts/audit', data)
export const deleteAdminPost = (id) => request.delete(`/admin/posts/${id}`)

export const POST_TYPES = ['求助', '讨论', '分享', '失物', '活动']
export const POST_STATUS_TEXT = { 0: '待审核', 1: '已通过', 2: '已驳回' }
export const POST_STATUS_TYPE = { 0: 'warning', 1: 'success', 2: 'danger' }
