import request from './request'

// 管理端统计仪表盘（一次拉全部图表数据）
export const getAdminStats = () => request.get('/admin/stats')
