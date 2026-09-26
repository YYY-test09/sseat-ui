<script setup>
// 用户端首页：自习室卡片列表，支持类型/关键词筛选，展示价格与今日剩余名额
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getRoomPage } from '../../api/room'

const router = useRouter()
const query = reactive({ page: 1, size: 12, keyword: '', type: '' })
const list = ref([])
const total = ref(0)
const loading = ref(false)

const TYPES = ['普通自习室', '研讨室', '电子设备自习室', 'VIP自习室']

async function load() {
  loading.value = true
  try {
    const data = await getRoomPage({ ...query, keyword: query.keyword || undefined, type: query.type || undefined })
    list.value = data.records
    total.value = data.total
  } finally {
    loading.value = false
  }
}

function search() { query.page = 1; load() }

// 折扣后价格：价格 × 折扣，保留 2 位
function finalPrice(r) { return (Number(r.price) * Number(r.discount)).toFixed(2) }

onMounted(load)
</script>

<template>
  <div>
    <div class="filter-bar">
      <el-input v-model="query.keyword" placeholder="搜索自习室名称" clearable style="width:240px"
                :prefix-icon="'Search'" @keyup.enter="search" @clear="search" />
      <el-radio-group v-model="query.type" @change="search">
        <el-radio-button value="">全部</el-radio-button>
        <el-radio-button v-for="t in TYPES" :key="t" :value="t">{{ t }}</el-radio-button>
      </el-radio-group>
    </div>

    <div v-loading="loading" class="grid">
      <el-card v-for="r in list" :key="r.id" class="room-card" shadow="hover"
               @click="router.push(`/room/${r.id}`)">
        <div class="cover">
          <img v-if="r.coverImg" :src="r.coverImg" />
          <div v-else class="cover-ph">📚</div>
          <el-tag class="type-tag" size="small">{{ r.type }}</el-tag>
        </div>
        <div class="body">
          <div class="name">{{ r.name }}</div>
          <div class="facilities">
            <el-tag v-for="f in (r.facilities || '').split(',').filter(Boolean)" :key="f" size="small" type="info" effect="plain">
              {{ f }}
            </el-tag>
          </div>
          <div class="price-row">
            <span class="price">¥{{ finalPrice(r) }}<small>/小时</small></span>
            <span v-if="Number(r.discount) < 1" class="origin">¥{{ r.price }}</span>
            <span class="remain" :class="{ low: r.remaining <= 0 }">
              剩余{{ r.remaining > 0 ? r.remaining : '已满' }}
            </span>
          </div>
        </div>
      </el-card>
      <el-empty v-if="!loading && !list.length" description="暂无符合条件的自习室" style="grid-column:1/-1" />
    </div>

    <el-pagination class="pager" layout="prev, pager, next, total" :total="total"
                   v-model:current-page="query.page" :page-size="query.size" @change="load" />
  </div>
</template>

<style scoped>
.filter-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
@media (max-width: 1000px) { .grid { grid-template-columns: repeat(2, 1fr); } }
.room-card { cursor: pointer; border-radius: 10px; overflow: hidden; }
.room-card :deep(.el-card__body) { padding: 0; }
.cover { position: relative; height: 130px; background: #eaf1fb; display: flex; align-items: center; justify-content: center; }
.cover img { width: 100%; height: 100%; object-fit: cover; }
.cover-ph { font-size: 44px; }
.type-tag { position: absolute; top: 8px; left: 8px; }
.body { padding: 10px 12px 12px; }
.name { font-weight: 600; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.facilities { margin: 8px 0; display: flex; flex-wrap: wrap; gap: 4px; min-height: 24px; }
.price-row { display: flex; align-items: baseline; gap: 8px; }
.price { color: #f56c6c; font-size: 17px; font-weight: 700; }
.price small { font-size: 12px; font-weight: 400; }
.origin { color: #c0c4cc; text-decoration: line-through; font-size: 12px; }
.remain { margin-left: auto; font-size: 12px; color: #67c23a; }
.remain.low { color: #f56c6c; }
.pager { margin-top: 20px; justify-content: center; }
</style>
