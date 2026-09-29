<script setup>
// 管理端-论坛管理：帖子列表(可按状态筛) + 通过/驳回(带原因) + 删除 + 查看正文弹窗
// 待审核/已驳回帖子用户端接口不可见，故"查看"走管理端专用详情接口开弹窗审核，
// 而不是跳用户端详情页（早期跳 /forum/:id 导致管理员看不到待审核内容无法审核——已修复）
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminPostPage, getAdminPostDetail, auditPost, deleteAdminPost,
         POST_STATUS_TEXT, POST_STATUS_TYPE, POST_TYPES } from '../../api/post'

const query = reactive({ page: 1, size: 10, keyword: '', type: '', status: null })
const list = ref([])
const total = ref(0)
const loading = ref(false)

const viewVisible = ref(false)
const viewLoading = ref(false)
const viewPost = ref(null)

async function load() {
  loading.value = true
  try {
    const data = await getAdminPostPage({ ...query, keyword: query.keyword || undefined,
      type: query.type || undefined, status: query.status ?? undefined })
    list.value = data.records
    total.value = data.total
  } finally { loading.value = false }
}
function search() { query.page = 1; load() }

function pass(row) {
  ElMessageBox.confirm(`审核通过帖子「${row.title}」？通过后前台可见。`, '审核', { type: 'success' }).then(async () => {
    await auditPost({ id: row.id, status: 1 }); ElMessage.success('已通过'); load()
  }).catch(() => {})
}

function reject(row) {
  ElMessageBox.prompt('请输入驳回原因（作者可见）', '驳回帖子', {
    inputPlaceholder: '如：内容与自习室无关',
    inputValidator: v => (v && v.trim()) ? true : '驳回必须填写原因'
  }).then(async ({ value }) => {
    await auditPost({ id: row.id, status: 2, rejectReason: value.trim() })
    ElMessage.success('已驳回'); load()
  }).catch(() => {})
}

function remove(row) {
  ElMessageBox.confirm(`删除帖子「${row.title}」及其全部评论？`, '警告', { type: 'warning' }).then(async () => {
    await deleteAdminPost(row.id); ElMessage.success('已删除'); load()
  }).catch(() => {})
}

// 查看/审核正文：走管理端详情接口（未过审帖子用户端接口不可见，必须用它）
async function view(row) {
  viewVisible.value = true
  viewLoading.value = true
  viewPost.value = null
  try {
    viewPost.value = await getAdminPostDetail(row.id)
  } finally { viewLoading.value = false }
}

onMounted(load)
</script>

<template>
  <div>
    <div class="toolbar">
      <div class="filters">
        <el-input v-model="query.keyword" placeholder="标题关键词" clearable style="width:180px" @keyup.enter="search" @clear="search" />
        <el-select v-model="query.type" placeholder="类型" clearable style="width:120px">
          <el-option v-for="t in POST_TYPES" :key="t" :label="t" :value="t" />
        </el-select>
        <el-select v-model="query.status" placeholder="状态" clearable style="width:110px">
          <el-option v-for="(s, k) in POST_STATUS_TEXT" :key="k" :label="s" :value="Number(k)" />
        </el-select>
        <el-button type="primary" :icon="'Search'" @click="search">查询</el-button>
      </div>
      <el-badge :value="list.filter(p => p.status === 0).length" :hidden="!list.some(p => p.status === 0)">
        <span style="font-size:13px;color:#909399">当前页待审核数</span>
      </el-badge>
    </div>

    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="55" />
      <el-table-column prop="title" label="标题" min-width="160" show-overflow-tooltip />
      <el-table-column prop="type" label="类型" width="80" />
      <el-table-column prop="authorName" label="作者" width="100" />
      <el-table-column prop="createTime" label="发布时间" width="160" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="POST_STATUS_TYPE[row.status]">{{ POST_STATUS_TEXT[row.status] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="rejectReason" label="驳回原因" min-width="110">
        <template #default="{ row }"><span :class="{ gray: !row.rejectReason }">{{ row.rejectReason || '—' }}</span></template>
      </el-table-column>
      <el-table-column label="操作" width="250">
        <template #default="{ row }">
          <el-button v-if="row.status !== 1" size="small" type="success" link @click="pass(row)">通过</el-button>
          <el-button v-if="row.status !== 2" size="small" type="warning" link @click="reject(row)">驳回</el-button>
          <el-button size="small" link type="primary" @click="view(row)">查看</el-button>
          <el-button v-if="row.status === 1" size="small" link type="info" @click="$router.push(`/forum/${row.id}`)">前台页</el-button>
          <el-button size="small" link type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination class="pager" layout="total, prev, pager, next" :total="total"
                   v-model:current-page="query.page" :page-size="query.size" @change="load" />

    <!-- 审核弹窗：未过审内容仅管理端接口可见，直接在此读正文并裁决 -->
    <el-dialog v-model="viewVisible" title="帖子内容与审核" width="640px" top="6vh">
      <div v-loading="viewLoading" style="min-height:120px">
        <template v-if="viewPost">
          <div class="vd-head">
            <span class="vd-title">{{ viewPost.title }}</span>
            <el-tag :type="POST_STATUS_TYPE[viewPost.status]">{{ POST_STATUS_TEXT[viewPost.status] }}</el-tag>
          </div>
          <div class="vd-meta">
            {{ viewPost.authorName }} · {{ viewPost.type }} · {{ viewPost.createTime }} ·
            浏览 {{ viewPost.viewCount }}
          </div>
          <el-image v-if="viewPost.coverImg" :src="viewPost.coverImg" class="vd-cover" fit="cover" />
          <div class="vd-content">{{ viewPost.content }}</div>
          <el-alert v-if="viewPost.rejectReason" type="error" :closable="false" show-icon
                    :title="'当前驳回原因：' + viewPost.rejectReason" style="margin-top:10px" />
        </template>
      </div>
      <template #footer>
        <el-button v-if="viewPost && viewPost.status !== 1" type="success"
                   @click="pass(viewPost); viewVisible = false">通过</el-button>
        <el-button v-if="viewPost && viewPost.status !== 2" type="warning"
                   @click="reject(viewPost); viewVisible = false">驳回</el-button>
        <el-button @click="viewVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.filters { display: flex; gap: 10px; }
.gray { color: #c0c4cc; }
.pager { margin-top: 14px; justify-content: flex-end; }
.vd-head { display: flex; align-items: center; gap: 10px; }
.vd-title { font-size: 16px; font-weight: 600; }
.vd-meta { color: #909399; font-size: 12px; margin-top: 6px; }
.vd-cover { width: 100%; max-height: 200px; border-radius: 6px; margin: 10px 0; }
.vd-content { margin-top: 10px; max-height: 320px; overflow-y: auto; white-space: pre-wrap;
  background: #f7f9fc; border-radius: 6px; padding: 12px; font-size: 14px; line-height: 1.7; }
</style>
