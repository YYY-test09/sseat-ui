<script setup>
// 发帖/编辑帖页：编辑已通过的帖子会重新进入待审核
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { publishPost, updateMyPost, getPostDetail, POST_TYPES } from '../../api/post'
import { uploadImage } from '../../api/user'

const router = useRouter()
const route = useRoute()
const editId = route.query.editId ? Number(route.query.editId) : null
const form = reactive({ title: '', type: '讨论', content: '', coverImg: '' })
const uploading = ref(false)
const submitting = ref(false)

onMounted(async () => {
  if (editId) {
    // 帖子详情接口作者可读（即便待审）
    const data = await getPostDetail(editId)
    Object.assign(form, { title: data.post.title, type: data.post.type,
      content: data.post.content, coverImg: data.post.coverImg || '' })
  }
})

async function customUpload(option) {
  uploading.value = true
  try { form.coverImg = await uploadImage(option.file) }
  finally { uploading.value = false }
}

async function submit() {
  if (!form.title) return ElMessage.warning('请输入标题')
  if (!form.content) return ElMessage.warning('请输入正文内容')
  submitting.value = true
  try {
    if (editId) {
      await updateMyPost({ id: editId, ...form })
      ElMessage.success('修改成功，重新进入待审核')
    } else {
      await publishPost({ ...form })
      ElMessage.success('发布成功，等待管理员审核后展示')
    }
    router.push('/forum')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <el-card>
    <template #header><b>发布新帖</b></template>
    <el-form label-width="80px" style="max-width:720px">
      <el-form-item label="类型" required>
        <el-radio-group v-model="form.type">
          <el-radio-button v-for="t in POST_TYPES" :key="t" :value="t">{{ t }}</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="标题" required>
        <el-input v-model="form.title" maxlength="50" show-word-limit placeholder="一句话说清主题" />
      </el-form-item>
      <el-form-item label="封面图">
        <div class="cover-row">
          <el-upload :show-file-list="false" :http-request="customUpload" accept="image/*">
            <el-button :loading="uploading" :icon="'Upload'">上传封面（可不传）</el-button>
          </el-upload>
          <el-image v-if="form.coverImg" :src="form.coverImg" style="width:160px;height:90px;margin-left:12px;border-radius:6px" fit="cover" />
        </div>
      </el-form-item>
      <el-form-item label="正文" required>
        <el-input v-model="form.content" type="textarea" :rows="10" maxlength="5000" show-word-limit
                  placeholder="详细描述你的问题或内容…" />
      </el-form-item>
      <el-form-item>
        <el-alert type="info" :closable="false" show-icon title="帖子提交后需管理员审核，通过后才会展示在论坛首页" style="margin-bottom:12px;width:100%" />
        <el-button type="primary" size="large" :loading="submitting" @click="submit">提交发布</el-button>
        <el-button size="large" @click="router.back()">取消</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<style scoped>
.cover-row { display: flex; align-items: center; }
</style>
