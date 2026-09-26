<script setup>
// 管理端-用户信息管理：分页、搜索、新增、编辑资料/角色、启禁用、重置密码、删除
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getUserPage, createUser, updateUser, setUserStatus,
  resetUserPassword, deleteUser, getRoleList
} from '../../api/user'

const query = reactive({ page: 1, size: 10, keyword: '', roleCode: '', status: null })
const list = ref([])
const total = ref(0)
const loading = ref(false)
const roles = ref([])

const dialog = ref(false)
const isEdit = ref(false)
const form = ref({})

async function load() {
  loading.value = true
  try {
    const data = await getUserPage({ ...query, status: query.status ?? undefined })
    list.value = data.records
    total.value = data.total
  } finally {
    loading.value = false
  }
}

function search() { query.page = 1; load() }

async function loadRoles() { roles.value = await getRoleList() }

function openCreate() {
  isEdit.value = false
  form.value = { username: '', password: '', nickname: '', roleCode: 'user', phone: '', email: '', gender: 0 }
  dialog.value = true
}

function openEdit(row) {
  isEdit.value = true
  form.value = { ...row }
  dialog.value = true
}

async function submit() {
  if (isEdit.value) {
    await updateUser({ id: form.value.id, nickname: form.value.nickname, phone: form.value.phone,
      email: form.value.email, gender: form.value.gender, roleCode: form.value.roleCode })
  } else {
    if (!form.value.username || !form.value.password) return ElMessage.warning('请填写账号和密码')
    await createUser(form.value)
  }
  ElMessage.success('保存成功')
  dialog.value = false
  load()
}

async function toggle(row) {
  try {
    await setUserStatus({ id: row.id, status: row.status })
    ElMessage.success(row.status === 1 ? '已启用' : '已禁用，该用户登录状态立即失效')
  } catch (e) {
    row.status = row.status === 1 ? 0 : 1
  }
}

function reset(row) {
  ElMessageBox.confirm(`确定将「${row.username}」的密码重置为 123456 吗？`, '提示', { type: 'warning' })
    .then(async () => {
      await resetUserPassword(row.id)
      ElMessage.success('已重置为 123456')
    }).catch(() => {})
}

function remove(row) {
  ElMessageBox.confirm(`删除用户「${row.username}」将同步清理其预约、帖子、评论、收藏等数据，确定？`, '警告',
    { type: 'error' }).then(async () => {
      await deleteUser(row.id)
      ElMessage.success('删除成功')
      load()
    }).catch(() => {})
}

onMounted(() => { load(); loadRoles() })
</script>

<template>
  <div>
    <div class="toolbar">
      <div class="filters">
        <el-input v-model="query.keyword" placeholder="账号/昵称" clearable style="width:180px" @keyup.enter="search" />
        <el-select v-model="query.roleCode" placeholder="角色" clearable style="width:130px">
          <el-option v-for="r in roles" :key="r.roleCode" :label="r.roleName" :value="r.roleCode" />
        </el-select>
        <el-select v-model="query.status" placeholder="状态" clearable style="width:110px">
          <el-option label="正常" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
        <el-button type="primary" :icon="'Search'" @click="search">查询</el-button>
      </div>
      <el-button type="primary" :icon="'Plus'" @click="openCreate">新增用户</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="username" label="账号" width="120" />
      <el-table-column prop="nickname" label="昵称" width="120" />
      <el-table-column label="角色" width="110">
        <template #default="{ row }">
          <el-tag :type="row.roleCode === 'admin' ? 'danger' : 'info'">{{ row.roleName || row.roleCode }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="phone" label="手机号" width="130" />
      <el-table-column prop="email" label="邮箱" min-width="160" show-overflow-tooltip />
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-switch v-model="row.status" :active-value="1" :inactive-value="0" @change="toggle(row)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="230">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="warning" @click="reset(row)">重置密码</el-button>
          <el-button size="small" type="danger" :disabled="row.username === 'admin'" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination class="pager" layout="total, prev, pager, next, sizes" :total="total"
                   v-model:current-page="query.page" v-model:page-size="query.size"
                   :page-sizes="[10, 20, 50]" @change="load" />

    <el-dialog v-model="dialog" :title="isEdit ? '编辑用户' : '新增用户'" width="520">
      <el-form label-width="80px">
        <el-form-item v-if="!isEdit" label="账号" required>
          <el-input v-model="form.username" placeholder="4~20位字母数字" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="初始密码" required>
          <el-input v-model="form.password" type="password" show-password placeholder="6~20位" />
        </el-form-item>
        <el-form-item label="昵称"><el-input v-model="form.nickname" /></el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.roleCode" style="width:100%">
            <el-option v-for="r in roles" :key="r.roleCode" :label="r.roleName + '（' + r.roleCode + '）'" :value="r.roleCode" />
          </el-select>
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="form.gender">
            <el-radio :value="0">保密</el-radio><el-radio :value="1">男</el-radio><el-radio :value="2">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="手机号"><el-input v-model="form.phone" maxlength="11" /></el-form-item>
        <el-form-item label="邮箱"><el-input v-model="form.email" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog = false">取消</el-button>
        <el-button type="primary" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.toolbar { display: flex; justify-content: space-between; margin-bottom: 14px; }
.filters { display: flex; gap: 10px; }
.pager { margin-top: 14px; justify-content: flex-end; }
</style>
