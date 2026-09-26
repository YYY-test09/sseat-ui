import request from './request'

// 认证相关接口集中管理，页面里 import 这些函数即可
export const getCaptcha = () => request.get('/auth/captcha')
export const login = (data) => request.post('/auth/login', data)
export const smsLogin = (data) => request.post('/auth/sms-login', data)
export const register = (data) => request.post('/auth/register', data)
export const smsRegister = (data) => request.post('/auth/sms-register', data)
export const sendSms = (data) => request.post('/auth/sms/send', data)
export const forgot = (data) => request.post('/auth/forgot', data)
export const getMe = () => request.get('/auth/me')
