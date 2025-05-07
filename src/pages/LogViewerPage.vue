<template>
  <div class="log-viewer-container">
    <el-row :gutter="24" class="full-height">
      <el-col :span="24" class="full-height">
        <el-card class="log-panel">
          <template #header>
            <div class="card-header">
              <span class="title">日志文件查看器</span>
              <span v-if="currentFileName" class="file-name">{{ currentFileName }}</span>
            </div>
          </template>

          <!-- 添加模型日志选择区域 -->
          <div class="model-log-selector">
            <el-select 
              v-model="selectedModelId" 
              class="model-select"
              placeholder="选择要查看的模型" 
              size="default"
            >
              <el-option
                v-for="model in modelList"
                :key="model.id"
                :label="model.name"
                :value="model.id"
              />
            </el-select>
            <el-button 
              type="primary" 
              @click="fetchModelLog" 
              :loading="isLoadingLog"
              :disabled="!selectedModelId"
            >
              获取训练日志
            </el-button>
          </div>

          <el-divider>或者</el-divider>

          <el-empty v-if="!logContent" description="请选择 .log 文件进行查看">
            <el-upload
              class="log-uploader"
              action="#"
              :auto-upload="false"
              :on-change="handleFileChange"
              :show-file-list="false"
              accept=".log"
            >
              <el-button type="primary">选择日志文件</el-button>
            </el-upload>
          </el-empty>

          <div v-else class="log-content-wrapper">
            <div class="log-toolbar">
              <el-button @click="clearLog" type="danger" size="small">清除内容</el-button>
              <el-button @click="downloadLog" type="success" size="small">下载日志</el-button>
              <el-upload
                class="log-uploader-inline"
                action="#"
                :auto-upload="false"
                :on-change="handleFileChange"
                :show-file-list="false"
                accept=".log"
              >
                <el-button type="primary" size="small">更换文件</el-button>
              </el-upload>

              <div class="toolbar-right">
                <el-input
                  v-model="searchText"
                  placeholder="搜索内容"
                  class="search-input"
                  size="small"
                  clearable
                  @clear="clearSearch"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                  <template #append>
                    <el-button @click="findNext" :disabled="!searchText">
                      <el-icon><ArrowDown /></el-icon>
                    </el-button>
                    <el-button @click="findPrev" :disabled="!searchText">
                      <el-icon><ArrowUp /></el-icon>
                    </el-button>
                  </template>
                </el-input>

                <div class="font-size-controls">
                  <el-tooltip content="减小字体" placement="top">
                    <el-button @click="decreaseFontSize" circle size="small">
                      <el-icon><Minus /></el-icon>
                    </el-button>
                  </el-tooltip>
                  <span class="font-size-value">{{ fontSize }}px</span>
                  <el-tooltip content="增大字体" placement="top">
                    <el-button @click="increaseFontSize" circle size="small">
                      <el-icon><Plus /></el-icon>
                    </el-button>
                  </el-tooltip>
                </div>

                <el-switch
                  v-model="showLineNumbers"
                  active-text="显示行号"
                  inactive-text="隐藏行号"
                  class="line-number-switch"
                />
              </div>
            </div>

            <div class="log-content-container" ref="logContainerRef">
              <div class="log-content" :style="{ fontSize: fontSize + 'px' }">
                <div
                  v-for="(line, index) in formattedLogLines"
                  :key="index"
                  class="log-line"
                  :class="{ 'highlighted-line': highlightedLines.includes(index) }"
                  :id="`log-line-${index}`"
                >
                  <span v-if="showLineNumbers" class="line-number">{{ index + 1 }}</span>
                  <span class="line-content" v-html="line"></span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import { Search, ArrowDown, ArrowUp, Minus, Plus } from '@element-plus/icons-vue'
import { getModelsWithTrainingLogs, getModelTrainingLog, type Model } from '../services/api'

// 状态
const logContent = ref<string>('')
const currentFileName = ref<string>('')
const logContainerRef = ref<HTMLElement | null>(null)
const lineNumbersRef = ref<HTMLElement | null>(null)
const showLineNumbers = ref<boolean>(true)
const fontSize = ref<number>(14)
const searchText = ref<string>('')
const highlightedLines = ref<number[]>([])
const currentSearchIndex = ref<number>(-1)

// 模型相关状态
const modelList = ref<Model[]>([])
const selectedModelId = ref<number | string>('')
const isLoadingLog = ref<boolean>(false)

// 共用的日志处理函数
const processLogContent = (content: string, filename: string) => {
  let actualLogContent = content; // 默认为原始输入

  // 尝试将整个输入解析为 JSON
  try {
    const jsonObj = JSON.parse(content);
    // 如果解析成功且存在 log_content 字符串，则使用它
    if (jsonObj && typeof jsonObj.log_content === 'string') {
      actualLogContent = jsonObj.log_content;
    }
    // 如果解析成功但没有 log_content，则 actualLogContent 保持为原始 content
  } catch (e) {
    // 解析失败，说明不是JSON格式，actualLogContent 保持为原始 content
  }

  // --- 接下来的处理都针对 actualLogContent ---

  // 处理 ANSI 序列 (\u001b 等)
  try {
      actualLogContent = actualLogContent.replace(/\\u001b/g, '\u001b')
        .replace(/\\u001B/g, '\u001b')
        .replace(/\\x1b/g, '\u001b')
        .replace(/\\x1B/g, '\u001b')
        .replace(/\\e/g, '\u001b');
  } catch (ansiError) {
      console.error("处理ANSI转义序列时出错:", ansiError);
  }

  // 处理 通用 Unicode 序列 (\uXXXX)
  try {
      if (actualLogContent.includes('\\u')) {
         // 优先使用JSON.parse处理Unicode转义
         try {
             // 将字符串包装在引号中以创建有效的JSON字符串文字
             actualLogContent = JSON.parse(`"${actualLogContent.replace(/"/g, '\\"')}"`);
         } catch (jsonParseError) {
             console.warn("使用JSON.parse解码Unicode失败，回退到正则表达式:", jsonParseError);
             // 如果JSON.parse失败（例如，格式错误的转义），使用正则表达式作为后备
             actualLogContent = actualLogContent.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
                 String.fromCodePoint(parseInt(hex, 16))
             );
         }
      }
  } catch (unicodeError) {
      console.error("处理通用Unicode转义序列时出错:", unicodeError);
  }

  // 设置最终处理过的内容
  logContent.value = actualLogContent;
  currentFileName.value = filename;

  // 清除之前的搜索结果
  searchText.value = '';

  // 滚动到顶部
  nextTick(() => {
    if (logContainerRef.value) {
      logContainerRef.value.scrollTop = 0;
    }
  });
};

// 获取具有训练日志的模型列表
const fetchModelList = async () => {
  try {
    modelList.value = await getModelsWithTrainingLogs()
  } catch (error) {
    ElMessage.error('获取模型日志列表失败')
    console.error('获取模型日志列表失败:', error)
  }
}

// 获取所选模型的训练日志
const fetchModelLog = async () => {
  if (!selectedModelId.value) {
    ElMessage.warning('请先选择一个模型')
    return
  }

  isLoadingLog.value = true
  try {
    const logBlob = await getModelTrainingLog(selectedModelId.value)
    
    // 检查文件大小（限制为50MB）
    if (logBlob.size > 50 * 1024 * 1024) {
      ElMessage.error('日志文件大小不能超过50MB')
      isLoadingLog.value = false
      return
    }
    
    // 读取Blob内容
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result === 'string') {
        // 从模型列表中找到当前模型名称
        const selectedModel = modelList.value.find(model => model.id === selectedModelId.value)
        const filename = selectedModel ? `${selectedModel.name}_training.log` : 'model_training.log'
        
        // 使用共用函数处理日志内容
        processLogContent(result, filename)
      } else {
        ElMessage.error('日志读取失败')
      }
    }
    reader.onerror = () => {
      ElMessage.error('日志读取失败')
    }
    reader.readAsText(logBlob, 'utf-8')
  } catch (error) {
    ElMessage.error('获取模型训练日志失败')
    console.error('获取模型训练日志失败:', error)
  } finally {
    isLoadingLog.value = false
  }
}

// 页面加载时获取模型列表
onMounted(() => {
  fetchModelList()
})

// 字体大小调整
const increaseFontSize = () => {
  if (fontSize.value < 24) {
    fontSize.value += 1
  }
}

const decreaseFontSize = () => {
  if (fontSize.value > 10) {
    fontSize.value -= 1
  }
}

// 搜索功能
const findMatches = () => {
  if (!searchText.value) {
    highlightedLines.value = []
    currentSearchIndex.value = -1
    return
  }

  const searchRegex = new RegExp(searchText.value, 'gi')
  const matches: number[] = []

  formattedLogLines.value.forEach((line, index) => {
    // 创建一个没有HTML标签的纯文本版本进行搜索
    const plainText = line.replace(/<[^>]*>/g, '')
    if (searchRegex.test(plainText)) {
      matches.push(index)
    }
  })

  highlightedLines.value = matches
  if (matches.length > 0) {
    currentSearchIndex.value = 0
    scrollToLine(matches[0])
    ElMessage.success(`找到 ${matches.length} 个匹配项`)
  } else {
    currentSearchIndex.value = -1
    ElMessage.info('未找到匹配项')
  }
}

const findNext = () => {
  if (highlightedLines.value.length === 0) {
    findMatches() // 如果没有高亮行，先执行搜索
    if (highlightedLines.value.length === 0) return // 搜索后仍没有，则返回
  }

  if (currentSearchIndex.value < highlightedLines.value.length - 1) {
    currentSearchIndex.value++
  } else {
    currentSearchIndex.value = 0 // 回到第一个匹配项
  }

  scrollToLine(highlightedLines.value[currentSearchIndex.value])
}

const findPrev = () => {
   if (highlightedLines.value.length === 0) {
    findMatches() // 如果没有高亮行，先执行搜索
    if (highlightedLines.value.length === 0) return // 搜索后仍没有，则返回
  }

  if (currentSearchIndex.value > 0) {
    currentSearchIndex.value--
  } else {
    currentSearchIndex.value = highlightedLines.value.length - 1 // 到最后一个匹配项
  }

  scrollToLine(highlightedLines.value[currentSearchIndex.value])
}


const scrollToLine = (lineIndex: number) => {
  // 使用 nextTick 确保 DOM 更新完毕
  nextTick(() => {
      const element = document.getElementById(`log-line-${lineIndex}`)
      if (element && logContainerRef.value) {
          // 计算滚动位置，尽量让目标行居中
          const containerRect = logContainerRef.value.getBoundingClientRect();
          const elementRect = element.getBoundingClientRect();
          const offset = elementRect.top - containerRect.top - (containerRect.height / 2) + (elementRect.height / 2);
          
          logContainerRef.value.scrollTo({
              top: logContainerRef.value.scrollTop + offset,
              behavior: 'smooth'
          });

          // // 简单滚动到视图
          // element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
  });
}


const clearSearch = () => {
  highlightedLines.value = []
  currentSearchIndex.value = -1
  // 不需要清除 searchText.value，因为这是 @clear 事件触发的
}

// 监听搜索文本变化
watch(searchText, (newValue) => {
  // 文本变化时立即查找，或者可以改为按回车/按钮查找
  findMatches();
  // 如果需要输入时不清空高亮，注释掉下面这行
  // if (!newValue) {
  //   clearSearch()
  // }
})

// 处理 ANSI 转换为 HTML
const ansiToHtml = (text: string): string => {
  // 如果文本为空，返回一个非换行占位符
  if (!text) return '&nbsp;'
  
  // 基本的 ANSI 颜色代码映射到 CSS 类
  const ansiColorMap: Record<string, string> = {
    '30': 'color: #000000;', // 黑色
    '31': 'color: #ff0000;', // 红色
    '32': 'color: #00ff00;', // 绿色
    '33': 'color: #ffff00;', // 黄色
    '34': 'color: #0000ff;', // 蓝色
    '35': 'color: #ff00ff;', // 品红
    '36': 'color: #00ffff;', // 青色
    '37': 'color: #ffffff;', // 白色
    '40': 'background-color: #000000;', // 黑色背景
    '41': 'background-color: #ff0000;', // 红色背景
    '42': 'background-color: #00ff00;', // 绿色背景
    '43': 'background-color: #ffff00;', // 黄色背景
    '44': 'background-color: #0000ff;', // 蓝色背景
    '45': 'background-color: #ff00ff;', // 品红背景
    '46': 'background-color: #00ffff;', // 青色背景
    '47': 'background-color: #ffffff;', // 白色背景
    '90': 'color: #9e9e9e;', // 亮黑（灰色）
    '91': 'color: #f44336;', // 亮红
    '92': 'color: #4caf50;', // 亮绿
    '93': 'color: #ffeb3b;', // 亮黄
    '94': 'color: #2196f3;', // 亮蓝
    '95': 'color: #e91e63;', // 亮品红
    '96': 'color: #00bcd4;', // 亮青
    '97': 'color: #f5f5f5;', // 亮白
    '100': 'background-color: #9e9e9e;', // 亮黑（灰色）背景
    '101': 'background-color: #f44336;', // 亮红背景
    '102': 'background-color: #4caf50;', // 亮绿背景
    '103': 'background-color: #ffeb3b;', // 亮黄背景
    '104': 'background-color: #2196f3;', // 亮蓝背景
    '105': 'background-color: #e91e63;', // 亮品红背景
    '106': 'background-color: #00bcd4;', // 亮青背景
    '107': 'background-color: #f5f5f5;', // 亮白背景
    '1': 'font-weight: bold;', // 粗体
    '3': 'font-style: italic;', // 斜体
    '4': 'text-decoration: underline;', // 下划线
    '0': '' // 重置
  }

  // 替换HTML特殊字符
  text = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
    
  // 额外检查是否还有未转换的 Unicode 转义的 ANSI 序列
  text = text
    .replace(/\\u001b/g, '\u001b')
    .replace(/\\u001B/g, '\u001b')
    .replace(/\\x1b/g, '\u001b')
    .replace(/\\x1B/g, '\u001b')
    .replace(/\\e/g, '\u001b');

  // 处理常见的转义字符
  text = text
    .replace(/\\n/g, '\n') 
    .replace(/\\r/g, '\r') 
    .replace(/\\t/g, '\t') 
    .replace(/\\b/g, '\b') 
    .replace(/\\f/g, '\f');
  
  // 采用字符串构建的方式处理ANSI序列，而不是分割和重组
  let result = '';
  let plainText = '';
  let currentStyles: string[] = [];
  let inEscapeSeq = false;
  let escapeBuffer = '';
  
  // 以字符为单位处理每个字符，更精确地处理ANSI序列
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    // 处理ANSI转义序列开始
    if (char === '\u001b') {
      // 如果有普通文本缓存，先处理
      if (plainText) {
        // 如果有样式，包裹在span中
        if (currentStyles.length > 0) {
          result += `<span style="${currentStyles.join(';')}">${plainText}</span>`;
        } else {
          result += plainText;
        }
        plainText = '';
      }
      
      inEscapeSeq = true;
      escapeBuffer = char;
      continue;
    }
    
    // 收集转义序列
    if (inEscapeSeq) {
      escapeBuffer += char;
      
      // 检查是否是完整的ANSI颜色代码序列 (例如 \u001b[32m)
      const match = escapeBuffer.match(/^\u001b\[([0-9;]*)m$/);
      if (match) {
        // 处理样式代码
        const codes = match[1].split(';');
        
        for (const code of codes) {
          if (code === '0') {
            // 重置所有样式
            currentStyles = [];
          } else if (ansiColorMap[code]) {
            // 添加新样式，避免重复
            const newStyle = ansiColorMap[code];
            if (!currentStyles.includes(newStyle)) {
              currentStyles.push(newStyle);
            }
          }
        }
        
        // 重置转义序列状态
        inEscapeSeq = false;
        escapeBuffer = '';
      } else if (escapeBuffer.length > 10) {
        // 安全检查：如果序列太长但不匹配，可能是无效序列
        inEscapeSeq = false;
        plainText += escapeBuffer; // 作为普通文本处理
        escapeBuffer = '';
      }
      
      continue;
    }
    
    // 普通字符
    plainText += char;
  }
  
  // 处理最后的文本
  if (plainText) {
    if (currentStyles.length > 0) {
      result += `<span style="${currentStyles.join(';')}">${plainText}</span>`;
    } else {
      result += plainText;
    }
  }
  
  // 处理可能的剩余转义序列
  if (escapeBuffer) {
    result += escapeBuffer;
  }

  // 确保多行文本在HTML中正确显示
  result = result
    .replace(/\n/g, '<br>')
    .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');

  return result || '&nbsp;'; // 空行用&nbsp;占位
}


// 计算属性：格式化后的日志行
const formattedLogLines = computed(() => {
  if (!logContent.value) return []

  // 将日志内容按行分割
  const lines = logContent.value.split('\n')

  // 处理每一行的ANSI控制序列
  return lines.map(line => ansiToHtml(line))
})

// 处理文件上传
const handleFileChange = (file: UploadFile) => {
  if (file.raw) {
    // 检查文件类型
    if (!file.name.endsWith('.log')) {
      ElMessage.error('请上传 .log 文件')
      return
    }

    // 检查文件大小（限制为50MB）
    if (file.raw.size > 50 * 1024 * 1024) {
      ElMessage.error('日志文件大小不能超过50MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result === 'string') {
        // 使用共用函数处理日志内容
        processLogContent(result, file.name)
      } else {
        ElMessage.error('文件读取失败')
      }
    }
    reader.onerror = () => {
      ElMessage.error('文件读取失败')
    }
    reader.readAsText(file.raw, 'utf-8') // 尝试使用 UTF-8 读取
  }
}

// 清除日志内容
const clearLog = () => {
  logContent.value = ''
  currentFileName.value = ''
  searchText.value = ''
  // highlightedLines.value = [] // searchText 清空会触发 watch
  // currentSearchIndex.value = -1
}

// 下载日志
const downloadLog = () => {
  if (!logContent.value) {
    ElMessage.warning('没有可下载的日志内容')
    return
  }

  // 创建 Blob 和下载链接
  const blob = new Blob([logContent.value], { type: 'text/plain;charset=utf-8' }) // 指定UTF-8
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = currentFileName.value || 'downloaded_log.log'
  document.body.appendChild(a)
  a.click()

  // 清理
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 100)
}
</script>

<style scoped>
.log-viewer-container {
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
  background-color: #f5f7fa;
  /* display: flex; Removed */
  /* flex-direction: column; Removed */
}

.full-height {
  height: 100%;
  /* display: flex; Removed */
  /* flex-direction: column; Removed */
}

.log-panel {
  height: 100%; /* Reverted */
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  /* flex-grow: 1; Removed */
  /* overflow: hidden; Removed */
}

/* Reverted :deep(.el-card__body) */
:deep(.el-card__body) {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  padding: 20px; /* Reverted default */
  overflow-y: auto; /* Added back default overflow */
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

.file-name {
  font-size: 14px;
  color: #909399;
  margin-left: 12px;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 包裹编辑器和工具栏的容器 */
.log-content-wrapper {
  display: flex;
  flex-direction: column;
  flex-grow: 1; /* Reverted */
  height: 100%; /* Added back */
  overflow: hidden;
}

.log-toolbar {
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 10px;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  /* flex-shrink: 0; Removed */
}

.toolbar-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.search-input {
  width: 230px;
}

.font-size-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.font-size-value {
  width: 40px;
  text-align: center;
  font-size: 12px;
  color: #606266;
}

.line-number-switch {
  margin-left: 10px;
}

/* Log Content Container Styles (Restored) */
.log-content-container {
  flex: 1;
  display: flex;
  background-color: #1e1e1e;
  border-radius: 4px;
  overflow: auto; /* 滚动设置在整个容器上 */
}

.log-content {
  flex: 1;
  padding: 8px 0;
  color: #d4d4d4;
  font-family: 'Courier New', Courier, monospace;
  line-height: 1.5;
  white-space: pre; /* 保留空格并防止自动换行 */
  overflow-x: auto; /* 允许水平滚动 */
  width: 100%;
}

.log-line {
  min-height: 21px; /* 确保空行也有高度 */
  display: flex;
  align-items: flex-start;
  transition: background-color 0.2s;
  line-height: 1.5; /* 添加明确的行高 */
}

.line-number {
  display: inline-block;
  width: 50px; /* 固定宽度 */
  min-width: 50px; /* 确保不会收缩 */
  text-align: right;
  padding-right: 10px;
  margin-right: 10px;
  color: #858585;
  background-color: #252526;
  user-select: none;
  border-right: 1px solid #333;
}

.line-content {
  flex: 1;
  text-align: left;
}

.highlighted-line {
  background-color: rgba(255, 215, 0, 0.3);
  border-radius: 2px;
  outline: 1px solid rgba(255, 215, 0, 0.5);
}
/* End Restored Log Content Styles */

.log-uploader {
  display: inline-block;
  margin-top: 16px;
}

.log-uploader-inline {
  display: inline-block;
}

:deep(.el-empty) {
  /* flex-grow: 1; Removed */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%; /* Reverted */
}

/* Removed search highlight styles */

/* 响应式调整 */
@media (max-width: 768px) {
  .toolbar-right {
    width: 100%;
    margin-top: 10px;
    margin-left: 0;
    justify-content: flex-start; /* Reverted */
    /* justify-content: space-between; */
  }

  .search-input {
    /* flex-grow: 1; Removed */
    /* min-width: 150px; Removed */
     width: 100%; /* Reverted */
  }

   /* Removed panel/body padding changes */
   /* .log-panel { */
     /* padding: 10px; */
   /* } */
   /* :deep(.el-card__body) { */
     /* padding: 10px; */
   /* } */
   /* .log-toolbar { */
     /* padding-bottom: 10px; */
   /* } */
}

/* 添加模型选择器的样式 */
.model-log-selector {
  display: flex;
  margin-bottom: 15px;
  gap: 10px;
  align-items: center;
}

.model-select {
  min-width: 250px;
}
</style>