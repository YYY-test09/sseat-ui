<script setup>
// 个人中心-意见反馈：提交新反馈 + 历史反馈及管理员回复
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { submitFeedback, getMyFeedbacks } from '../../../api/feedback'

const content = ref('')
const submitting = ref(false)
const list = ref([])
const query = reactive({ page: 1, size: 10 })
const total = ref(0)
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const data = await getMyFeedbacks(query)
    list.value = data.records
    total.value = data.total
  } finally { loading.value = false }
}

async function submit() {
  if (!content.value.trim()) return ElMessage.warning('请填写反馈内容')
  submitting.value = true
  try {
    await submitFeedback(content.value.trim())
    ElMessage.success('反馈已提交，请耐心等待管理员回复')
    content.value = ''
    query.page = 1
    load()
  } finally { submitting.value = false }
}

onMounted(load)
</script>

<template>
  <div>
    <el-card>
      <template #header><b>意见反馈</b></template>
      <el-input v-model="content" type="textarea" :rows="4" maxlength="1000" show-word-limit
                placeholder="使用中的问题、对系统的建议都可以写在这里～" />
      <el-button type="primary" style="margin-top:10px" :loading="submitting" @click="submit">提交反馈</el-button>
    </el-card>

    <el-card v-loading="loading" style="margin-top:16px">
      <template #header><b>我的反馈记录</b></template>
      <div v-for="f in list" :key="f.id" class="item">
        <div class="top">
          <el-tag size="small" :type="f.status === 1 ? 'success' : 'warning'">
            {{ f.status === 1 ? '已回复' : '待回复' }}
          </el-tag>
          <span class="time">{{ f.createTime }}</span>
        </div>
        <div class="content">{{ f.content }}</div>
        <div v-if="f.status === 1" class="reply">
          <b>管理员回复</b>（{{ f.replyTime }}）：{{ f.reply }}
        </div>
      </div>
      <el-empty v-if="!loading && !list.length" description="还没有提交过反馈" :image-size="70" />
      <el-pagination v-if="total > query.size" class="pager" layout="total, prev, pager, next" :total="total"
                     v-model:current-page="query.page" :page-size="query.size" @change="load" />
    </el-card>
  </div>
</template>

<style scoped>
.item { padding: 12px 0; border-bottom: 1px solid #f0f2f5; }
.top { display: flex; align-items: center; gap: 10px; }
.time { color: #c0c4cc; font-size: 12px; }
.content { margin-top: 6px; color: #303133; white-space: pre-wrap; }
.reply { margin-top: 8px; background: #f0f9eb; border-left: 3px solid #67c23a; padding: 8px 12px;
  border-radius: 4px; font-size: 13px; color: #529b2e; }
.pager { margin-top: 12px; justify-content: flex-end; }
</style>
