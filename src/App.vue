<script setup lang="ts">
// App.vue 作为根组件，只需要渲染路由视图
import { onMounted } from 'vue'
import { useAuthStore } from './store/auth'

// 在应用加载时初始化认证状态
onMounted(() => {
  const authStore = useAuthStore()
  authStore.initAuth()
})
</script>

<template>
  <router-view />
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
  background-color: #f0f2f5;
  overflow: hidden;
}

#app {
  height: 100vh;
  width: 100vw;
  min-width: 320px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Element Plus 样式覆盖 */
.el-container {
  height: 100%;
  width: 100%;
}

.el-menu-vertical {
  height: 100%;
  background-color: #304156;
  border-right: none !important;
  width: 100%;
}

.el-menu-vertical .el-menu-item {
  color: #e0e6ed;
  height: 56px;
  line-height: 56px;
  font-size: 14px;
}

.el-menu-vertical .el-menu-item:hover {
  color: #ffffff;
  background-color: #263445 !important;
}

.el-menu-vertical .el-menu-item.is-active {
  color: #409EFF;
  background-color: #263445 !important;
}

.el-menu-vertical .el-menu-item .el-icon {
  margin-right: 16px;
  font-size: 18px;
  vertical-align: middle;
}

.el-card {
  border-radius: 4px;
  border: none;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08) !important;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.el-card__body {
  flex: 1;
  overflow: auto;
  height: 100%;
}

.el-card__header {
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
  font-weight: 600;
  flex-shrink: 0;
}

.el-form-item {
  margin-bottom: 22px;
}

.el-button {
  padding: 8px 20px;
  font-weight: 500;
}

.el-input__wrapper,
.el-select__wrapper {
  box-shadow: 0 0 0 1px #dcdfe6 inset !important;
}

.el-input__wrapper:hover,
.el-select__wrapper:hover {
  box-shadow: 0 0 0 1px #c0c4cc inset !important;
}

.el-input__wrapper:focus-within,
.el-select__wrapper:focus-within {
  box-shadow: 0 0 0 1px #409eff inset !important;
}
</style>
