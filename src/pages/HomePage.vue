<template>
  <div class="home-container">
    <el-card class="home-card">
      <template #header>
        <div class="card-header">
          <h1>欢迎使用联邦学习图像识别效果评估平台</h1>
        </div>
      </template>
      <div class="card-content">
        <p class="description">
          本平台用于加载和可视化展示预训练联邦学习模型的图像识别效果。您可以：
        </p>
        <ul class="feature-list">
          <li>
            <el-icon><PictureFilled /></el-icon>
            <span>在"模型预测"页面上传图片进行单张图片的预测</span>
          </li>
          <li>
            <el-icon><DataLine /></el-icon>
            <span>在"性能分析"页面查看模型训练过程的准确率和损失变化</span>
          </li>
          <li>
            <el-icon><Lock /></el-icon>
            <span>在"安全聚合"页面配置和监控联邦学习的安全聚合过程</span>
          </li>
          <li>
            <el-icon><Document /></el-icon>
            <span>在"日志查看器"页面加载并查看系统日志文件，支持ANSI颜色展示</span>
          </li>
        </ul>
        <div class="action-buttons">
          <el-button type="primary" size="large" @click="$router.push('/inference')">
            开始预测
          </el-button>
          <el-button size="large" @click="$router.push('/performance')">
            查看性能
          </el-button>
          <el-button size="large" @click="$router.push('/log-viewer')">
            查看日志
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { PictureFilled, DataLine, Lock, Document } from '@element-plus/icons-vue'
</script>

<style scoped>
.home-container {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
  box-sizing: border-box;
}

.home-card {
  max-width: 900px;
  margin: 20px auto;
  height: auto;
  min-height: calc(100% - 40px);
}

.card-header {
  text-align: center;
}

.card-header h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
  font-weight: 600;
}

.card-content {
  padding: 30px 40px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.description {
  font-size: 16px;
  color: #606266;
  margin-bottom: 30px;
  text-align: center;
  line-height: 1.6;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 30px auto;
  max-width: 600px;
  flex: 1;
}

.feature-list li {
  display: flex;
  align-items: center;
  margin: 20px 0;
  padding: 15px 20px;
  background-color: #f8f9fa;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.feature-list li:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.feature-list .el-icon {
  margin-right: 15px;
  font-size: 24px;
  color: #409EFF;
}

.feature-list span {
  font-size: 16px;
  color: #606266;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 40px;
  padding-bottom: 20px;
}

.action-buttons .el-button {
  min-width: 120px;
  font-size: 16px;
}
</style> 