<script setup>
// 个人中心-我的预约：列表 + 状态筛选 + 取消
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMyReservations, cancelReservation, STATUS_TEXT, STATUS_TYPE } from '../../../api/reservation'

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

    <el-table :data="list" border>
      <el-table-column prop="roomName" label="自习室" min-width="150" show-overflow-tooltip />
      <el-table-column prop="reserveDate" label="日期" width="120" />
      <el-table-column prop="timeSlot" label="时段" width="120" />
      <el-table-column prop="seatNo" label="座位" width="70">
        <template #default="{ row }">{{ row.seatNo ?? '—' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }"><el-tag :type="STATUS_TYPE[row.status]">{{ STATUS_TEXT[row.status] }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="90">
        <template #default="{ row }">
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
