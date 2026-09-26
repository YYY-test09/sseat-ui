import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../store/user'

// 路由表：/ 开头是用户端，/admin 开头是管理端
// meta.roles 表示允许访问的角色；meta.requiresLogin 表示必须登录
const routes = [
  // ---------- 公共：登录/注册 ----------
  { path: '/login', component: () => import('../views/Login.vue') },
  { path: '/register', component: () => import('../views/Register.vue') },

  // ---------- 用户端 ----------
  {
    path: '/',
    component: () => import('../layouts/UserLayout.vue'),
    children: [
      { path: '', name: 'home', component: () => import('../views/user/Home.vue') },
      { path: 'room/:id', component: () => import('../views/user/RoomDetail.vue') },
      { path: 'book', component: () => import('../views/user/Book.vue'), meta: { requiresLogin: true } },
      { path: 'news', component: () => import('../views/user/NewsList.vue') },
      { path: 'news/:id', component: () => import('../views/user/NewsDetail.vue') },
      { path: 'forum', component: () => import('../views/user/ForumList.vue') },
      { path: 'forum/:id', component: () => import('../views/user/PostDetail.vue') },
      { path: 'forum/post', component: () => import('../views/user/PostEdit.vue'), meta: { requiresLogin: true } },
      // 个人中心及其子页
      {
        path: 'mine',
        component: () => import('../views/user/Mine.vue'),
        meta: { requiresLogin: true },
        children: [
          { path: '', redirect: '/mine/profile' },
          { path: 'profile', component: () => import('../views/user/mine/Profile.vue') },
          { path: 'reservations', component: () => import('../views/user/mine/MyReservations.vue') },
          { path: 'posts', component: () => import('../views/user/mine/MyPosts.vue') },
          { path: 'favorites', component: () => import('../views/user/mine/MyFavorites.vue') },
          { path: 'feedback', component: () => import('../views/user/mine/MyFeedback.vue') }
        ]
      }
    ]
  },

  // ---------- 管理端登录页单独一个（带红色"管理"标识，方便区分） ----------
  { path: '/admin/login', component: () => import('../views/admin/AdminLogin.vue') },
  // ---------- 管理端 ----------
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    meta: { requiresLogin: true, roles: ['admin'] },
    children: [
      { path: '', redirect: '/admin/rooms' },
      { path: 'rooms', component: () => import('../views/admin/RoomManage.vue'), meta: { menu: 'room' } },
      { path: 'reservations', component: () => import('../views/admin/ReservationManage.vue'), meta: { menu: 'reservation' } },
      { path: 'posts', component: () => import('../views/admin/PostManage.vue'), meta: { menu: 'post' } },
      { path: 'feedbacks', component: () => import('../views/admin/FeedbackManage.vue'), meta: { menu: 'feedback' } },
      { path: 'news', component: () => import('../views/admin/NewsManage.vue'), meta: { menu: 'news' } },
      { path: 'roles', component: () => import('../views/admin/RoleManage.vue'), meta: { menu: 'role' } },
      { path: 'users', component: () => import('../views/admin/UserManage.vue'), meta: { menu: 'user' } }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局前置守卫：进入页面之前检查登录状态与角色
router.beforeEach((to) => {
  const store = useUserStore()
  // 整条路径上任意一级带 requiresLogin 都需要登录
  const needLogin = to.matched.some((r) => r.meta.requiresLogin)
  if (needLogin && !store.token) {
    return to.path.startsWith('/admin') ? '/admin/login' : '/login'
  }
  const needRoles = to.matched.flatMap((r) => r.meta.roles || [])
  if (needRoles.length && !needRoles.includes(store.user?.roleCode)) {
    // 角色不对：普通用户访问 /admin 一律踢回管理端登录页
    return '/admin/login'
  }
})

export default router
