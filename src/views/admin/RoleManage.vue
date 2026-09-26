<script setup>
// 管理端-角色管理：列表 + 新增/编辑弹窗 + 启用禁用 + 删除（内置角色受保护）
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getRoleList, saveRole, setRoleStatus, deleteRole } from '../../api/user'

const list = ref([])
const loading = ref(false)
const dialog = ref(false)
const form = ref({})
const isEdit = ref(false)

// 后台菜单全集：勾选哪些，该角色的用户登录后就能看到哪些菜单
const MENU_OPTIONS = [
  { key: 'dashboard', label: '数据统计' },
  { key: 'room', label: '自习室座位管理' },
  { key: 'reservation', label: '预约管理' },
  { key: 'post', label: '论坛管理' },
  { key: 'feedback', label: '反馈管理' },
  { key: 'news', label: '资讯信息管理' },
  { key: 'role', label: '角色管理' },
  { key: 'user', label: '用户信息管理' }
]
const checkedMenus = ref([])

async function load() {
  loading.value = true
  try { list.value = await getRoleList() } finally { loading.value = false }
}

function openCreate() {
  isEdit.value = false
  form.value = { roleName: '', roleCode: '', remark: '' }
  checkedMenus.value = []
  dialog.value = true
}

function openEdit(row) {
  isEdit.value = true
  form.value = { ...row }
  checkedMenus.value = (row.menus || '').split(',').filter(Boolean)
  dialog.value = true
}

async function submit() {
  if (!form.value.roleName) return ElMessage.warning('请输入角色名称')
  await saveRole({ ...form.value, menus: checkedMenus.value.join(',') })
  ElMessage.success('保存成功')
  dialog.value = false
  load()
}

async function toggle(row) {
  try {
    await setRoleStatus({ id: row.id, status: row.status })
    ElMessage.success(row.status === 1 ? '已启用' : '已禁用')
  } catch (e) {
    row.status = row.status === 1 ? 0 : 1 // 失败回滚开关状态
  }
}

function remove(row) {
  ElMessageBox.confirm(`确定删除角色「${row.roleName}」吗？`, '警告', { type: 'warning' }).then(async () => {
    await deleteRole(row.id)
    ElMessage.success('删除成功')
    load()
  }).catch(() => {})
}

onMounted(load)
</script>

<template>
  <div>
    <div class="toolbar">
      <span class="hint">内置的超级管理员/普通用户角色不可删除；菜单权限决定该角色登录后后台左侧显示哪些功能</span>
      <el-button type="primary" :icon="'Plus'" @click="openCreate">新增角色</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="roleName" label="角色名称" width="140" />
      <el-table-column prop="roleCode" label="角色编码" width="120">
        <template #default="{ row }"><el-tag>{{ row.roleCode }}</el-tag></template>
      </el-table-column>
      <el-table-column label="后台菜单权限">
        <template #default="{ row }">
          <el-tag v-for="k in (row.menus || '').split(',').filter(Boolean)" :key="k" size="small"
                  style="margin-right:4px">{{ MENU_OPTIONS.find(m => m.key === k)?.label || k }}</el-tag>
          <span v-if="!row.menus" class="gray">无（前台角色）</span>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-switch v-model="row.status" :active-value="1" :inactive-value="0" @change="toggle(row)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" :disabled="['admin','user'].includes(row.roleCode)"
                     @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialog" :title="isEdit ? '编辑角色' : '新增角色'" width="560">
      <el-form label-width="90px">
        <el-form-item label="角色名称" required>
          <el-input v-model="form.roleName" placeholder="如：审核员" maxlength="20" />
        </el-form-item>
        <el-form-item label="角色编码" required>
          <el-input v-model="form.roleCode" :disabled="isEdit && ['admin','user'].includes(form.roleCode)"
                    placeholder="如：auditor（英文，唯一）" />
        </el-form-item>
        <el-form-item label="菜单权限">
          <el-checkbox-group v-model="checkedMenus">
            <el-checkbox v-for="m in MENU_OPTIONS" :key="m.key" :value="m.key" :label="m.key">{{ m.label }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" maxlength="100" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog = false">取消</el-button>
        <el-button type="primary" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.hint { font-size: 12px; color: #909399; }
.gray { color: #c0c4cc; font-size: 12px; }
</style>
