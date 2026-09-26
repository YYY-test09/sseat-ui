<script setup>
// 自习室详情页：大图、描述、设施清单、点赞收藏（需登录），以及"去预约"入口
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getRoomDetail, toggleRoomLike, toggleRoomFavorite } from '../../api/room'
import { useUserStore } from '../../store/user'

const route = useRoute()
const router = useRouter()
const store = useUserStore()

const room = ref(null)
const liked = ref(false)
const favorited = ref(false)
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    const data = await getRoomDetail(route.params.id)
    room.value = data.room
    liked.value = data.liked
    favorited.value = data.favorited
  } finally {
    loading.value = false
  }
}

// 未登录点击交互按钮 → 引导登录（需求：浏览开放，交互需登录）
function requireLogin() {
  if (!store.user) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return true
  }
  return false
}

async function like() {
  if (requireLogin()) return
  const r = await toggleRoomLike(room.value.id)
  liked.value = r.liked
  room.value.likeCount += r.liked ? 1 : -1
}

async function favorite() {
  if (requireLogin()) return
  const r = await toggleRoomFavorite(room.value.id)
  favorited.value = r.favorited
  ElMessage.success(r.favorited ? '已收藏' : '已取消收藏')
}

function goBook() {
  if (requireLogin()) return
  router.push({ path: '/book', query: { roomId: room.value.id } })
}

const finalPrice = () => room.value ? (Number(room.value.price) * Number(room.value.discount)).toFixed(2) : '0'

onMounted(load)
</script>

<template>
  <div v-loading="loading">
    <template v-if="room">
      <el-row :gutter="24">
        <el-col :span="14">
          <el-card :body-style="{ padding: '0' }" class="cover-card">
            <img v-if="room.coverImg" :src="room.coverImg" class="big-img" />
            <div v-else class="big-ph">📚 暂无图片</div>
          </el-card>
        </el-col>
        <el-col :span="10">
          <div class="title-line">
            <h2>{{ room.name }}</h2>
            <el-tag>{{ room.type }}</el-tag>
          </div>
          <div class="price-box">
            <span class="final">¥{{ finalPrice() }}<small>/小时</small></span>
            <template v-if="Number(room.discount) < 1">
              <span class="origin">原价 ¥{{ room.price }}</span>
              <el-tag type="danger" size="small">{{ (room.discount * 10).toFixed(1) }}折</el-tag>
            </template>
          </div>
          <p class="meta">总座位数：<b>{{ room.seatCount }}</b>　今日剩余：<b :class="{ red: room.remaining <= 0 }">{{ room.remaining > 0 ? room.remaining + ' 席' : '已满' }}</b></p>
          <p class="meta">开放时间：{{ String(room.openStart).padStart(2, '0') }}:00 - {{ String(room.openEnd).padStart(2, '0') }}:00（整点时段）</p>
          <div class="facilities">
            <span class="fl">设施配置：</span>
            <el-tag v-for="f in (room.facilities || '').split(',').filter(Boolean)" :key="f" size="small"
                    style="margin-right:6px">{{ f }}</el-tag>
            <span v-if="!room.facilities" class="gray">暂无</span>
          </div>
          <div class="actions">
            <el-button type="primary" size="large" :disabled="room.status !== 1" @click="goBook">
              {{ room.status === 1 ? '去预约' : '暂停预约' }}
            </el-button>
            <el-button size="large" :type="liked ? 'danger' : 'default'" @click="like">
              {{ liked ? '❤ 已点赞' : '🤍 点赞' }} {{ room.likeCount }}
            </el-button>
            <el-button size="large" :type="favorited ? 'warning' : 'default'" @click="favorite">
              {{ favorited ? '★ 已收藏' : '☆ 收藏' }}
            </el-button>
          </div>
        </el-col>
      </el-row>

      <el-card style="margin-top:20px">
        <template #header>详细描述</template>
        <p class="desc">{{ room.description || '暂无描述' }}</p>
      </el-card>
    </template>
  </div>
</template>

<style scoped>
.cover-card { border-radius: 10px; overflow: hidden; }
.big-img { width: 100%; height: 380px; object-fit: cover; display: block; }
.big-ph { height: 380px; display: flex; align-items: center; justify-content: center; font-size: 40px; color: #b7c6dd; background: #eaf1fb; }
.title-line { display: flex; align-items: center; gap: 10px; }
.price-box { margin: 12px 0; display: flex; align-items: baseline; gap: 10px; }
.final { color: #f56c6c; font-size: 26px; font-weight: 700; }
.final small { font-size: 13px; font-weight: 400; }
.origin { color: #c0c4cc; text-decoration: line-through; }
.meta { color: #606266; margin: 6px 0; font-size: 14px; }
.meta b { color: #303133; }
.red { color: #f56c6c; }
.facilities { margin: 12px 0; }
.fl { color: #909399; font-size: 14px; margin-right: 4px; }
.gray { color: #c0c4cc; }
.actions { margin-top: 18px; display: flex; gap: 10px; }
.desc { white-space: pre-wrap; line-height: 1.8; color: #303133; }
</style>
