<script setup>
// 管理端布局：左侧菜单（按角色 menus 字段过滤）+ 顶部条 + 内容区
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useUserStore } from '../store/user'

const router = useRouter()
const route = useRoute()
const store = useUserStore()

// 全部后台菜单；menus 字段里没有的 key 不显示（角色管理里可配置）
const allMenus = [
  { key: 'dashboard', path: '/admin/dashboard', title: '数据统计', icon: 'DataAnalysis' },
  { key: 'room', path: '/admin/rooms', title: '自习室座位管理', icon: 'School' },
  { key: 'reservation', path: '/admin/reservations', title: '预约管理', icon: 'Calendar' },
  { key: 'post', path: '/admin/posts', title: '论坛管理', icon: 'ChatDotSquare' },
  { key: 'feedback', path: '/admin/feedbacks', title: '反馈管理', icon: 'EditPen' },
  { key: 'news', path: '/admin/news', title: '资讯信息管理', icon: 'Bell' },
  { key: 'role', path: '/admin/roles', title: '角色管理', icon: 'Lock' },
  { key: 'user', path: '/admin/users', title: '用户信息管理', icon: 'User' }
]
const menus = allMenus.filter((m) => (store.user?.menus || '').split(',').includes(m.key))

// 当前页面标题 = 匹配到的菜单名
const currentTitle = () =>
  allMenus.find((m) => m.path === route.path)?.title || '管理后台'

function logout() {
  ElMessageBox.confirm('确定退出登录吗？', '提示', { type: 'warning' }).then(() => {
    store.logout()
    router.push('/admin/login')
  }).catch(() => {})
}
</script>

<template>
  <el-container class="admin-wrap">
    <el-aside width="210px" class="aside">
      <div class="logo">🛠 简座管理后台</div>
      <el-menu :default-active="route.path" router class="menu" background-color="#1f2d3d"
               text-color="#bfcbd9" active-text-color="#409eff">
        <el-menu-item v-for="m in menus" :key="m.key" :index="m.path">
          <el-icon><component :is="m.icon" /></el-icon>
          <span>{{ m.title }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <span class="title">{{ currentTitle() }}</span>
        <div class="right">
          <el-link class="front-link" @click="router.push('/')" :underline="false">前台首页</el-link>
          <el-dropdown>
            <span class="user-name">
              {{ store.user?.nickname || store.user?.username }}
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main">
        <!-- 管理端各页面渲染在这里 -->
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.admin-wrap { height: 100vh; }
.aside { background: #1f2d3d; }
.aside .logo { color: #fff; font-weight: 700; font-size: 15px; padding: 18px 16px; }
.aside .menu { border-right: none; }
.header { background: #fff; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08); }
.header .title { font-size: 16px; font-weight: 600; }
.header .right { display: flex; align-items: center; gap: 16px; }
.front-link { color: #409eff; }
.user-name { cursor: pointer; display: flex; align-items: center; gap: 2px; outline: none; }
.main { background: #f5f7fa; }
</style>
