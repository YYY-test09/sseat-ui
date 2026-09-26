<script setup>
// 管理端-数据统计仪表盘：数字卡片 + ECharts 折线/柱状/饼图
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getAdminStats } from '../../api/stats'

const stats = ref(null)
const trendEl = ref(null)
const rankEl = ref(null)
const pieEl = ref(null)
let charts = []

// 顶部8张数字卡片配置：取值字段、标签、颜色
const CARDS = [
  { k: 'userCount', label: '注册用户', color: '#409eff' },
  { k: 'roomCount', label: '开放自习室', color: '#67c23a' },
  { k: 'reservationCount', label: '累计预约', color: '#e6a23c' },
  { k: 'todayCount', label: '今日预约', color: '#409eff' },
  { k: 'activeCount', label: '进行中预约', color: '#909399' },
  { k: 'postCount', label: '已通过帖子', color: '#67c23a' },
  { k: 'pendingPosts', label: '待审核帖子', color: '#f56c6c' },
  { k: 'pendingFeedbacks', label: '待回复反馈', color: '#f56c6c' }
]

function mkChart(el, option) {
  const c = echarts.init(el)
  c.setOption(option)
  charts.push(c)
}

function render(data) {
  // 折线图：近7天预约量
  mkChart(trendEl.value, {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: data.trendDays, boundaryGap: false },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{
      name: '预约量', type: 'line', smooth: true, areaStyle: { opacity: 0.15 },
      itemStyle: { color: '#409eff' }, data: data.trendCounts
    }]
  })
  // 柱状图：自习室预约排行
  const rank = data.roomRank || []
  mkChart(rankEl.value, {
    tooltip: { trigger: 'axis' },
    grid: { left: 10, right: 20, top: 30, bottom: 10, containLabel: true },
    xAxis: { type: 'value', minInterval: 1 },
    yAxis: { type: 'category', data: rank.map(r => r.name).reverse(),
             axisLabel: { width: 120, overflow: 'truncate' } },
    series: [{
      name: '预约次数', type: 'bar', barWidth: 14, itemStyle: { color: '#67c23a', borderRadius: 7 },
      data: rank.map(r => r.count).reverse()
    }]
  })
  // 饼图：预约状态分布
  mkChart(pieEl.value, {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie', radius: ['40%', '65%'], center: ['50%', '45%'],
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { formatter: '{b}\n{d}%' },
      data: (data.statusDist || []).map((d, i) => ({
        ...d, itemStyle: { color: ['#e6a23c', '#67c23a', '#909399', '#f56c6c'][i % 4] }
      }))
    }]
  })
}

function onResize() { charts.forEach(c => c.resize()) }

onMounted(async () => {
  const data = await getAdminStats()
  stats.value = data
  await nextTick()   // 等卡片/图表容器渲染出来再 init echarts
  render(data)
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  charts.forEach(c => c.dispose())
  charts = []
})
</script>

<template>
  <div v-if="stats">
    <el-row :gutter="14">
      <el-col :span="6" v-for="c in CARDS" :key="c.k">
        <el-card shadow="hover" class="num-card">
          <div class="num" :style="{ color: c.color }">{{ stats.cards[c.k] ?? 0 }}</div>
          <div class="label">{{ c.label }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="14" style="margin-top:14px">
      <el-col :span="24">
        <el-card><template #header>未来 7 天预约量趋势</template>
          <div ref="trendEl" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="14" style="margin-top:14px">
      <el-col :span="14">
        <el-card><template #header>自习室预约排行（未来 7 天）</template>
          <div ref="rankEl" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card><template #header>预约状态分布</template>
          <div ref="pieEl" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
  <el-skeleton v-else :rows="6" animated />
</template>

<style scoped>
.num-card { text-align: center; }
.num-card .num { font-size: 28px; font-weight: 700; }
.num-card .label { color: #909399; font-size: 13px; margin-top: 4px; }
.chart { height: 300px; }
</style>
