<script setup>
// 管理端-预约管理：查看/筛选所有用户预约，新增/修改/改状态/删除，处理异常数据
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getAdminReservationPage, saveAdminReservation, setAdminReservationStatus,
  deleteAdminReservation, STATUS_TEXT, STATUS_TYPE
} from '../../api/reservation'
import { getAdminRoomPage } from '../../api/room'
import { getUserPage } from '../../api/user'

const query = reactive({ page: 1, size: 10, keyword: '', status: null, date: '' })
const list = ref([])
const total = ref(0)
const loading = ref(false)
const rooms = ref([])
const users = ref([])

const dialog = ref(false)
const form = ref({})

async function load() {
  loading.value = true
  try {
    const data = await getAdminReservationPage({ ...query, keyword: query.keyword || undefined,
      status: query.status ?? undefined, date: query.date || undefined })
    list.value = data.records
    total.value = data.total
  } finally {
    loading.value = false
  }
}

function search() { query.page = 1; load() }
function reset() { Object.assign(query, { page: 1, keyword: '', status: null, date: '' }); load() }

async function loadOptions() {
  const r = await getAdminRoomPage({ page: 1, size: 100 })
  rooms.value = r.records
  const u = await getUserPage({ page: 1, size: 100 })
  users.value = u.records
}

function openCreate() {
  form.value = { userId: null, roomId: null, reserveDate: '', startHour: 9, endHour: 12, seatNo: 1, status: 0 }
  dialog.value = true
}

function openEdit(row) {
  form.value = { ...row, endHour: row.endHour ?? (row.startHour + 1) }
  dialog.value = true
}

async function submit() {
  if (!form.value.userId || !form.value.roomId || !form.value.reserveDate) {
    return ElMessage.warning('请填写用户、自习室和日期')
  }
  if (form.value.endHour <= form.value.startHour) {
    return ElMessage.warning('结束时间必须晚于开始时间')
  }
  await saveAdminReservation({
    id: form.value.id, userId: form.value.userId, roomId: form.value.roomId,
    reserveDate: form.value.reserveDate, startHour: form.value.startHour,
    endHour: form.value.endHour, seatNo: form.value.seatNo, status: form.value.status
  })
  ElMessage.success('保存成功')
  dialog.value = false
  load()
}

async function changeStatus(row, status) {
  await setAdminReservationStatus({ id: row.id, status })
  ElMessage.success('状态已更新')
  load()
}

function remove(row) {
  ElMessageBox.confirm('确定删除该预约记录吗？', '警告', { type: 'warning' }).then(async () => {
    await deleteAdminReservation(row.id)
    ElMessage.success('删除成功')
    load()
  }).catch(() => {})
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8)          // 开始整点 8~20
const END_HOURS = Array.from({ length: 13 }, (_, i) => i + 9)      // 结束整点 9~21

onMounted(() => { load(); loadOptions() })
</script>

<template>
  <div>
    <div class="toolbar">
      <div class="filters">
        <el-input v-model="query.keyword" placeholder="自习室/用户名" clearable style="width:180px" @keyup.enter="search" />
        <el-select v-model="query.status" placeholder="状态" clearable style="width:110px">
          <el-option v-for="(t, k) in STATUS_TEXT" :key="k" :label="t" :value="Number(k)" />
        </el-select>
        <el-date-picker v-model="query.date" type="date" value-format="YYYY-MM-DD" placeholder="预约日期" style="width:150px" />
        <el-button type="primary" :icon="'Search'" @click="search">查询</el-button>
        <el-button @click="reset">重置</el-button>
      </div>
      <el-button type="primary" :icon="'Plus'" @click="openCreate">新增预约</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="55" />
      <el-table-column label="预约人" width="120">
        <template #default="{ row }">{{ row.nickname || row.username }}</template>
      </el-table-column>
      <el-table-column prop="roomName" label="自习室" min-width="150" show-overflow-tooltip />
      <el-table-column prop="reserveDate" label="日期" width="110" />
      <el-table-column prop="timeSlot" label="时段" width="115" />
      <el-table-column label="座位" width="70">
        <template #default="{ row }">{{ row.seatNo ?? '—' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }"><el-tag :type="STATUS_TYPE[row.status]">{{ STATUS_TEXT[row.status] }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="230">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button v-if="row.status === 0" size="small" type="success" @click="changeStatus(row, 1)">确认</el-button>
          <el-dropdown v-if="row.status === 0 || row.status === 1" style="margin-left:8px" @command="c => changeStatus(row, c)">
            <el-button size="small">更多<el-icon><ArrowDown /></el-icon></el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-if="row.status === 1" :command="2">置为已完成</el-dropdown-item>
                <el-dropdown-item :command="3">取消预约</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button size="small" type="danger" link @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination class="pager" layout="total, prev, pager, next" :total="total"
                   v-model:current-page="query.page" :page-size="query.size" @change="load" />

    <el-dialog v-model="dialog" :title="form.id ? '编辑预约' : '新增预约'" width="520">
      <el-form label-width="90px">
        <el-form-item label="预约用户" required>
          <el-select v-model="form.userId" filterable placeholder="选择用户" style="width:100%">
            <el-option v-for="u in users" :key="u.id" :label="`${u.username}（${u.nickname}）`" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="自习室" required>
          <el-select v-model="form.roomId" filterable placeholder="选择自习室" style="width:100%">
            <el-option v-for="r in rooms" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="预约日期" required>
          <el-date-picker v-model="form.reserveDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-select v-model="form.startHour" style="width:100%">
            <el-option v-for="h in HOURS" :key="h" :label="`${String(h).padStart(2,'0')}:00`" :value="h" />
          </el-select>
        </el-form-item>
        <el-form-item label="结束时间">
          <el-select v-model="form.endHour" style="width:100%">
            <el-option v-for="h in END_HOURS" :key="h" :label="`${String(h).padStart(2,'0')}:00`" :value="h" />
          </el-select>
        </el-form-item>
        <el-form-item label="座位号">
          <el-input-number v-model="form.seatNo" :min="1" :max="200" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width:100%">
            <el-option v-for="(t, k) in STATUS_TEXT" :key="k" :label="t" :value="Number(k)" />
          </el-select>
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
.toolbar { display: flex; justify-content: space-between; margin-bottom: 14px; flex-wrap: wrap; gap: 10px; }
.filters { display: flex; gap: 10px; flex-wrap: wrap; }
.pager { margin-top: 14px; justify-content: flex-end; }
</style>
