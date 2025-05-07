import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '../layouts/DefaultLayout.vue'
import { useAuthStore } from '../store/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../pages/LoginPage.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      component: DefaultLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('../pages/HomePage.vue')
        },
        {
          path: '/inference',
          name: 'inference',
          component: () => import('../pages/InferencePage.vue')
        },
        {
          path: '/performance',
          name: 'performance',
          component: () => import('../pages/PerformancePage.vue')
        },
        {
          path: '/sec-aggregation',
          name: 'secAggregation',
          component: () => import('../pages/SecAggregationPage.vue')
        },
        {
          path: '/log-viewer',
          name: 'logViewer',
          component: () => import('../pages/LogViewerPage.vue')
        }
      ]
    }
  ]
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  // 初始化身份验证状态（从localStorage恢复会话）
  if (!authStore.isAuthenticated) {
    authStore.initAuth()
  }

  // 如果需要身份验证但用户未登录，则重定向到登录页面
  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login' })
  } else {
    // 如果用户已登录且尝试访问登录页面，重定向到首页
    if (to.name === 'login' && authStore.isAuthenticated) {
      next({ name: 'home' })
    } else {
      next()
    }
  }
})

export default router 