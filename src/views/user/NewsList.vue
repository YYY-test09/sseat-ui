<script setup>
// 前台资讯列表：按类型筛选 + 关键词搜索，点击进详情
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getNewsPage } from '../../api/news'

const router = useRouter()
const query = reactive({ page: 1, size: 10, keyword: '', type: '' })
const list = ref([])
const total = ref(0)
const loading = ref(false)
const TYPES = ['系统公告', '功能更新', '学习资源', '活动通知']

async function load() {
  loading.value = true
  try {
    const data = await getNewsPage({ ...query, keyword: query.keyword || undefined, type: query.type || undefined })
    list.value = data.records
    total.value = data.total
  } finally {
    loading.value = false
  }
}
function search() { query.page = 1; load() }

onMounted(load)
</script>

<template>
  <div>
    <div class="filter-bar">
      <el-input v-model="query.keyword" placeholder="搜索标题" clearable style="width:220px"
                :prefix-icon="'Search'" @keyup.enter="search" @clear="search" />
      <el-radio-group v-model="query.type" @change="search">
        <el-radio-button value="">全部</el-radio-button>
        <el-radio-button v-for="t in TYPES" :key="t" :value="t">{{ t }}</el-radio-button>
      </el-radio-group>
    </div>

    <el-card v-loading="loading" class="list-card">
      <div v-for="n in list" :key="n.id" class="row" @click="router.push(`/news/${n.id}`)">
        <div class="main">
          <div class="title">
            <el-tag size="small" :type="n.type==='系统公告'?'danger':n.type==='活动通知'?'warning':'info'">{{ n.type }}</el-tag>
            <span>{{ n.title }}</span>
          </div>
          <div class="summary">{{ n.summary }}</div>
        </div>
        <div class="meta">
          <div>{{ (n.createTime || '').slice(0, 10) }}</div>
          <div class="views"><el-icon><View /></el-icon> {{ n.viewCount }}</div>
        </div>
      </div>
      <el-empty v-if="!loading && !list.length" description="暂无资讯" />
    </el-card>

    <el-pagination class="pager" layout="total, prev, pager, next" :total="total"
                   v-model:current-page="query.page" :page-size="query.size" @change="load" />
  </div>
</template>

<style scoped>
.filter-bar { display: flex; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
.row { display: flex; justify-content: space-between; padding: 16px 8px; border-bottom: 1px solid #f0f2f5; cursor: pointer; }
.row:hover { background: #f5f9ff; }
.title { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 600; }
.summary { color: #909399; font-size: 13px; margin-top: 6px; }
.meta { text-align: right; color: #909399; font-size: 13px; min-width: 100px; }
.views { margin-top: 6px; display: flex; align-items: center; gap: 4px; justify-content: flex-end; }
.pager { margin-top: 16px; justify-content: center; }
</style>
