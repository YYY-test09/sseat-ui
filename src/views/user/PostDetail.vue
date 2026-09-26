<script setup>
// 帖子详情：正文、点赞收藏、评论列表、发表评论
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPostDetail, addComment, deleteComment, togglePostLike, togglePostFavorite, POST_STATUS_TEXT, POST_STATUS_TYPE } from '../../api/post'
import { useUserStore } from '../../store/user'

const route = useRoute()
const router = useRouter()
const store = useUserStore()

const post = ref(null)
const comments = ref([])
const liked = ref(false)
const favorited = ref(false)
const isAuthor = ref(false)
const loading = ref(true)
const commentText = ref('')

async function load() {
  loading.value = true
  try {
    const data = await getPostDetail(route.params.id)
    post.value = data.post
    comments.value = data.comments
    liked.value = data.liked
    favorited.value = data.favorited
    isAuthor.value = data.isAuthor
  } finally {
    loading.value = false
  }
}

function requireLogin() {
  if (!store.user) { ElMessage.warning('请先登录'); router.push('/login'); return true }
  return false
}

async function like() {
  if (requireLogin()) return
  const r = await togglePostLike(post.value.id)
  liked.value = r.liked
  post.value.likeCount += r.liked ? 1 : -1
}

async function favorite() {
  if (requireLogin()) return
  const r = await togglePostFavorite(post.value.id)
  favorited.value = r.favorited
  ElMessage.success(r.favorited ? '已收藏' : '已取消收藏')
}

async function submitComment() {
  if (requireLogin()) return
  if (!commentText.value.trim()) return ElMessage.warning('请输入评论内容')
  await addComment(post.value.id, commentText.value.trim())
  commentText.value = ''
  ElMessage.success('评论成功')
  load()
}

function removeComment(cid) {
  ElMessageBox.confirm('删除这条评论？', '提示', { type: 'warning' }).then(async () => {
    await deleteComment(cid); load()
  }).catch(() => {})
}

onMounted(load)
</script>

<template>
  <el-card v-loading="loading">
    <template v-if="post">
      <div class="head">
        <h2>{{ post.title }}</h2>
        <el-tag v-if="post.status !== 1" :type="POST_STATUS_TYPE[post.status]">{{ POST_STATUS_TEXT[post.status] }}</el-tag>
      </div>
      <div class="meta">
        <el-avatar :size="28" :src="post.authorAvatar || undefined">{{ (post.authorName || '?')[0] }}</el-avatar>
        <span>{{ post.authorName }}</span>
        <span>{{ post.createTime }}</span>
        <span><el-icon><View /></el-icon> {{ post.viewCount }}</span>
      </div>
      <img v-if="post.coverImg" :src="post.coverImg" class="cover" />
      <div class="content">{{ post.content }}</div>

      <div class="actions">
        <el-button :type="liked ? 'danger' : 'default'" round @click="like">
          {{ liked ? '❤ 已赞' : '🤍 点赞' }} {{ post.likeCount }}
        </el-button>
        <el-button :type="favorited ? 'warning' : 'default'" round @click="favorite">
          {{ favorited ? '★ 已收藏' : '☆ 收藏' }}
        </el-button>
      </div>

      <el-divider>评论 ({{ comments.length }})</el-divider>
      <div class="comment-input">
        <el-input v-model="commentText" type="textarea" :rows="2" maxlength="500" show-word-limit
                  placeholder="友善发言，理性讨论…" />
        <el-button type="primary" style="margin-top:8px" @click="submitComment">发表评论</el-button>
      </div>
      <div v-for="c in comments" :key="c.id" class="comment">
        <el-avatar :size="34" :src="c.authorAvatar || undefined">{{ (c.authorName || '?')[0] }}</el-avatar>
        <div class="c-body">
          <div class="c-top"><b>{{ c.authorName }}</b><span class="c-time">{{ c.createTime }}</span>
            <el-button v-if="isAuthor" link size="small" type="danger" @click="removeComment(c.id)">删除</el-button>
          </div>
          <div class="c-content">{{ c.content }}</div>
        </div>
      </div>
      <el-empty v-if="!comments.length" description="还没有评论" :image-size="70" />
    </template>
  </el-card>
</template>

<style scoped>
.head { display: flex; align-items: center; gap: 10px; }
.meta { display: flex; align-items: center; gap: 12px; color: #909399; font-size: 13px; margin: 10px 0 16px; }
.cover { width: 100%; max-height: 360px; object-fit: cover; border-radius: 8px; margin-bottom: 16px; }
.content { white-space: pre-wrap; line-height: 1.9; font-size: 15px; }
.actions { margin: 20px 0; }
.comment-input { margin-bottom: 16px; }
.comment { display: flex; gap: 12px; padding: 12px 0; border-top: 1px solid #f5f5f5; }
.c-body { flex: 1; }
.c-top { display: flex; align-items: center; gap: 10px; font-size: 13px; }
.c-time { color: #c0c4cc; font-size: 12px; }
.c-content { margin-top: 4px; color: #303133; }
</style>
