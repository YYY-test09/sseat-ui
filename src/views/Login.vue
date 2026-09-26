<script setup>
// 用户端登录页：账号密码 / 手机短信 两种方式
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCaptcha, login, smsLogin, sendSms } from '../api/auth'
import { useUserStore } from '../store/user'

const router = useRouter()
const store = useUserStore()
const tab = ref('account')
const loading = ref(false)

// ----- 账号密码表单 -----
const form = reactive({ username: '', password: '', captchaKey: '', captchaCode: '' })
const captchaImg = ref('')

async function refreshCaptcha() {
  const data = await getCaptcha()
  form.captchaKey = data.captchaKey
  form.captchaCode = ''
  captchaImg.value = data.imgBase64 // 后端返回 base64 图片，直接塞进 <img :src>
}

async function doLogin() {
  if (!form.username || !form.password) return ElMessage.warning('请输入账号和密码')
  if (!form.captchaCode) return ElMessage.warning('请输入图形验证码')
  loading.value = true
  try {
    const res = await login({ ...form })
    store.setLogin(res.token, res.user)
    ElMessage.success('登录成功')
    router.push('/')
  } catch (e) {
    refreshCaptcha() // 验证码一次性的，失败后必须换一张
  } finally {
    loading.value = false
  }
}

// ----- 短信登录表单 -----
const smsForm = reactive({ phone: '', smsCode: '' })
const countdown = ref(0)
let timer = null

async function doSendSms() {
  if (!/^1\d{10}$/.test(smsForm.phone)) return ElMessage.warning('请输入正确的手机号')
  await sendSms({ phone: smsForm.phone })
  ElMessage.success('模拟短信已发送，验证码：8888')
  countdown.value = 60
  timer = setInterval(() => { if (--countdown.value <= 0) clearInterval(timer) }, 1000)
}

async function doSmsLogin() {
  if (!smsForm.phone || !smsForm.smsCode) return ElMessage.warning('请输入手机号和验证码')
  loading.value = true
  try {
    const res = await smsLogin({ ...smsForm })
    store.setLogin(res.token, res.user)
    ElMessage.success('登录成功')
    router.push('/')
  } finally {
    loading.value = false
  }
}

onMounted(refreshCaptcha)
</script>

<template>
  <div class="login-bg">
    <el-card class="login-card">
      <div class="brand">📚 校园自习室预约与管理系统</div>
      <el-tabs v-model="tab" stretch>
        <el-tab-pane label="账号密码登录" name="account">
          <el-form @submit.prevent="doLogin">
            <el-form-item>
              <el-input v-model="form.username" placeholder="账号" size="large" :prefix-icon="'User'" />
            </el-form-item>
            <el-form-item>
              <el-input v-model="form.password" type="password" show-password placeholder="密码"
                        size="large" :prefix-icon="'Lock'" @keyup.enter="doLogin" />
            </el-form-item>
            <el-form-item>
              <div class="captcha-row">
                <el-input v-model="form.captchaCode" placeholder="图形验证码" size="large"
                          style="flex:1" @keyup.enter="doLogin" />
                <img v-if="captchaImg" :src="captchaImg" class="captcha-img" @click="refreshCaptcha"
                     title="看不清？点击刷新" />
              </div>
            </el-form-item>
            <el-button type="primary" size="large" class="submit-btn" :loading="loading" @click="doLogin">登 录</el-button>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="手机短信登录" name="sms">
          <el-form @submit.prevent="doSmsLogin">
            <el-form-item>
              <el-input v-model="smsForm.phone" placeholder="手机号" size="large" :prefix-icon="'Iphone'" />
            </el-form-item>
            <el-form-item>
              <div class="captcha-row">
                <el-input v-model="smsForm.smsCode" placeholder="短信验证码" size="large" style="flex:1"
                          @keyup.enter="doSmsLogin" />
                <el-button size="large" :disabled="countdown > 0" @click="doSendSms">
                  {{ countdown > 0 ? countdown + 's' : '获取验证码' }}
                </el-button>
              </div>
            </el-form-item>
            <el-button type="primary" size="large" class="submit-btn" :loading="loading" @click="doSmsLogin">登 录</el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <div class="links">
        <router-link to="/register">没有账号？去注册</router-link>
        <router-link to="/admin/login">管理员入口</router-link>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.login-bg { height: 100vh; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.login-card { width: 420px; padding: 8px 12px 16px; border-radius: 12px; }
.brand { text-align: center; font-size: 18px; font-weight: 700; color: #409eff; margin-bottom: 12px; }
.captcha-row { display: flex; gap: 10px; width: 100%; }
.captcha-img { height: 40px; border-radius: 4px; cursor: pointer; border: 1px solid #dcdfe6; }
.submit-btn { width: 100%; }
.links { display: flex; justify-content: space-between; margin-top: 14px; font-size: 13px; }
.links a { color: #409eff; text-decoration: none; }
</style>
