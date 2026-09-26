<script setup>
// 资讯详情：标题、作者、时间、封面、正文
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getNewsDetail } from '../../api/news'

const route = useRoute()
const news = ref(null)
const loading = ref(true)

onMounted(async () => {
  try { news.value = await getNewsDetail(route.params.id) }
  finally { loading.value = false }
})
</script>

<template>
  <el-card v-loading="loading">
    <template v-if="news">
      <h1 class="title">{{ news.title }}</h1>
      <div class="meta">
        <el-tag size="small">{{ news.type }}</el-tag>
        <span>作者：{{ news.author }}</span>
        <span>{{ news.createTime }}</span>
        <span><el-icon><View /></el-icon> {{ news.viewCount }} 次浏览</span>
      </div>
      <el-divider />
      <img v-if="news.coverImg" :src="news.coverImg" class="cover" />
      <div class="content">{{ news.content }}</div>
    </template>
    <el-button link style="margin-top:16px" @click="$router.back()">← 返回列表</el-button>
  </el-card>
</template>

<style scoped>
.title { font-size: 22px; margin-bottom: 12px; }
.meta { display: flex; align-items: center; gap: 16px; color: #909399; font-size: 13px; }
.cover { width: 100%; max-height: 360px; object-fit: cover; border-radius: 8px; margin-bottom: 16px; }
.content { white-space: pre-wrap; line-height: 1.9; font-size: 15px; color: #303133; }
</style>
