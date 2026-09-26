<script setup>
// 预约页：选自习室 → 选日期 → 选整点时段(看余量) → 选座位号 → 提交
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getRoomPage } from '../../api/room'
import { getSlots, getOccupiedSeats, bookRoom } from '../../api/reservation'

const route = useRoute()
const router = useRouter()

const rooms = ref([])
const form = reactive({ roomId: Number(route.query.roomId) || null, date: '', hour: null, seatNo: null })

// 日期最小=今天、最大=今天+7
const today = new Date()
function fmt(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const minDate = fmt(today)
const max = new Date(today.getTime() + 7 * 86400000)
const maxDate = fmt(max)

const slots = ref([])
const occupied = ref([])   // 当前时段已占座位号
const submitting = ref(false)

const selectedRoom = computed(() => rooms.value.find(r => r.id === form.roomId))
const seatCount = computed(() => selectedRoom.value?.seatCount || 0)

async function loadRooms() {
  const data = await getRoomPage({ page: 1, size: 100 })
  rooms.value = data.records
}

// 选日期后加载时段
watch(() => form.date, async (val) => {
  form.hour = null; form.seatNo = null; slots.value = []; occupied.value = []
  if (val && form.roomId) slots.value = await getSlots({ roomId: form.roomId, date: val })
})
// 换自习室也重新加载时段
watch(() => form.roomId, async () => {
  if (form.date && form.roomId) slots.value = await getSlots({ roomId: form.roomId, date: form.date })
})

// 选时段后加载已占座位
async function pickSlot(s) {
  if (s.remaining <= 0 || s.past) return
  form.hour = s.hour
  form.seatNo = null
  occupied.value = await getOccupiedSeats({ roomId: form.roomId, date: form.date, hour: s.hour })
}

function pickSeat(n) {
  if (occupied.value.includes(n)) return
  form.seatNo = n
}

// 座位网格：把 1..seatCount 排成每行 10 个
const seatRows = computed(() => {
  const rows = []
  for (let i = 1; i <= seatCount.value; i += 10) {
    rows.push(Array.from({ length: Math.min(10, seatCount.value - i + 1) }, (_, k) => i + k))
  }
  return rows
})

async function submit() {
  if (!form.roomId || !form.date || form.hour === null || !form.seatNo) {
    return ElMessage.warning('请依次选择自习室、日期、时段和座位')
  }
  submitting.value = true
  try {
    await bookRoom({ roomId: form.roomId, reserveDate: form.date, startHour: form.hour, seatNo: form.seatNo })
    ElMessage.success('预约成功，可在"我的预约"查看')
    router.push('/mine/reservations')
  } catch (e) {
    // 失败可能因时段/座位被抢，刷新数据
    if (form.date && form.roomId) {
      slots.value = await getSlots({ roomId: form.roomId, date: form.date })
      if (form.hour !== null) occupied.value = await getOccupiedSeats({ roomId: form.roomId, date: form.date, hour: form.hour })
    }
  } finally {
    submitting.value = false
  }
}

onMounted(loadRooms)
</script>

<template>
  <el-card>
    <template #header><b>预约自习室座位</b></template>
    <el-form label-width="80px">
      <el-form-item label="自习室">
        <el-select v-model="form.roomId" placeholder="请选择自习室" filterable style="width:320px">
          <el-option v-for="r in rooms" :key="r.id" :label="r.name + '（剩余' + r.remaining + '）'" :value="r.id"
                     :disabled="r.remaining <= 0" />
        </el-select>
        <span v-if="selectedRoom" class="cur">当前：{{ selectedRoom.name }} · {{ selectedRoom.type }} · {{ selectedRoom.seatCount }}座</span>
      </el-form-item>
      <el-form-item label="预约日期">
        <el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD"
                        :min-date="new Date(minDate)" :max-date="new Date(maxDate)" placeholder="选择日期" />
        <span class="tip">可预约今日起 7 天内</span>
      </el-form-item>
    </el-form>

    <div v-if="form.date" class="section">
      <div class="sec-title">选择时段</div>
      <div class="slots">
        <div v-for="s in slots" :key="s.hour"
             class="slot" :class="{ active: form.hour === s.hour, disabled: s.remaining <= 0 || s.past, mine: s.bookedByMe }"
             @click="pickSlot(s)">
          <div class="slot-time">{{ s.label }}</div>
          <div class="slot-remain">
            <span v-if="s.past">已过</span>
            <span v-else-if="s.remaining <= 0">已满</span>
            <span v-else>余 {{ s.remaining }}</span>
          </div>
          <div v-if="s.bookedByMe" class="slot-mine-tag">已约</div>
        </div>
      </div>
    </div>

    <div v-if="form.hour !== null" class="section">
      <div class="sec-title">选择座位（共 {{ seatCount }} 座，灰色为已被占用）</div>
      <div class="seats">
        <div v-for="row in seatRows" :key="row[0]" class="seat-row">
          <div v-for="n in row" :key="n" class="seat" :class="{ taken: occupied.includes(n), active: form.seatNo === n }"
               @click="pickSeat(n)">{{ n }}</div>
        </div>
      </div>
      <div class="legend">
        <span><i class="box"></i>可选</span>
        <span><i class="box taken"></i>已占用</span>
        <span><i class="box active"></i>已选</span>
      </div>
    </div>

    <div class="submit-bar" v-if="form.hour !== null && form.seatNo">
      <div class="summary">
        {{ selectedRoom?.name }} · {{ form.date }} ·
        {{ String(form.hour).padStart(2, '0') }}:00-{{ String(form.hour + 1).padStart(2, '0') }}:00 · {{ form.seatNo }}号座
      </div>
      <el-button type="primary" size="large" :loading="submitting" @click="submit">确认预约</el-button>
    </div>
  </el-card>
</template>

<style scoped>
.tip { margin-left: 12px; color: #909399; font-size: 12px; }
.cur { margin-left: 12px; color: #409eff; font-size: 13px; }
.section { margin-top: 8px; }
.sec-title { font-weight: 600; margin-bottom: 10px; color: #303133; }
.slots { display: flex; flex-wrap: wrap; gap: 10px; }
.slot { position: relative; width: 110px; padding: 8px 0; text-align: center; border: 1px solid #dcdfe6;
  border-radius: 6px; cursor: pointer; transition: all .2s; }
.slot:hover:not(.disabled) { border-color: #409eff; }
.slot-time { font-size: 13px; }
.slot-remain { font-size: 12px; color: #67c23a; margin-top: 2px; }
.slot.disabled { background: #f5f7fa; color: #c0c4cc; cursor: not-allowed; }
.slot.disabled .slot-remain { color: #c0c4cc; }
.slot.active { border-color: #409eff; background: #ecf5ff; }
.slot.mine { border-color: #e6a23c; }
.slot-mine-tag { position: absolute; top: -8px; right: -4px; background: #e6a23c; color: #fff; font-size: 10px; padding: 0 4px; border-radius: 4px; }
.seats { display: inline-block; }
.seat-row { display: flex; gap: 8px; margin-bottom: 8px; }
.seat { width: 40px; height: 40px; line-height: 40px; text-align: center; border: 1px solid #dcdfe6;
  border-radius: 6px; cursor: pointer; font-size: 13px; transition: all .2s; }
.seat:hover:not(.taken) { border-color: #409eff; }
.seat.taken { background: #f0f2f5; color: #c0c4cc; cursor: not-allowed; }
.seat.active { background: #409eff; color: #fff; border-color: #409eff; }
.legend { margin-top: 8px; display: flex; gap: 18px; font-size: 12px; color: #909399; }
.legend .box { display: inline-block; width: 14px; height: 14px; border: 1px solid #dcdfe6; border-radius: 3px; vertical-align: middle; margin-right: 4px; }
.legend .box.taken { background: #f0f2f5; }
.legend .box.active { background: #409eff; }
.submit-bar { margin-top: 20px; display: flex; align-items: center; gap: 20px; }
.summary { color: #606266; font-size: 14px; }
</style>
