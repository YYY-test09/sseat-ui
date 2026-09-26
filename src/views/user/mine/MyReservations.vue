<script setup>
// 个人中心-我的预约：列表 + 状态筛选 + 签到 + 取消
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMyReservations, cancelReservation, checkinReservation, STATUS_TEXT, STATUS_TYPE } from '../../../api/reservation'

const query = reactive({ page: 1, size: 10, status: null })
const list = ref([])
const total = ref(0)
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const data = await getMyReservations({ ...query, status: query.status ?? undefined })
    list.value = data.records
    total.value = data.total
  } finally {
    loading.value = false
  }
}

function search() { query.page = 1; load() }

// 该预约是否处于"可签到"窗口：时段已开始且还没结束（后端会再校验15分钟超时）
function canCheckin(row) {
  if (!row.checkInTime && (row.status === 0 || row.status === 1)) {
    const start = new Date(`${row.reserveDate}T${String(row.startHour).padStart(2, '0')}:00:00`)
    return Date.now() >= start.getTime()
  }
  return false
}

async function checkin(row) {
  await checkinReservation(row.id)
  ElMessage.success('签到成功，祝学习顺利')
  load()
}

function cancel(row) {
  ElMessageBox.confirm(`确定取消 ${row.reserveDate} ${row.timeSlot} ${row.seatNo}号座 的预约吗？`, '提示',
    { type: 'warning' }).then(async () => {
      await cancelReservation(row.id)
      ElMessage.success('已取消')
      load()
    }).catch(() => {})
}

onMounted(load)
</script>

<template>
  <el-card v-loading="loading">
    <template #header>
      <div class="hd">
        <b>我的预约</b>
        <el-radio-group v-model="query.status" size="small" @change="search">
          <el-radio-button :value="null">全部</el-radio-button>
          <el-radio-button :value="0">待确认</el-radio-button>
          <el-radio-button :value="1">已确认</el-radio-button>
          <el-radio-button :value="2">已完成</el-radio-button>
          <el-radio-button :value="3">已取消</el-radio-button>
        </el-radio-group>
      </div>
    </template>

    <el-alert type="info" :closable="false" show-icon style="margin-bottom:12px"
              title="请在预约时段开始后 15 分钟内签到，逾期未签到系统将自动取消预约并释放座位" />

    <el-table :data="list" border>
      <el-table-column prop="roomName" label="自习室" min-width="150" show-overflow-tooltip />
      <el-table-column prop="reserveDate" label="日期" width="120" />
      <el-table-column prop="timeSlot" label="时段" width="120" />
      <el-table-column prop="seatNo" label="座位" width="70">
        <template #default="{ row }">{{ row.seatNo ?? '—' }}</template>
      </el-table-column>
      <el-table-column label="签到" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.checkInTime" type="success" size="small">已签到</el-tag>
          <span v-else-if="row.status === 3" class="gray">—</span>
          <span v-else-if="row.status === 2" class="gray">未签到</span>
          <span v-else class="gray">待签到</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }"><el-tag :type="STATUS_TYPE[row.status]">{{ STATUS_TEXT[row.status] }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="140">
        <template #default="{ row }">
          <el-button v-if="canCheckin(row)" size="small" type="primary" @click="checkin(row)">签到</el-button>
          <el-button v-if="row.status === 0 || row.status === 1" size="small" type="danger" link
                     @click="cancel(row)">取消</el-button>
          <span v-else class="gray">—</span>
        </template>
      </el-table-column>
      <template #empty><el-empty description="还没有预约记录" /></template>
    </el-table>

    <el-pagination class="pager" layout="total, prev, pager, next" :total="total"
                   v-model:current-page="query.page" :page-size="query.size" @change="load" />
  </el-card>
</template>

<style scoped>
.hd { display: flex; justify-content: space-between; align-items: center; }
.gray { color: #c0c4cc; }
.pager { margin-top: 14px; justify-content: flex-end; }
</style>
