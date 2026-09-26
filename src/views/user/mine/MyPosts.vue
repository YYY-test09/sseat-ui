<script setup>
// 个人中心-我的帖子：全部状态 + 驳回原因 + 删除 + 跳转编辑(再次进入待审)
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMyPosts, deleteMyPost, POST_STATUS_TEXT, POST_STATUS_TYPE } from '../../../api/post'

const router = useRouter()
const query = reactive({ page: 1, size: 10 })
const list = ref([])
const total = ref(0)
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const data = await getMyPosts(query)
    list.value = data.records
    total.value = data.total
  } finally { loading.value = false }
}

function remove(row) {
  ElMessageBox.confirm(`确定删除帖子「${row.title}」吗？评论会一并删除。`, '提示', { type: 'warning' }).then(async () => {
    await deleteMyPost(row.id); ElMessage.success('已删除'); load()
  }).catch(() => {})
}

onMounted(load)
</script>

<template>
  <el-card v-loading="loading">
    <template #header><b>我的帖子</b></template>
    <el-table :data="list" border>
      <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
      <el-table-column prop="type" label="类型" width="80" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }"><el-tag :type="POST_STATUS_TYPE[row.status]">{{ POST_STATUS_TEXT[row.status] }}</el-tag></template>
      </el-table-column>
      <el-table-column label="驳回原因" min-width="120">
        <template #default="{ row }"><span :class="{ gray: !row.rejectReason }">{{ row.rejectReason || '—' }}</span></template>
      </el-table-column>
      <el-table-column prop="viewCount" label="浏览" width="70" />
      <el-table-column prop="likeCount" label="点赞" width="70" />
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button size="small" link type="primary" @click="router.push(`/forum/${row.id}`)">查看</el-button>
          <el-button size="small" link @click="router.push({ path: '/forum/post', query: { editId: row.id } })">编辑</el-button>
          <el-button size="small" link type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
      <template #empty><el-empty description="还没有发过帖子" /></template>
    </el-table>
    <el-pagination class="pager" layout="total, prev, pager, next" :total="total"
                   v-model:current-page="query.page" :page-size="query.size" @change="load" />
  </el-card>
</template>

<style scoped>
.gray { color: #c0c4cc; }
.pager { margin-top: 14px; justify-content: flex-end; }
</style>
