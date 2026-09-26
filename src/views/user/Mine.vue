<script setup>
// 个人中心外壳：左侧功能菜单 + 右侧子页面（资料/预约/帖子/收藏/反馈）
</script>

<template>
  <el-row :gutter="20">
    <el-col :span="5">
      <el-menu :default-active="$route.path" router class="side">
        <el-menu-item index="/mine/profile"><el-icon><User /></el-icon>个人资料</el-menu-item>
        <el-menu-item index="/mine/reservations"><el-icon><Calendar /></el-icon>预约管理</el-menu-item>
        <el-menu-item index="/mine/posts"><el-icon><ChatDotSquare /></el-icon>我的帖子</el-menu-item>
        <el-menu-item index="/mine/favorites"><el-icon><Star /></el-icon>我的收藏</el-menu-item>
        <el-menu-item index="/mine/feedback"><el-icon><EditPen /></el-icon>意见反馈</el-menu-item>
      </el-menu>
    </el-col>
    <el-col :span="19">
      <router-view />
    </el-col>
  </el-row>
</template>

<style scoped>
.side { border-radius: 8px; overflow: hidden; }
</style>
