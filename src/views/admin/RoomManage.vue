<script setup>
// 管理端-自习室座位管理：列表 + 新增/编辑弹窗（含设施配置、开放时段、容量）+ 删除
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminRoomPage, saveAdminRoom, deleteAdminRoom } from '../../api/room'
import { uploadImage } from '../../api/user'

const query = reactive({ page: 1, size: 10, keyword: '', type: '', status: null })
const list = ref([])
const total = ref(0)
const loading = ref(false)

const TYPES = ['普通自习室', '研讨室', '电子设备自习室', 'VIP自习室']
const FACILITY_OPTIONS = ['空调', '电源', 'WiFi', '白板', '饮水机', '独立隔间']
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6) // 6~23 整点可选

const dialog = ref(false)
const form = ref({})
const facilityList = ref([])
const uploading = ref(false)

async function load() {
  loading.value = true
  try {
    const data = await getAdminRoomPage({ ...query, keyword: query.keyword || undefined,
      type: query.type || undefined, status: query.status ?? undefined })
    list.value = data.records
    total.value = data.total
  } finally {
    loading.value = false
  }
}

function search() { query.page = 1; load() }

function openCreate() {
  form.value = { name: '', type: '普通自习室', description: '', price: 2, discount: 1,
    seatCount: 20, maxCapacity: 20, openStart: 8, openEnd: 21, coverImg: '', status: 1 }
  facilityList.value = ['空调', '电源', 'WiFi']
  dialog.value = true
}

function openEdit(row) {
  form.value = { ...row }
  facilityList.value = (row.facilities || '').split(',').filter(Boolean)
  dialog.value = true
}

async function customUpload(option) {
  uploading.value = true
  try {
    form.value.coverImg = await uploadImage(option.file)
    ElMessage.success('图片上传成功')
  } finally {
    uploading.value = false
  }
}

async function submit() {
  if (!form.value.name) return ElMessage.warning('请输入自习室名称')
  await saveAdminRoom({ ...form.value, facilities: facilityList.value.join(',') })
  ElMessage.success('保存成功')
  dialog.value = false
  load()
}

// 表格内直接切换开放/停用状态
async function toggleStatus(row) {
  try {
    await saveAdminRoom({ ...row, status: row.status })
    ElMessage.success(row.status === 1 ? '已开放预约' : '已停用')
  } catch (e) {
    row.status = row.status === 1 ? 0 : 1
  }
}

function remove(row) {
  ElMessageBox.confirm(`确定删除自习室「${row.name}」吗？`, '警告', { type: 'warning' }).then(async () => {
    await deleteAdminRoom(row.id)
    ElMessage.success('删除成功')
    load()
  }).catch(() => {})
}

onMounted(load)
</script>

<template>
  <div>
    <div class="toolbar">
      <div class="filters">
        <el-input v-model="query.keyword" placeholder="名称关键词" clearable style="width:180px" @keyup.enter="search" @clear="search" />
        <el-select v-model="query.type" placeholder="类型" clearable style="width:150px">
          <el-option v-for="t in TYPES" :key="t" :label="t" :value="t" />
        </el-select>
        <el-select v-model="query.status" placeholder="状态" clearable style="width:110px">
          <el-option label="开放" :value="1" /><el-option label="停用" :value="0" />
        </el-select>
        <el-button type="primary" :icon="'Search'" @click="search">查询</el-button>
      </div>
      <el-button type="primary" :icon="'Plus'" @click="openCreate">新增自习室</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="55" />
      <el-table-column label="图片" width="90">
        <template #default="{ row }">
          <el-image v-if="row.coverImg" :src="row.coverImg" style="width:60px;height:40px;border-radius:4px" fit="cover" />
          <span v-else class="gray">无</span>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="名称" min-width="160" show-overflow-tooltip />
      <el-table-column prop="type" label="类型" width="130" />
      <el-table-column label="价格(元/时)" width="110">
        <template #default="{ row }">
          ¥{{ row.price }}
          <el-tag v-if="Number(row.discount) < 1" type="danger" size="small">{{ (row.discount * 10).toFixed(1) }}折</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="座位/容量" width="100">
        <template #default="{ row }">{{ row.seatCount }} / {{ row.maxCapacity }}</template>
      </el-table-column>
      <el-table-column label="开放时间" width="120">
        <template #default="{ row }">{{ String(row.openStart).padStart(2, '0') }}:00-{{ String(row.openEnd).padStart(2, '0') }}:00</template>
      </el-table-column>
      <el-table-column prop="facilities" label="设施" min-width="140" show-overflow-tooltip />
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-switch v-model="row.status" :active-value="1" :inactive-value="0" @change="toggleStatus(row)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="130">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination class="pager" layout="total, prev, pager, next" :total="total"
                   v-model:current-page="query.page" :page-size="query.size" @change="load" />

    <el-dialog v-model="dialog" :title="form.id ? '编辑自习室' : '新增自习室'" width="640" top="6vh">
      <el-form label-width="100px">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" maxlength="50" placeholder="如：一号自习室（教学楼A101）" />
        </el-form-item>
        <el-form-item label="类型" required>
          <el-select v-model="form.type" style="width:100%">
            <el-option v-for="t in TYPES" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="详细描述">
          <el-input v-model="form.description" type="textarea" :rows="3" maxlength="500" show-word-limit />
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="价格(元/时)">
              <el-input-number v-model="form.price" :min="0" :precision="2" :step="0.5" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="折扣">
              <el-input-number v-model="form.discount" :min="0.01" :max="1" :step="0.05" :precision="2" />
              <span class="tip">0.8 = 八折</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="座位数" required>
              <el-input-number v-model="form.seatCount" :min="1" :max="200" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="时段容量">
              <el-input-number v-model="form.maxCapacity" :min="1" :max="200" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="开放时间">
          <el-select v-model="form.openStart" style="width:100px">
            <el-option v-for="h in HOURS" :key="h" :label="String(h).padStart(2,'0') + ':00'" :value="h" />
          </el-select>
          <span style="margin:0 8px">至</span>
          <el-select v-model="form.openEnd" style="width:100px">
            <el-option v-for="h in HOURS" :key="h" :label="String(h).padStart(2,'0') + ':00'" :value="h" />
          </el-select>
          <span class="tip">整点时段，如 08:00-21:00</span>
        </el-form-item>
        <el-form-item label="设施配置">
          <el-checkbox-group v-model="facilityList">
            <el-checkbox v-for="f in FACILITY_OPTIONS" :key="f" :value="f" :label="f">{{ f }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="展示图片">
          <div class="cover-row">
            <el-upload :show-file-list="false" :http-request="customUpload" accept="image/*">
              <el-button :loading="uploading" :icon="'Upload'">上传图片</el-button>
            </el-upload>
            <el-image v-if="form.coverImg" :src="form.coverImg" style="width:120px;height:70px;margin-left:12px;border-radius:6px" fit="cover" />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog = false">取消</el-button>
        <el-button type="primary" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.toolbar { display: flex; justify-content: space-between; margin-bottom: 14px; }
.filters { display: flex; gap: 10px; }
.pager { margin-top: 14px; justify-content: flex-end; }
.gray { color: #c0c4cc; }
.tip { margin-left: 10px; font-size: 12px; color: #909399; }
.cover-row { display: flex; align-items: center; }
</style>
