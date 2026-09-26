<script setup>
// 个人中心-个人资料：头像上传 + 资料编辑 + 修改密码
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getProfile, updateProfile, changePassword, uploadImage } from '../../../api/user'
import { useUserStore } from '../../../store/user'

const store = useUserStore()
const saving = ref(false)

const form = reactive({
  nickname: '', gender: 0, phone: '', email: '', address: '', intro: '', avatar: ''
})

async function load() {
  const u = await getProfile()
  Object.assign(form, {
    nickname: u.nickname, gender: u.gender ?? 0, phone: u.phone || '', email: u.email || '',
    address: u.address || '', intro: u.intro || '', avatar: u.avatar || ''
  })
  store.setUser(u) // 同步顶栏头像昵称
}

// 自定义上传：走 axios 带 token，成功后把返回的 URL 填进表单
async function customUpload(option) {
  const url = await uploadImage(option.file)
  form.avatar = url
  ElMessage.success('头像上传成功，记得点击保存')
}

async function save() {
  saving.value = true
  try {
    await updateProfile({ ...form })
    ElMessage.success('资料已更新')
    const u = await getProfile()
    store.setUser(u)
  } finally {
    saving.value = false
  }
}

// ----- 修改密码 -----
const pwd = reactive({ oldPassword: '', newPassword: '', confirm: '' })
const pwdSaving = ref(false)

async function savePwd() {
  if (!pwd.oldPassword) return ElMessage.warning('请输入旧密码')
  if (pwd.newPassword.length < 6) return ElMessage.warning('新密码至少6位')
  if (pwd.newPassword !== pwd.confirm) return ElMessage.warning('两次输入的新密码不一致')
  pwdSaving.value = true
  try {
    await changePassword({ oldPassword: pwd.oldPassword, newPassword: pwd.newPassword })
    ElMessage.success('密码修改成功，请牢记新密码')
    pwd.oldPassword = pwd.newPassword = pwd.confirm = ''
  } finally {
    pwdSaving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <el-card>
      <template #header>基本资料</template>
      <el-form label-width="80px" style="max-width:520px">
        <el-form-item label="头像">
          <div class="avatar-row">
            <el-avatar :size="64" :src="form.avatar || undefined">
              {{ (form.nickname || 'U')[0] }}
            </el-avatar>
            <el-upload :show-file-list="false" :http-request="customUpload" accept="image/*">
              <el-button size="small" style="margin-left:12px">更换头像</el-button>
            </el-upload>
          </div>
        </el-form-item>
        <el-form-item label="账号"><el-input :model-value="store.user?.username" disabled /></el-form-item>
        <el-form-item label="昵称"><el-input v-model="form.nickname" maxlength="20" show-word-limit /></el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="form.gender">
            <el-radio :value="0">保密</el-radio><el-radio :value="1">男</el-radio><el-radio :value="2">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="手机号"><el-input v-model="form.phone" maxlength="11" /></el-form-item>
        <el-form-item label="邮箱"><el-input v-model="form.email" /></el-form-item>
        <el-form-item label="地址"><el-input v-model="form.address" /></el-form-item>
        <el-form-item label="简介">
          <el-input v-model="form.intro" type="textarea" :rows="3" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="save">保存修改</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card style="margin-top:16px">
      <template #header>修改登录密码</template>
      <el-form label-width="80px" style="max-width:420px">
        <el-form-item label="旧密码"><el-input v-model="pwd.oldPassword" type="password" show-password /></el-form-item>
        <el-form-item label="新密码"><el-input v-model="pwd.newPassword" type="password" show-password /></el-form-item>
        <el-form-item label="确认密码"><el-input v-model="pwd.confirm" type="password" show-password /></el-form-item>
        <el-form-item>
          <el-button type="warning" :loading="pwdSaving" @click="savePwd">修改密码</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.avatar-row { display: flex; align-items: center; }
</style>
