<script setup>
// 管理员登录页：登录成功后必须校验角色为 admin（需求：普通用户无法登录后台）
// 注意这只是界面层的第一道拦截，后端 /api/admin/** 还有第二道强制校验，双保险
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCaptcha, login } from '../../api/auth'
import { useUserStore } from '../../store/user'

const router = useRouter()
const store = useUserStore()
const loading = ref(false)
const form = reactive({ username: '', password: '', captchaKey: '', captchaCode: '' })
const captchaImg = ref('')

async function refreshCaptcha() {
  const data = await getCaptcha()
  form.captchaKey = data.captchaKey
  form.captchaCode = ''
  captchaImg.value = data.imgBase64
}

async function doLogin() {
  if (!form.username || !form.password || !form.captchaCode) {
    return ElMessage.warning('请填写完整的登录信息')
  }
  loading.value = true
  try {
    const res = await login({ ...form })
    if (res.user.roleCode !== 'admin') {
      ElMessage.error('该账号不是管理员，无法登录后台')
      refreshCaptcha()
      return
    }
    store.setLogin(res.token, res.user)
    ElMessage.success('欢迎回来，管理员')
    router.push('/admin')
  } catch (e) {
    refreshCaptcha()
  } finally {
    loading.value = false
  }
}

onMounted(refreshCaptcha)
</script>

<template>
  <div class="admin-bg">
    <el-card class="login-card">
      <div class="brand">🛠 简座 · 管理后台</div>
      <el-form @submit.prevent="doLogin">
        <el-form-item>
          <el-input v-model="form.username" placeholder="管理员账号" size="large" :prefix-icon="'User'" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" show-password placeholder="密码" size="large"
                    :prefix-icon="'Lock'" @keyup.enter="doLogin" />
        </el-form-item>
        <el-form-item>
          <div class="captcha-row">
            <el-input v-model="form.captchaCode" placeholder="图形验证码" size="large" style="flex:1" @keyup.enter="doLogin" />
            <img v-if="captchaImg" :src="captchaImg" class="captcha-img" @click="refreshCaptcha" title="点击刷新" />
          </div>
        </el-form-item>
        <el-button type="danger" size="large" class="submit-btn" :loading="loading" @click="doLogin">登 录 后 台</el-button>
      </el-form>
      <div class="links"><router-link to="/login">← 返回用户登录</router-link></div>
    </el-card>
  </div>
</template>

<style scoped>
.admin-bg { height: 100vh; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #1f2d3d 0%, #3a4f68 100%); }
.login-card { width: 400px; padding: 8px 12px 16px; border-radius: 12px; }
.brand { text-align: center; font-size: 18px; font-weight: 700; color: #303133; margin-bottom: 16px; }
.captcha-row { display: flex; gap: 10px; width: 100%; }
.captcha-img { height: 40px; border-radius: 4px; cursor: pointer; border: 1px solid #dcdfe6; }
.submit-btn { width: 100%; letter-spacing: 2px; }
.links { text-align: center; margin-top: 14px; font-size: 13px; }
.links a { color: #909399; text-decoration: none; }
</style>
