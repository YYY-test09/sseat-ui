<script setup>
// 用户端布局：顶部导航 + 内容区
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useUserStore } from '../store/user'

const router = useRouter()
const store = useUserStore()

function logout() {
  ElMessageBox.confirm('确定退出登录吗？', '提示', { type: 'warning' }).then(() => {
    store.logout()
    router.push('/login')
  }).catch(() => {})
}
</script>

<template>
  <div>
    <div class="header">
      <div class="header-inner">
        <div class="logo" @click="router.push('/')">📚 简座</div>
        <el-menu mode="horizontal" :default-active="$route.path" router :ellipsis="false" class="nav">
          <el-menu-item index="/">自习室</el-menu-item>
          <el-menu-item index="/forum">论坛</el-menu-item>
          <el-menu-item index="/news">系统资讯</el-menu-item>
        </el-menu>
        <div class="user-area">
          <template v-if="store.user">
            <el-dropdown>
              <span class="user-name">
                <el-avatar :size="28" :src="store.user.avatar || undefined">
                  {{ (store.user.nickname || store.user.username)[0] }}
                </el-avatar>
                <span style="margin-left:6px">{{ store.user.nickname || store.user.username }}</span>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="router.push('/mine/profile')">个人中心</el-dropdown-item>
                  <el-dropdown-item @click="router.push('/mine/reservations')">我的预约</el-dropdown-item>
                  <el-dropdown-item @click="router.push('/mine/favorites')">我的收藏</el-dropdown-item>
                  <el-dropdown-item divided @click="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <el-button text @click="router.push('/login')">登录</el-button>
            <el-button type="primary" round @click="router.push('/register')">注册</el-button>
          </template>
        </div>
      </div>
    </div>

    <div class="page-container">
      <!-- 用户端各页面渲染在这里 -->
      <router-view />
    </div>
  </div>
</template>

<style scoped>
.header { background: #fff; box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08); position: sticky; top: 0; z-index: 10; }
.header-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; height: 60px; }
.logo { font-size: 18px; font-weight: 700; color: #409eff; cursor: pointer; white-space: nowrap; margin-right: 24px; }
.nav { flex: 1; border-bottom: none !important; }
/* 去掉菜单项聚焦时闪烁的文本光标与虚线外框（纯视觉修正） */
.nav :deep(.el-menu-item) { user-select: none; caret-color: transparent; }
.nav :deep(.el-menu-item:focus), .nav :deep(.el-menu-item:active) { outline: none; }
.user-area { display: flex; align-items: center; gap: 8px; }
.user-name { display: flex; align-items: center; cursor: pointer; outline: none; }
</style>
