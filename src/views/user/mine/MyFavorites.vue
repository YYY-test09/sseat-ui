<script setup>
// 个人中心-我的收藏：自习室/帖子两个页签，支持取消收藏
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMyFavorites, removeFavorite } from '../../../api/room'

const router = useRouter()
const tab = ref('room')
const rooms = ref([])
const posts = ref([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const data = await getMyFavorites()
    rooms.value = data.filter(f => f.targetType === 'room' && f.room)
    posts.value = data.filter(f => f.targetType === 'post' && f.post)
  } finally {
    loading.value = false
  }
}

function cancel(type, id) {
  ElMessageBox.confirm('确定取消收藏吗？', '提示', { type: 'warning' }).then(async () => {
    await removeFavorite(type, id)
    ElMessage.success('已取消收藏')
    load()
  }).catch(() => {})
}

onMounted(load)
</script>

<template>
  <el-card v-loading="loading">
    <template #header>我的收藏</template>
    <el-tabs v-model="tab">
      <el-tab-pane :label="`自习室 (${rooms.length})`" name="room">
        <el-empty v-if="!rooms.length" description="还没有收藏自习室" />
        <div v-for="f in rooms" :key="f.targetId" class="item">
          <el-image v-if="f.room.coverImg" :src="f.room.coverImg" class="thumb" fit="cover" />
          <div v-else class="thumb ph">📚</div>
          <div class="info">
            <div class="name clickable" @click="router.push(`/room/${f.room.id}`)">{{ f.room.name }}</div>
            <div class="sub">{{ f.room.type }} · ¥{{ f.room.price }}/小时 · 收藏于 {{ (f.favoriteTime || '').slice(0, 10) }}</div>
          </div>
          <el-button size="small" @click="cancel('room', f.room.id)">取消收藏</el-button>
        </div>
      </el-tab-pane>

      <el-tab-pane :label="`帖子 (${posts.length})`" name="post">
        <el-empty v-if="!posts.length" description="还没有收藏帖子" />
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
          <el-button size="small" @click="cancel('post', f.post.id)">取消收藏</el-button>
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>

<style scoped>
.item { display: flex; align-items: center; padding: 12px 4px; border-bottom: 1px solid #f0f2f5; }
.thumb { width: 72px; height: 50px; border-radius: 6px; margin-right: 12px; flex-shrink: 0; }
.thumb.ph { display: flex; align-items: center; justify-content: center; background: #eaf1fb; font-size: 22px; }
.info { flex: 1; min-width: 0; }
.name { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.clickable { cursor: pointer; }
.clickable:hover { color: #409eff; }
.sub { color: #909399; font-size: 12px; margin-top: 4px; display: flex; gap: 6px; align-items: center; }
</style>
