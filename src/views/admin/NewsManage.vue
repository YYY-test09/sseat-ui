<script setup>
// 管理端-资讯信息管理：列表 + 新增/编辑弹窗（类型/标题/作者/简介/正文/封面）+ 删除
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminNewsPage, getAdminNewsDetail, saveAdminNews, deleteAdminNews } from '../../api/news'
import { uploadImage } from '../../api/user'

const query = reactive({ page: 1, size: 10, keyword: '', type: '' })
const list = ref([])
const total = ref(0)
const loading = ref(false)
const TYPES = ['系统公告', '功能更新', '学习资源', '活动通知']

const dialog = ref(false)
const form = ref({})
const uploading = ref(false)

async function load() {
  loading.value = true
  try {
    const data = await getAdminNewsPage({ ...query, keyword: query.keyword || undefined, type: query.type || undefined })
    list.value = data.records
    total.value = data.total
  } finally { loading.value = false }
}
function search() { query.page = 1; load() }

function openCreate() {
  form.value = { title: '', type: '系统公告', author: '', summary: '', content: '', coverImg: '' }
  dialog.value = true
}
async function openEdit(row) {
  form.value = await getAdminNewsDetail(row.id)
  dialog.value = true
}

async function customUpload(option) {
  uploading.value = true
  try { form.value.coverImg = await uploadImage(option.file) }
  finally { uploading.value = false }
}

async function submit() {
  if (!form.value.title) return ElMessage.warning('请输入标题')
  if (!form.value.content) return ElMessage.warning('请输入正文内容')
  await saveAdminNews(form.value)
  ElMessage.success('保存成功')
  dialog.value = false
  load()
}

function remove(row) {
  ElMessageBox.confirm(`确定删除资讯「${row.title}」吗？`, '警告', { type: 'warning' }).then(async () => {
    await deleteAdminNews(row.id); ElMessage.success('删除成功'); load()
  }).catch(() => {})
}

onMounted(load)
</script>

<template>
  <div>
    <div class="toolbar">
      <div class="filters">
        <el-input v-model="query.keyword" placeholder="标题关键词" clearable style="width:180px" @keyup.enter="search" @clear="search" />
        <el-select v-model="query.type" placeholder="类型" clearable style="width:140px">
          <el-option v-for="t in TYPES" :key="t" :label="t" :value="t" />
        </el-select>
        <el-button type="primary" :icon="'Search'" @click="search">查询</el-button>
      </div>
      <el-button type="primary" :icon="'Plus'" @click="openCreate">发布资讯</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="55" />
      <el-table-column label="封面" width="80">
        <template #default="{ row }">
          <el-image v-if="row.coverImg" :src="row.coverImg" style="width:56px;height:36px;border-radius:4px" fit="cover" />
          <span v-else class="gray">无</span>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
      <el-table-column prop="type" label="类型" width="110">
        <template #default="{ row }"><el-tag size="small">{{ row.type }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="author" label="作者" width="100" />
      <el-table-column prop="viewCount" label="浏览" width="70" />
      <el-table-column prop="createTime" label="发布时间" width="160" />
      <el-table-column label="操作" width="130">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination class="pager" layout="total, prev, pager, next" :total="total"
                   v-model:current-page="query.page" :page-size="query.size" @change="load" />

    <el-dialog v-model="dialog" :title="form.id ? '编辑资讯' : '发布资讯'" width="640" top="6vh">
      <el-form label-width="80px">
        <el-form-item label="类型" required>
          <el-select v-model="form.type" style="width:200px">
            <el-option v-for="t in TYPES" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" required>
          <el-input v-model="form.title" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="作者"><el-input v-model="form.author" placeholder="默认管理员" style="width:200px" /></el-form-item>
        <el-form-item label="简介">
          <el-input v-model="form.summary" type="textarea" :rows="2" maxlength="120" show-word-limit />
        </el-form-item>
        <el-form-item label="封面图">
          <div class="cover-row">
            <el-upload :show-file-list="false" :http-request="customUpload" accept="image/*">
              <el-button :loading="uploading" :icon="'Upload'">上传封面</el-button>
            </el-upload>
            <el-image v-if="form.coverImg" :src="form.coverImg" style="width:120px;height:70px;margin-left:12px;border-radius:6px" fit="cover" />
          </div>
        </el-form-item>
        <el-form-item label="正文" required>
          <el-input v-model="form.content" type="textarea" :rows="8" placeholder="支持换行的纯文本内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog = false">取消</el-button>
        <el-button type="primary" @click="submit">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.toolbar { display: flex; justify-content: space-between; margin-bottom: 14px; }
.filters { display: flex; gap: 10px; }
.pager { margin-top: 14px; justify-content: flex-end; }
.gray { color: #c0c4cc; }
.cover-row { display: flex; align-items: center; }
</style>
