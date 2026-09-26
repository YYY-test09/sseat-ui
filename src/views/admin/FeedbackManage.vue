<script setup>
// 管理端-反馈管理：列表(待回复优先) + 回复 + 删除
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminFeedbackPage, replyFeedback, deleteAdminFeedback } from '../../api/feedback'

const query = reactive({ page: 1, size: 10, status: null, keyword: '' })
const list = ref([])
const total = ref(0)
const loading = ref(false)

const dialog = ref(false)
const current = ref({})
const replyText = ref('')

async function load() {
  loading.value = true
  try {
    const data = await getAdminFeedbackPage({ ...query, status: query.status ?? undefined, keyword: query.keyword || undefined })
    list.value = data.records
    total.value = data.total
  } finally { loading.value = false }
}
function search() { query.page = 1; load() }

function openReply(row) {
  current.value = row
  replyText.value = row.reply || ''
  dialog.value = true
}

async function submitReply() {
  if (!replyText.value.trim()) return ElMessage.warning('请输入回复内容')
  await replyFeedback({ id: current.value.id, reply: replyText.value.trim() })
  ElMessage.success('回复成功，用户端已可见')
  dialog.value = false
  load()
}

function remove(row) {
  ElMessageBox.confirm('确定删除该反馈吗？', '警告', { type: 'warning' }).then(async () => {
    await deleteAdminFeedback(row.id); ElMessage.success('已删除'); load()
  }).catch(() => {})
}

onMounted(load)
</script>

<template>
  <div>
    <div class="toolbar">
      <div class="filters">
        <el-input v-model="query.keyword" placeholder="反馈内容关键词" clearable style="width:200px" @keyup.enter="search" @clear="search" />
        <el-select v-model="query.status" placeholder="状态" clearable style="width:120px" @change="search">
          <el-option label="待回复" :value="0" />
          <el-option label="已回复" :value="1" />
        </el-select>
        <el-button type="primary" :icon="'Search'" @click="search">查询</el-button>
      </div>
    </div>

    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="55" />
      <el-table-column prop="userLabel" label="提交人" width="170" show-overflow-tooltip />
      <el-table-column prop="content" label="反馈内容" min-width="240" show-overflow-tooltip />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'warning'">{{ row.status === 1 ? '已回复' : '待回复' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="提交时间" width="160" />
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button size="small" :type="row.status === 0 ? 'primary' : ''" @click="openReply(row)">
            {{ row.status === 0 ? '回 复' : '查看回复' }}
          </el-button>
          <el-button size="small" type="danger" link @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination class="pager" layout="total, prev, pager, next" :total="total"
                   v-model:current-page="query.page" :page-size="query.size" @change="load" />

    <el-dialog v-model="dialog" title="回复反馈" width="520">
      <div class="origin">
        <b>{{ current.userLabel }}</b> 于 {{ current.createTime }} 反馈：
        <p>{{ current.content }}</p>
      </div>
      <el-input v-model="replyText" type="textarea" :rows="4" maxlength="1000" show-word-limit
                placeholder="输入回复内容，提交后用户可在【我的反馈】中查看" />
      <template #footer>
        <el-button @click="dialog = false">取消</el-button>
        <el-button type="primary" @click="submitReply">提交回复</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.toolbar { display: flex; justify-content: space-between; margin-bottom: 14px; }
.filters { display: flex; gap: 10px; }
.pager { margin-top: 14px; justify-content: flex-end; }
.origin { background: #f5f7fa; border-radius: 6px; padding: 10px 14px; margin-bottom: 12px; font-size: 13px; }
.origin p { margin-top: 6px; color: #606266; white-space: pre-wrap; }
</style>
