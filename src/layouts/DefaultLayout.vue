<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="aside">
      <div class="logo">
        <h1>{{ isCollapse ? 'FL' : '联邦学习平台' }}</h1>
      </div>
      <el-menu
        :default-active="$route.path"
        router
        class="el-menu-vertical"
        :collapse="isCollapse"
      >
        <el-menu-item index="/">
          <el-icon><HomeFilled /></el-icon>
          <template #title>首页</template>
        </el-menu-item>
        <el-menu-item index="/inference">
          <el-icon><PictureFilled /></el-icon>
          <template #title>模型预测</template>
        </el-menu-item>
        <el-menu-item index="/performance">
          <el-icon><DataLine /></el-icon>
          <template #title>性能分析</template>
        </el-menu-item>
        <el-menu-item index="/sec-aggregation">
          <el-icon><Lock /></el-icon>
          <template #title>安全聚合</template>
        </el-menu-item>
        <el-menu-item index="/log-viewer">
          <el-icon><Document /></el-icon>
          <template #title>日志查看器</template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container class="main-container">
      <el-header height="60px" class="header">
        <div class="header-left">
          <el-button type="text" @click="toggleCollapse">
            <el-icon :size="20">
              <component :is="isCollapse ? 'Expand' : 'Fold'" />
            </el-icon>
          </el-button>
          <h2>联邦学习图像识别效果评估平台</h2>
        </div>
        <div class="header-right">
          <el-dropdown trigger="click" @command="handleCommand">
            <div class="user-info">
              <el-avatar size="small" icon="User" />
              <span class="username">{{ authStore.user?.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { HomeFilled, PictureFilled, DataLine, Lock, Expand, Fold, Document, User, ArrowDown } from '@element-plus/icons-vue'
import { useAuthStore } from '../store/auth'
import { ElMessageBox } from 'element-plus'

const authStore = useAuthStore()
const isCollapse = ref(window.innerWidth < 768)

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const handleCommand = (command: string) => {
  if (command === 'logout') {
    ElMessageBox.confirm(
      '确定要退出登录吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    ).then(() => {
      authStore.logout()
    }).catch(() => {})
  }
}

// 监听窗口大小变化
window.addEventListener('resize', () => {
  if (window.innerWidth < 768) {
    isCollapse.value = true
  }
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
}

.aside {
  background-color: #304156;
  box-shadow: 2px 0 6px rgba(0, 21, 41, 0.35);
  z-index: 10;
  display: flex;
  flex-direction: column;
  transition: width 0.3s;
  height: 100%;
}

.logo {
  height: 60px;
  text-align: center;
  border-bottom: 1px solid #1f2d3d;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.logo h1 {
  color: #fff;
  font-size: 16px;
  margin: 0;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}

.main-container {
  background-color: #f0f2f5;
  position: relative;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 9;
  flex-shrink: 0;
  width: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0 8px;
  height: 40px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.username {
  margin: 0 8px;
  font-size: 14px;
  color: #606266;
}

.header h2 {
  margin: 0;
  font-size: clamp(14px, 2.5vw, 18px);
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.main-content {
  padding: clamp(10px, 2vw, 20px);
  overflow: auto;
  flex: 1;
  box-sizing: border-box;
  height: calc(100vh - 60px);
  width: 100%;
}

.el-menu-vertical:not(.el-menu--collapse) {
  width: 220px;
  height: calc(100% - 60px);
}

:deep(.el-menu--collapse) {
  width: 64px;
}

@media (max-width: 768px) {
  .header h2 {
    font-size: 16px;
  }
  
  .main-content {
    padding: 10px;
  }
  
  .username {
    display: none;
  }
}

@media (max-width: 480px) {
  .header h2 {
    font-size: 14px;
  }
}
</style> 