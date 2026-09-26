<script setup>
// 注册页：账号密码注册（图形码） / 手机号注册（短信码） / 找回密码
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCaptcha, register, smsRegister, sendSms, forgot } from '../api/auth'

const router = useRouter()
const tab = ref('account')
const loading = ref(false)

// ----- 账号注册 -----
const form = reactive({ username: '', password: '', confirm: '', nickname: '', captchaKey: '', captchaCode: '' })
const captchaImg = ref('')

async function refreshCaptcha() {
  const data = await getCaptcha()
  form.captchaKey = data.captchaKey
  form.captchaCode = ''
  captchaImg.value = data.imgBase64
}

async function doRegister() {
  if (!form.username || form.username.length < 4) return ElMessage.warning('账号至少 4 位')
  if (!form.password || form.password.length < 6) return ElMessage.warning('密码至少 6 位')
  if (form.password !== form.confirm) return ElMessage.warning('两次输入的密码不一致')
  if (!form.captchaCode) return ElMessage.warning('请输入图形验证码')
  loading.value = true
  try {
    await register({ username: form.username, password: form.password, nickname: form.nickname,
                     captchaKey: form.captchaKey, captchaCode: form.captchaCode })
    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } catch (e) {
    refreshCaptcha()
  } finally {
    loading.value = false
  }
}

// ----- 手机号注册 -----
const smsForm = reactive({ phone: '', smsCode: '', username: '', password: '' })
const countdown = ref(0)
let timer = null

async function doSendSms() {
  if (!/^1\d{10}$/.test(smsForm.phone)) return ElMessage.warning('请输入正确的手机号')
  await sendSms({ phone: smsForm.phone })
  ElMessage.success('模拟短信已发送，验证码：8888')
  countdown.value = 60
  timer = setInterval(() => { if (--countdown.value <= 0) clearInterval(timer) }, 1000)
}

async function doSmsRegister() {
  if (!/^1\d{10}$/.test(smsForm.phone) || !smsForm.smsCode) return ElMessage.warning('请填写手机号和短信验证码')
  if (smsForm.username.length < 4 || smsForm.password.length < 6) return ElMessage.warning('账号至少4位，密码至少6位')
  loading.value = true
  try {
    await smsRegister({ ...smsForm })
    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } finally {
    loading.value = false
  }
}

// ----- 找回密码 -----
const fpForm = reactive({ phone: '', smsCode: '', newPassword: '' })

async function doForgot() {
  if (!fpForm.phone || !fpForm.smsCode || fpForm.newPassword.length < 6) {
    return ElMessage.warning('请完整填写（密码至少6位）')
  }
  loading.value = true
  try {
    await forgot({ ...fpForm })
    ElMessage.success('密码已重置，请用新密码登录')
    router.push('/login')
  } finally {
    loading.value = false
  }
}

onMounted(refreshCaptcha)
</script>

<template>
  <div class="login-bg">
    <el-card class="login-card">
      <div class="brand">📚 注册新账号</div>
      <el-tabs v-model="tab" stretch>
        <el-tab-pane label="账号注册" name="account">
          <el-form @submit.prevent="doRegister">
            <el-form-item><el-input v-model="form.username" placeholder="账号（字母数字下划线，4~20位）" size="large" /></el-form-item>
            <el-form-item><el-input v-model="form.nickname" placeholder="昵称（可不填）" size="large" /></el-form-item>
            <el-form-item><el-input v-model="form.password" type="password" show-password placeholder="密码（6~20位）" size="large" /></el-form-item>
            <el-form-item><el-input v-model="form.confirm" type="password" show-password placeholder="确认密码" size="large" /></el-form-item>
            <el-form-item>
              <div class="captcha-row">
                <el-input v-model="form.captchaCode" placeholder="图形验证码" size="large" style="flex:1" />
                <img v-if="captchaImg" :src="captchaImg" class="captcha-img" @click="refreshCaptcha" title="点击刷新" />
              </div>
            </el-form-item>
            <el-button type="primary" size="large" class="submit-btn" :loading="loading" @click="doRegister">注 册</el-button>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="手机号注册" name="sms">
          <el-form @submit.prevent="doSmsRegister">
            <el-form-item><el-input v-model="smsForm.phone" placeholder="手机号" size="large" /></el-form-item>
            <el-form-item>
              <div class="captcha-row">
                <el-input v-model="smsForm.smsCode" placeholder="短信验证码" size="large" style="flex:1" />
                <el-button size="large" :disabled="countdown > 0" @click="doSendSms">
                  {{ countdown > 0 ? countdown + 's' : '获取验证码' }}
                </el-button>
              </div>
            </el-form-item>
            <el-form-item><el-input v-model="smsForm.username" placeholder="设置账号" size="large" /></el-form-item>
            <el-form-item><el-input v-model="smsForm.password" type="password" show-password placeholder="设置密码（6~20位）" size="large" /></el-form-item>
            <el-button type="primary" size="large" class="submit-btn" :loading="loading" @click="doSmsRegister">注 册</el-button>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="找回密码" name="forgot">
          <el-form @submit.prevent="doForgot">
            <el-form-item><el-input v-model="fpForm.phone" placeholder="注册时绑定的手机号" size="large" /></el-form-item>
            <el-form-item><el-input v-model="fpForm.smsCode" placeholder="短信验证码（模拟：8888）" size="large" /></el-form-item>
            <el-form-item><el-input v-model="fpForm.newPassword" type="password" show-password placeholder="新密码（6~20位）" size="large" /></el-form-item>
            <el-button type="warning" size="large" class="submit-btn" :loading="loading" @click="doForgot">重置密码</el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <div class="links">
        <router-link to="/login">已有账号？去登录</router-link>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.login-bg { height: 100vh; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.login-card { width: 460px; padding: 8px 12px 16px; border-radius: 12px; }
.brand { text-align: center; font-size: 18px; font-weight: 700; color: #409eff; margin-bottom: 12px; }
.captcha-row { display: flex; gap: 10px; width: 100%; }
.captcha-img { height: 40px; border-radius: 4px; cursor: pointer; border: 1px solid #dcdfe6; }
.submit-btn { width: 100%; }
.links { text-align: center; margin-top: 14px; font-size: 13px; }
.links a { color: #409eff; text-decoration: none; }
</style>
