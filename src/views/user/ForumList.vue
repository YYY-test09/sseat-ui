<script setup>
// 论坛列表：类型筛选 + 搜索 + 发帖入口
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getPostPage, POST_TYPES } from '../../api/post'

const router = useRouter()
const query = reactive({ page: 1, size: 10, keyword: '', type: '' })
const list = ref([])
const total = ref(0)
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const data = await getPostPage({ ...query, keyword: query.keyword || undefined, type: query.type || undefined })
    list.value = data.records
    total.value = data.total
  } finally { loading.value = false }
}
function search() { query.page = 1; load() }

onMounted(load)
</script>

<template>
  <div>
    <div class="filter-bar">
      <el-input v-model="query.keyword" placeholder="搜索帖子标题" clearable style="width:220px"
                :prefix-icon="'Search'" @keyup.enter="search" @clear="search" />
      <div>
        <el-radio-group v-model="query.type" @change="search">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button v-for="t in POST_TYPES" :key="t" :value="t">{{ t }}</el-radio-button>
        </el-radio-group>
        <el-button type="primary" :icon="'EditPen'" style="margin-left:12px" @click="router.push('/forum/post')">发 帖</el-button>
      </div>
    </div>

    <el-card v-loading="loading">
      <div v-for="p in list" :key="p.id" class="row" @click="router.push(`/forum/${p.id}`)">
        <el-avatar :size="40" :src="p.authorAvatar || undefined">{{ (p.authorName || '?')[0] }}</el-avatar>
        <div class="main">
          <div class="title"><el-tag size="small" effect="plain">{{ p.type }}</el-tag> {{ p.title }}</div>
          <div class="summary">{{ p.summary }}</div>
          <div class="sub-meta">{{ p.authorName }} · {{ (p.createTime || '').slice(0, 16) }}</div>
        </div>
        <div class="stats">
          <div><el-icon><View /></el-icon> {{ p.viewCount }}</div>
          <div><el-icon><Star /></el-icon> {{ p.likeCount }}</div>
        </div>
      </div>
      <el-empty v-if="!loading && !list.length" description="还没有帖子，来发第一篇吧" />
    </el-card>

    <el-pagination class="pager" layout="total, prev, pager, next" :total="total"
                   v-model:current-page="query.page" :page-size="query.size" @change="load" />
  </div>
</template>

<style scoped>
.filter-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
.row { display: flex; gap: 14px; padding: 16px 6px; border-bottom: 1px solid #f0f2f5; cursor: pointer; }
.row:hover { background: #f8fbff; }
.main { flex: 1; min-width: 0; }
.title { font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.summary { color: #909399; font-size: 13px; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sub-meta { color: #c0c4cc; font-size: 12px; margin-top: 6px; }
.stats { text-align: right; color: #909399; font-size: 13px; min-width: 70px; }
.stats div { display: flex; align-items: center; gap: 4px; justify-content: flex-end; margin-bottom: 6px; }
.pager { margin-top: 16px; justify-content: center; }
</style>
