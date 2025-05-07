<template>
  <div class="inference-container">
    <el-row :gutter="24" class="full-height">
      <el-col :span="10" class="full-height">
        <el-card class="control-panel">
          <template #header>
            <div class="card-header">
              <span class="title">模型与图像选择</span>
            </div>
          </template>
          <el-form label-position="top">
            <el-form-item label="选择模型">
              <el-select
                v-model="selectedModelId"
                placeholder="请选择要使用的模型"
                :loading="loadingModels"
                class="full-width"
              >
                <el-option
                  v-for="model in availableModels"
                  :key="model.id"
                  :label="model.name"
                  :value="model.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="上传图片">
              <div class="upload-container">
                <el-upload
                  class="image-uploader"
                  action="#"
                  :auto-upload="false"
                  :on-change="handleFileChange"
                  :show-file-list="false"
                  accept="image/*"
                >
                  <template v-if="imageUrl">
                    <div class="preview-container">
                      <div class="image-wrapper" :class="{ 'small-image-wrapper': isSmallImage }">
                        <img 
                          :src="imageUrl" 
                          class="preview-image" 
                          ref="previewImage"
                        />
                      </div>
                      <div class="image-dimensions" v-if="imageDimensions">
                        {{ imageDimensions.width }} × {{ imageDimensions.height }} px
                      </div>
                    </div>
                    <div class="image-overlay">
                      <el-icon class="upload-icon"><RefreshRight /></el-icon>
                      <span>点击更换图片</span>
                    </div>
                  </template>
                  <template v-else>
                    <div class="empty-upload">
                      <el-icon class="upload-icon"><Plus /></el-icon>
                      <div class="upload-text">点击上传图片</div>
                    </div>
                  </template>
                </el-upload>
              </div>
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                @click="handlePredict"
                :loading="predicting"
                :disabled="!canPredict"
                class="predict-button"
              >
                {{ predicting ? '预测中...' : '开始预测' }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
      <el-col :span="14" class="full-height">
        <el-card class="result-panel">
          <template #header>
            <div class="card-header">
              <span class="title">预测结果</span>
              <el-tag v-if="selectedModel" type="info" class="model-tag">
                当前模型: {{ selectedModel?.name }}
              </el-tag>
            </div>
          </template>
          <el-skeleton v-if="predicting" :rows="5" animated />
          <el-empty
            v-else-if="!predictionResult"
            description="请选择模型并上传图片进行预测"
          />
          <div v-else class="prediction-results">
            <div
              v-for="(prediction, index) in predictionResult"
              :key="index"
              class="prediction-item"
              :class="{ 'top-prediction': index === 0 }"
            >
              <div class="prediction-header">
                <span class="label">{{ prediction.label }}</span>
                <span class="probability">{{ (prediction.probability * 100).toFixed(2) }}%</span>
              </div>
              <el-progress
                :percentage="Math.round(prediction.probability * 100)"
                :color="getProgressColor(prediction.probability)"
                :show-text="false"
                :stroke-width="12"
              />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Plus, RefreshRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import { getModels, postPrediction } from '../services/api'
import type { Model, Prediction } from '../services/api'

const selectedModelId = ref<string | number>('')
const imageUrl = ref<string>('')
const predicting = ref(false)
const loadingModels = ref(false)
const availableModels = ref<Model[]>([])
const predictionResult = ref<Prediction[] | null>(null)
const imageDimensions = ref<{ width: number, height: number } | null>(null)
const isSmallImage = ref(false)
const previewContainer = ref<HTMLElement | null>(null)
const previewImage = ref<HTMLImageElement | null>(null)

const selectedModel = computed(() => {
  return availableModels.value.find(model => model.id === selectedModelId.value)
})

const canPredict = computed(() => {
  return selectedModelId.value && imageUrl.value
})

const handleFileChange = (file: UploadFile) => {
  if (file.raw) {
    // 检查文件类型
    if (!file.raw.type.startsWith('image/')) {
      ElMessage.error('请上传图片文件')
      return
    }
    
    // 检查文件大小（限制为5MB）
    if (file.raw.size > 5 * 1024 * 1024) {
      ElMessage.error('图片大小不能超过5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      // 确保是base64格式的数据
      if (typeof result === 'string' && result.startsWith('data:image/')) {
        imageUrl.value = result
        
        // 获取图片尺寸
        const img = new Image()
        img.onload = () => {
          imageDimensions.value = {
            width: img.naturalWidth,
            height: img.naturalHeight
          }
          
          // 判断是否为超小尺寸图片（小于64px的任一边）
          if (img.naturalWidth < 64 || img.naturalHeight < 64) {
            isSmallImage.value = true
          } 
          // 判断是否为小尺寸图片（小于100px的任一边）
          else if (img.naturalWidth < 100 || img.naturalHeight < 100) {
            isSmallImage.value = true
          } else {
            isSmallImage.value = false
          }
        }
        img.src = result
      } else {
        ElMessage.error('图片格式不正确')
      }
    }
    reader.onerror = () => {
      ElMessage.error('图片读取失败')
    }
    reader.readAsDataURL(file.raw)
  }
}

const getProgressColor = (probability: number) => {
  if (probability >= 0.7) return '#67C23A'
  if (probability >= 0.4) return '#E6A23C'
  return '#F56C6C'
}

const handlePredict = async () => {
  if (!canPredict.value) return
  
  predicting.value = true
  predictionResult.value = null
  
  try {
    if (!imageUrl.value || !imageUrl.value.includes('base64,')) {
      throw new Error('图片数据格式不正确')
    }

    // 提取base64数据部分（去掉data:image/jpeg;base64,前缀）
    const base64Data = imageUrl.value.split('base64,')[1]
    if (!base64Data) {
      throw new Error('无法获取图片数据')
    }

    const predictions = await postPrediction(selectedModelId.value, base64Data)
    predictionResult.value = predictions
  } catch (error) {
    console.error('预测失败:', error)
    ElMessage.error(error instanceof Error ? error.message : '预测失败，请重试')
  } finally {
    predicting.value = false
  }
}

// 加载可用模型列表
const loadModels = async () => {
  loadingModels.value = true
  try {
    const models = await getModels()
    availableModels.value = models
  } catch (error) {
    console.error('加载模型列表失败:', error)
    ElMessage.error('加载模型列表失败')
  } finally {
    loadingModels.value = false
  }
}

// 监视图片的加载和尺寸变化
watch(() => imageUrl.value, () => {
  // 图片URL改变时，重置尺寸信息
  imageDimensions.value = null
  isSmallImage.value = false
})

loadModels()
</script>

<style scoped>
.inference-container {
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
  background-color: #f5f7fa;
}

.full-height {
  height: 100%;
}

.full-width {
  width: 100%;
}

.control-panel,
.result-panel {
  height: 100%;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.model-tag {
  margin-left: 12px;
}

.upload-container {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-bottom: 20px;
}

.image-uploader {
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  width: 100%;
  max-width: 300px;
  height: 300px;
  box-sizing: border-box;
}

.image-uploader:hover {
  border-color: #409EFF;
  background-color: rgba(64, 158, 255, 0.05);
}

/* 空状态下的上传提示样式 */
.empty-upload {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.upload-icon {
  font-size: 40px;
  color: #909399;
  margin-bottom: 15px;
}

.upload-text {
  font-size: 16px;
  color: #909399;
}

.image-uploader:hover .upload-icon,
.image-uploader:hover .upload-text {
  color: #409EFF;
}

/* 预览容器样式 */
.preview-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.image-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 15px;
  box-sizing: border-box;
}

.small-image-wrapper {
  background-color: #f5f7fa;
  border-radius: 8px;
}

.preview-image {
  display: block;
  max-width: 75%;
  max-height: 75%;
  object-fit: contain;
  transition: transform 0.2s ease;
}

.small-image-wrapper .preview-image {
  transform: scale(1.5);
  image-rendering: pixelated;
  transform-origin: center;
}

.image-dimensions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 4px 8px;
  font-size: 12px;
  text-align: center;
  z-index: 1;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 2;
}

.image-uploader:hover .image-overlay {
  opacity: 1;
}

.image-overlay .upload-icon {
  font-size: 36px;
  margin-bottom: 10px;
  color: #fff;
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));
}

.image-overlay span {
  font-size: 16px;
  font-weight: bold;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 6px 12px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
}

/* 添加一个微弱的呼吸动画效果 */
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.image-uploader:hover .image-overlay .upload-icon,
.image-uploader:hover .image-overlay span {
  animation: pulse 1.5s infinite;
}

@media (max-width: 768px) {
  .image-uploader {
    max-width: 100%;
    height: 250px;
  }
}

@media (max-width: 480px) {
  .image-uploader {
    height: 200px;
  }
}

.predict-button {
  width: 100%;
  margin-top: 20px;
  height: 40px;
  font-size: 16px;
}

.prediction-results {
  padding: 20px;
}

.prediction-item {
  margin-bottom: 24px;
  padding: 16px;
  border-radius: 8px;
  background-color: #f5f7fa;
  transition: all 0.3s;
}

.prediction-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.top-prediction {
  background-color: #ecf5ff;
  border: 1px solid #d9ecff;
}

.prediction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.prediction-header .label {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.prediction-header .probability {
  font-size: 14px;
  color: #909399;
}

:deep(.el-form-item__label) {
  font-weight: bold;
  color: #606266;
}

:deep(.el-progress-bar__outer) {
  border-radius: 4px;
  background-color: #e9ecef;
}

:deep(.el-progress-bar__inner) {
  border-radius: 4px;
  transition: all 0.3s ease;
}
</style> 