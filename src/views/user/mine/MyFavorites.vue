<script setup>
// 个人中心-我的收藏：只保留帖子收藏（自习室收藏入口已按需求移除）
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMyFavorites, removeFavorite } from '../../../api/room'

const router = useRouter()
const posts = ref([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const data = await getMyFavorites()
    posts.value = data.filter(f => f.targetType === 'post' && f.post)
  } finally {
    loading.value = false
  }
}

function cancel(id) {
  ElMessageBox.confirm('确定取消收藏吗？', '提示', { type: 'warning' }).then(async () => {
    await removeFavorite('post', id)
    ElMessage.success('已取消收藏')
    load()
  }).catch(() => {})
}

onMounted(load)
</script>

<template>
  <el-card v-loading="loading">
    <template #header>我的收藏</template>
    <el-empty v-if="!loading && !posts.length" description="还没有收藏帖子" />
    <div v-for="f in posts" :key="f.targetId" class="item">
      <div class="info">
        <div class="name clickable" @click="router.push(`/forum/${f.post.id}`)">{{ f.post.title }}</div>
        <div class="sub">
          {{ f.post.type }}
          <el-tag size="small" :type="f.post.status === 1 ? 'success' : 'info'">
            {{ f.post.status === 1 ? '已通过' : f.post.status === 0 ? '待审核' : '已驳回' }}
          </el-tag>
        </div>
      </div>
      <el-button size="small" @click="cancel(f.post.id)">取消收藏</el-button>
    </div>
  </el-card>
</template>

<style scoped>
.item { display: flex; align-items: center; padding: 12px 4px; border-bottom: 1px solid #f0f2f5; }
.info { flex: 1; min-width: 0; }
.name { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.clickable { cursor: pointer; }
.clickable:hover { color: #409eff; }
.sub { color: #909399; font-size: 12px; margin-top: 4px; display: flex; gap: 6px; align-items: center; }
</style>
