<template>
  <div class="performance-container">
    <el-card class="data-source-card">
      <template #header>
        <div class="card-header">
          <span>数据源选择</span>
        </div>
      </template>
      <el-form :inline="true">
        <el-form-item>
          <el-upload
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            accept=".json"
            @change="(file: UploadFile) => handleHistoryFileChange(file, 'model1')"
          >
            <el-button type="primary">
              上传模型1训练历史 (.json)
            </el-button>
          </el-upload>
        </el-form-item>
        <el-form-item>
          <el-upload
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            accept=".json"
            @change="(file: UploadFile) => handleHistoryFileChange(file, 'model2')"
          >
            <el-button type="success">
              上传模型2训练历史 (.json)
            </el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      
      <!-- 添加模型选择下拉菜单和下载按钮 -->
      <el-form :inline="true" class="model-selection-form">
        <el-form-item label="模型1选择">
          <el-select v-model="selectedModel1" placeholder="选择模型1" filterable clearable>
            <el-option
              v-for="model in availableModels"
              :key="model.id"
              :label="model.name"
              :value="model.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :disabled="!selectedModel1 || isLoading" @click="downloadModelHistory('model1')" :loading="isLoading">
            获取模型1历史
          </el-button>
        </el-form-item>
      </el-form>
      
      <el-form :inline="true" class="model-selection-form">
        <el-form-item label="模型2选择">
          <el-select v-model="selectedModel2" placeholder="选择模型2" filterable clearable>
            <el-option
              v-for="model in availableModels"
              :key="model.id"
              :label="model.name"
              :value="model.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="success" :disabled="!selectedModel2 || isLoading" @click="downloadModelHistory('model2')" :loading="isLoading">
            获取模型2历史
          </el-button>
        </el-form-item>
      </el-form>
      
      <el-form :inline="true" class="model-info-form" v-if="model1Data || model2Data">
        <el-form-item label="模型1名称" v-if="model1Data">
          <el-input v-model="model1Name" placeholder="输入模型1名称"></el-input>
        </el-form-item>
        <el-form-item label="模型2名称" v-if="model2Data">
          <el-input v-model="model2Name" placeholder="输入模型2名称"></el-input>
        </el-form-item>
      </el-form>
      <el-form :inline="true" class="display-mode-form">
        <el-form-item label="显示模式">
          <el-radio-group v-model="displayMode">
            <el-radio-button label="both">对比显示</el-radio-button>
            <el-radio-button label="model1" :disabled="!model1Data">仅模型1</el-radio-button>
            <el-radio-button label="model2" :disabled="!model2Data">仅模型2</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="charts-card">
      <template #header>
        <div class="card-header">
          <span>训练过程可视化</span>
        </div>
      </template>
      <el-empty
        v-if="!model1Data && !model2Data"
        description="请上传训练历史文件"
      />
      <template v-else>
        <div class="training-info">
          <el-row :gutter="20">
            <el-col :span="12" v-if="model1Data && (displayMode === 'both' || displayMode === 'model1')">
              <el-alert
                :title="`${model1Name} 训练时间: ${model1Data.total_training_time || '未知'}`"
                type="info"
                :closable="false"
                effect="dark"
              />
              <div class="model-tag">
                <el-tag effect="dark" size="large">{{ model1Data.training_type === 'federated' ? '联邦学习' : '集中式学习' }}</el-tag>
                <el-tag type="warning" v-if="model1Data?.final?.test_acc" size="default">测试准确率: {{ (model1Data.final.test_acc * 100).toFixed(2) }}%</el-tag>
                <el-tag type="danger" v-if="model1Data?.final?.test_loss" size="default">测试损失: {{ model1Data.final.test_loss.toFixed(4) }}</el-tag>
              </div>
            </el-col>
            <el-col :span="12" v-if="model2Data && (displayMode === 'both' || displayMode === 'model2')">
              <el-alert
                :title="`${model2Name} 训练时间: ${model2Data.total_training_time || '未知'}`"
                type="success"
                :closable="false"
                effect="dark"
              />
              <div class="model-tag">
                <el-tag effect="dark" size="large" type="success">{{ model2Data.training_type === 'federated' ? '联邦学习' : '集中式学习' }}</el-tag>
                <el-tag type="warning" v-if="model2Data?.final?.test_acc" size="default">测试准确率: {{ (model2Data.final.test_acc * 100).toFixed(2) }}%</el-tag>
                <el-tag type="danger" v-if="model2Data?.final?.test_loss" size="default">测试损失: {{ model2Data.final.test_loss.toFixed(4) }}</el-tag>
              </div>
            </el-col>
          </el-row>
        </div>
        <el-row :gutter="20">
          <el-col :span="12">
            <v-chart class="chart" :option="accuracyChartOption" autoresize />
          </el-col>
          <el-col :span="12">
            <v-chart class="chart" :option="lossChartOption" autoresize />
          </el-col>
        </el-row>
      </template>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import VChart from 'vue-echarts'
import type { UploadFile } from 'element-plus'
import type { EChartsOption, SeriesOption } from 'echarts'
import { use } from 'echarts/core'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import { LineChart, ScatterChart } from 'echarts/charts'
import { UniversalTransition } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'
import { getModels, getTrainingHistory, type Model } from '../services/api'

use([
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  LineChart,
  ScatterChart,
  CanvasRenderer,
  UniversalTransition
])

// --- Types --- //

interface NewTrainingData {
  model_name: string
  [key: string]: any
  total_train_time?: string
  final?: {
    test_loss?: number
    test_acc?: number
  }
}

interface ProcessedTrainingData {
  rounds: number[]
  accuracies: number[]
  losses: number[]
  total_training_time: string
  training_type: 'federated' | 'centralized'
  model_name: string
  final?: {
    test_loss?: number
    test_acc?: number
  }
}

// --- State --- //

const model1Data = ref<ProcessedTrainingData | null>(null)
const model2Data = ref<ProcessedTrainingData | null>(null)
const model1Name = ref<string>('模型1')
const model2Name = ref<string>('模型2')
const displayMode = ref<'model1' | 'model2' | 'both'>('both')
const rawData1 = ref<string>('')
const rawData2 = ref<string>('')
const showRawData = ref<boolean>(false)
const activeTab = ref<string>('model1')
const selectedModel1 = ref<string | number | null>(null)
const selectedModel2 = ref<string | number | null>(null)
const availableModels = ref<Model[]>([])
const isLoading = ref<boolean>(false)

// --- Lifecycle Hooks --- //

onMounted(async () => {
  try {
    isLoading.value = true
    availableModels.value = await getModels()
    ElMessage.success('已获取可用模型列表')
  } catch (error) {
    console.error('获取模型列表失败:', error)
    ElMessage.error('获取模型列表失败')
  } finally {
    isLoading.value = false
  }
})

// --- Utility Functions --- //

const isFederatedModel = (data: ProcessedTrainingData | NewTrainingData): boolean => {
  if ('training_type' in data && data.training_type === 'federated') {
    return true;
  }
  if ('model_name' in data) {
    return data.model_name.toLowerCase().includes('fedavg') || 
           data.model_name.toLowerCase().includes('fed');
  }
  return false;
}

const processTrainingData = (data: NewTrainingData): ProcessedTrainingData => {
  const rounds: number[] = []
  const accuracies: number[] = []
  const losses: number[] = []
  
  Object.keys(data).forEach(key => {
    if (!isNaN(Number(key)) && typeof data[key] === 'object') {
      const round = Number(key)
      rounds.push(round)
      const roundData = data[key]
      
      if ('cen_accuracy' in roundData) accuracies.push(roundData.cen_accuracy)
      else if ('accuracy' in roundData) accuracies.push(roundData.accuracy)
      else if ('acc' in roundData) accuracies.push(roundData.acc)
      
      if ('loss' in roundData) losses.push(roundData.loss)
    }
  })
  
  const sortedIndices = rounds.map((_, i) => i).sort((a, b) => rounds[a] - rounds[b])
  const sortedRounds = sortedIndices.map(i => rounds[i])
  const sortedAccuracies = sortedIndices.map(i => accuracies[i])
  const sortedLosses = sortedIndices.map(i => losses[i])
  
  const trainingType = (isFederatedModel(data) ? 'federated' : 'centralized') as 'federated' | 'centralized';

  // Enhanced logging for final data
  console.log("--- processTrainingData --- START ---")
  console.log("Input Data model_name:", data.model_name);
  console.log("Input Data final field:", data.final);
  if (data.final) {
    console.log("Input Data test_acc:", data.final.test_acc, "(type:", typeof data.final.test_acc, ")");
    console.log("Input Data test_loss:", data.final.test_loss, "(type:", typeof data.final.test_loss, ")");
  }
  console.log("Determined training_type:", trainingType);
  
  const processed: ProcessedTrainingData = {
    rounds: sortedRounds,
    accuracies: sortedAccuracies,
    losses: sortedLosses,
    total_training_time: data.total_train_time || '未知',
    training_type: trainingType,
    model_name: data.model_name,
    final: data.final // Ensure final is passed through
  }
  console.log("Processed Data final field:", processed.final);
  console.log("--- processTrainingData --- END ---")
  return processed;
}

const validateNewHistoryData = (data: any): data is NewTrainingData => {
  if (typeof data.model_name !== 'string') return false
  
  let hasRoundData = false
  for (const key in data) {
    if (!isNaN(Number(key)) && typeof data[key] === 'object') {
      hasRoundData = true
      break
    }
  }
  return hasRoundData
}

// --- Chart Options --- //

const commonChartOptions: Partial<EChartsOption> = {
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
      label: {
        backgroundColor: '#6a7985'
      }
    }
  },
  legend: {
    bottom: 10,
    textStyle: {
      fontSize: 12
    },
    icon: 'circle',
    itemWidth: 10,
    itemHeight: 10,
    itemGap: 20
  },
  grid: {
    left: '8%',
    right: '8%',
    bottom: '18%',
    top: '90px',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    name: '轮次',
    nameTextStyle: {
      fontSize: 12,
      fontWeight: 'bold',
      padding: [10, 0, 0, 0]
    },
    axisLine: {
      lineStyle: {
        color: '#909399'
      }
    },
    axisTick: {
      alignWithLabel: true
    },
    axisLabel: {
      fontSize: 11,
      margin: 12
    }
  },
  yAxis: {
    type: 'value',
    axisLine: {
      show: true,
      lineStyle: {
        color: '#909399'
      }
    },
    splitLine: {
      lineStyle: {
        type: 'dashed'
      }
    },
    axisLabel: {
      fontSize: 11,
      margin: 12
    }
  }
}

const getTooltipFormatter = (unit: string = '', precision: number = 2) => {
  return (params: any): string => {
    let result = `<div style="font-weight:bold;margin-bottom:5px">第 ${params[0].axisValue} 轮</div>`;
    params.forEach((item: any) => {
      const isTestPoint = item.seriesType === 'scatter';
      const value = isTestPoint ? item.value[1] : item.value;
      if (typeof value === 'number') {
          result += `<div style="display:flex;align-items:center;margin:5px 0">
            <span style="display:inline-block;width:10px;height:10px;border-radius:${isTestPoint ? '0' : '50%'};
                  background:${item.color};margin-right:5px;
                  ${isTestPoint ? 'transform:rotate(45deg)' : ''}"></span>
            <span>${item.seriesName}: ${value.toFixed(precision)}${unit}</span>
          </div>`;
      } else {
          console.warn("Tooltip formatter encountered non-numeric value:", value, "for series:", item.seriesName);
      }
    });
    return result;
  }
}

const createSeriesForModel = (
  modelData: ProcessedTrainingData,
  modelName: string,
  color: string,
  symbol: string,
  dataType: 'accuracy' | 'loss'
): SeriesOption[] => {
  const series: SeriesOption[] = []
  const dataKey = dataType === 'accuracy' ? 'accuracies' : 'losses' 
  const testKey = dataType === 'accuracy' ? 'test_acc' : 'test_loss'
  const testColor = dataType === 'accuracy' ? '#E6A23C' : '#F56C6C'
  const unit = dataType === 'accuracy' ? '%' : ''
  const precision = dataType === 'accuracy' ? 2 : 4
  const dataValues = modelData[dataKey].map(v => dataType === 'accuracy' ? v * 100 : v) || [] 
  const trainName = `${modelName} 训练集` 

  // --- Restore Training Series --- 
  series.push({
    name: trainName,
    data: dataValues,
    type: 'line',
    smooth: true,
    symbol: symbol,
    symbolSize: 8,
    lineStyle: { width: 3 },
    itemStyle: { color: color, borderWidth: 2 },
    emphasis: {
      itemStyle: {
        borderWidth: 4,
        shadowBlur: 10,
        shadowColor: color + '80' // Add alpha
      }
    }
  })

  // 测试集系列
  console.log(`--- createSeriesForModel (${dataType}) --- START ---`);
  console.log(`Model: ${modelName}`);
  console.log("Received modelData.final:", modelData.final);
  const testValue = modelData.final?.[testKey];
  console.log(`Checking for testKey: ${testKey}`);
  console.log(`Value found for ${testKey}:`, testValue, "(type:", typeof testValue, ")");
  
  if (testValue !== undefined && testValue !== null && modelData.rounds && modelData.rounds.length > 0) {
    console.log(`>>> Condition met for ${testKey}. Rounds available. Creating test series.`);
    const testName = `${modelName} 测试集`
    const lastRound = Math.max(...modelData.rounds)
    const displayTestValue = dataType === 'accuracy' ? testValue * 100 : testValue
    
    // Find the index of the last round in the sorted rounds array
    const lastRoundIndex = modelData.rounds.indexOf(lastRound);
    
    // Check if index was found (should always be true if rounds is not empty)
    if (lastRoundIndex === -1) {
      console.error(`Error: lastRound (${lastRound}) not found in rounds array:`, modelData.rounds);
      console.log(`--- createSeriesForModel (${dataType}) --- END (Error finding index) ---`);
      return series; // Return only the line series if index not found
    }

    // Use the index for the scatter point's x-coordinate on category axis
    const scatterData = [[lastRoundIndex, displayTestValue]];

    console.log(`>>> Scatter Point Data (using index):`, JSON.stringify(scatterData), `(Index: ${lastRoundIndex}, Value: ${displayTestValue})`);
    console.log(`>>> X-Axis (Rounds) Data for context:`, JSON.stringify(modelData.rounds));

    // 测试集散点
    series.push({
      name: testName,
      type: 'scatter',
      symbolSize: 14,
      symbol: 'diamond',
      data: scatterData, // Use index-based data
      xAxisIndex: 0, // Explicitly link to the first xAxis
      yAxisIndex: 0, // Explicitly link to the first yAxis
      itemStyle: { color: testColor, borderColor: '#fff', borderWidth: 2 },
      emphasis: {
        itemStyle: { borderWidth: 3, shadowBlur: 10, shadowColor: testColor + '80' }
      },
      label: {
        show: true,
        position: 'top',
        formatter: `测试: ${displayTestValue.toFixed(precision)}${unit}`,
        backgroundColor: testColor,
        padding: [4, 8],
        borderRadius: 4,
        color: '#fff',
        fontSize: 12
      }
    })
  } else {
    let reason = "";
    if (testValue === undefined || testValue === null) reason += "Test value missing or null. "
    if (!modelData.rounds || modelData.rounds.length === 0) reason += "Rounds data is empty." 
    console.log(`>>> Condition NOT met for ${testKey}. ${reason}Skipping test series.`);
  }
  console.log(`--- createSeriesForModel (${dataType}) --- END ---`);
  return series
}

const accuracyChartOption = computed<EChartsOption>(() => {
  const series: SeriesOption[] = []
  const legendData: string[] = []
  
  if ((displayMode.value === 'both' || displayMode.value === 'model1') && model1Data.value) {
    const modelSeries = createSeriesForModel(model1Data.value, model1Name.value, '#409EFF', 'circle', 'accuracy')
    series.push(...modelSeries)
    legendData.push(...modelSeries.map(s => String(s.name || '')))
  }
  
  if ((displayMode.value === 'both' || displayMode.value === 'model2') && model2Data.value) {
    const modelSeries = createSeriesForModel(model2Data.value, model2Name.value, '#67C23A', 'triangle', 'accuracy')
    series.push(...modelSeries)
    legendData.push(...modelSeries.map(s => String(s.name || '')))
  }

  // Restore rounds calculation
  const rounds = model1Data.value?.rounds || model2Data.value?.rounds || []

  return {
    ...commonChartOptions,
    title: {
      text: '准确率变化对比', // Revert Title
      left: 'center',
      textStyle: { fontSize: 18, fontWeight: 'bold' },
      top: 10
    },
    tooltip: {
      ...commonChartOptions.tooltip,
      formatter: getTooltipFormatter('%', 2)
    },
    legend: {
      ...commonChartOptions.legend,
      data: legendData
    },
    xAxis: {
      ...commonChartOptions.xAxis as object,
      data: rounds, // Restore data property
      axisLabel: { // Restore rotate logic
        ...(commonChartOptions.xAxis as any)?.axisLabel,
        rotate: rounds.length > 10 ? 30 : 0 
      }
    },
    yAxis: {
      ...commonChartOptions.yAxis as object,
      name: '准确率',
      nameTextStyle: { fontSize: 12, fontWeight: 'bold', padding: [0, 0, 10, 0] },
      axisLabel: {
        ...(commonChartOptions.yAxis as any)?.axisLabel,
        formatter: '{value}%'
      }
    },
    series
  }
})

const lossChartOption = computed<EChartsOption>(() => {
  const series: SeriesOption[] = []
  const legendData: string[] = []
  
  if ((displayMode.value === 'both' || displayMode.value === 'model1') && model1Data.value) {
    const modelSeries = createSeriesForModel(model1Data.value, model1Name.value, '#409EFF', 'circle', 'loss')
    series.push(...modelSeries)
    legendData.push(...modelSeries.map(s => String(s.name || '')))
  }
  
  if ((displayMode.value === 'both' || displayMode.value === 'model2') && model2Data.value) {
    const modelSeries = createSeriesForModel(model2Data.value, model2Name.value, '#67C23A', 'triangle', 'loss')
    series.push(...modelSeries)
    legendData.push(...modelSeries.map(s => String(s.name || '')))
  }

  // Restore rounds calculation
  const rounds = model1Data.value?.rounds || model2Data.value?.rounds || []

  return {
    ...commonChartOptions,
    title: {
      text: '损失变化对比', // Revert Title
      left: 'center',
      textStyle: { fontSize: 18, fontWeight: 'bold' },
      top: 10
    },
    tooltip: {
      ...commonChartOptions.tooltip,
      formatter: getTooltipFormatter('', 4)
    },
    legend: {
      ...commonChartOptions.legend,
      data: legendData
    },
    xAxis: {
      ...commonChartOptions.xAxis as object,
      data: rounds, // Restore data property
      axisLabel: { // Restore rotate logic
        ...(commonChartOptions.xAxis as any)?.axisLabel,
        rotate: rounds.length > 10 ? 30 : 0
      }
    },
    yAxis: {
      ...commonChartOptions.yAxis as object,
      name: '损失值',
      nameTextStyle: { fontSize: 12, fontWeight: 'bold', padding: [0, 0, 10, 0] }
    },
    series
  }
})

// --- Event Handlers --- //

const handleHistoryFileChange = (file: UploadFile, modelType: 'model1' | 'model2') => {
  if (!file.raw) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const jsonString = e.target?.result as string
      const jsonData = JSON.parse(jsonString)
      
      if (validateNewHistoryData(jsonData)) {
        const processedData = processTrainingData(jsonData)
        console.log(`处理后的${modelType}数据:`, processedData)
        
        if (modelType === 'model1') {
          model1Data.value = processedData
          model1Name.value = processedData.model_name || 
                            (processedData.training_type === 'federated' ? '联邦学习' : '集中式学习')
        } else {
          model2Data.value = processedData
          model2Name.value = processedData.model_name || 
                            (processedData.training_type === 'federated' ? '联邦学习' : '集中式学习')
        }
        ElMessage.success(`${modelType === 'model1' ? '模型1' : '模型2'}训练历史上传成功`)
      } else {
        ElMessage.error('文件格式不正确')
      }
    } catch (error) {
      console.error('解析文件失败:', error)
      ElMessage.error('解析文件失败')
    }
  }
  reader.readAsText(file.raw)
}

const downloadModelHistory = async (modelType: 'model1' | 'model2') => {
  const modelId = modelType === 'model1' ? selectedModel1.value : selectedModel2.value
  if (!modelId) {
    ElMessage.warning('请先选择模型')
    return
  }
  
  try {
    isLoading.value = true
    ElMessage.info('正在获取训练历史数据...')
    
    const blob = await getTrainingHistory(modelId)
    
    // 解析返回的Blob数据
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string
        const jsonData = JSON.parse(jsonString)
        
        if (validateNewHistoryData(jsonData)) {
          const processedData = processTrainingData(jsonData)
          console.log(`处理后的${modelType}数据:`, processedData)
          
          if (modelType === 'model1') {
            model1Data.value = processedData
            model1Name.value = processedData.model_name || 
                              (processedData.training_type === 'federated' ? '联邦学习' : '集中式学习')
            selectedModel1.value = null // 清空选择
          } else {
            model2Data.value = processedData
            model2Name.value = processedData.model_name || 
                              (processedData.training_type === 'federated' ? '联邦学习' : '集中式学习')
            selectedModel2.value = null // 清空选择
          }
          ElMessage.success(`${modelType === 'model1' ? '模型1' : '模型2'}训练历史加载成功`)
          
          // 保存为本地文件（可选）
          const modelName = modelType === 'model1' ? model1Name.value : model2Name.value
          const fileName = `${modelName}_training_history.json`
          saveJsonToFile(jsonString, fileName)
        } else {
          ElMessage.error('训练历史数据格式不正确')
        }
      } catch (error) {
        console.error('解析训练历史数据失败:', error)
        ElMessage.error('解析训练历史数据失败')
      }
    }
    reader.readAsText(blob)
  } catch (error) {
    console.error('获取训练历史数据失败:', error)
    ElMessage.error('获取训练历史数据失败')
  } finally {
    isLoading.value = false
  }
}

// 保存JSON到本地文件
const saveJsonToFile = (jsonString: string, fileName: string) => {
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.performance-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  width: 100%;
  padding: 20px;
}

.data-source-card {
  margin-bottom: 10px;
  height: auto;
}

.data-source-card :deep(.el-card__body) {
  padding: 15px;
  min-height: 140px;
}

.data-source-card :deep(.el-form--inline) {
  justify-content: center;
  margin: 5px 0;
}

.data-source-card :deep(.el-card__header) {
  padding: 10px 15px;
}

.charts-card {
  height: calc(100vh - 280px);
  overflow: auto;
}

.charts-card :deep(.el-card__body) {
  padding: 20px;
}

.chart {
  height: 500px;
  width: 100%;
  margin: 10px 0;
  background-color: rgba(250, 250, 250, 0.8);
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  padding: 10px;
}

.el-row {
  width: 100%;
}

.el-col {
  margin-bottom: 20px;
}

.display-mode-form {
  margin: 10px 0;
}

.model-info-form {
  margin: 15px 0;
}

.model-tag {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.model-tag .el-tag {
  margin-right: 5px;
  margin-bottom: 5px;
}

.training-info {
  margin-bottom: 20px;
}

:deep(.el-form--inline .el-form-item) {
  margin-right: 15px;
}

.model-selection-form {
  margin: 10px 0;
}

.model-selection-form :deep(.el-select) {
  width: 240px;
}

@media (max-width: 768px) {
  .charts-card {
    height: calc(100vh - 320px);
  }
  
  .chart {
    height: 400px;
  }
  
  .el-radio-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .el-radio-button:first-child {
    border-radius: 4px 4px 0 0;
  }
  
  .el-radio-button:last-child {
    border-radius: 0 0 4px 4px;
  }
  
  .el-radio-button:not(:first-child) .el-radio-button__inner {
    border-left: 1px solid #dcdfe6;
  }
}

@media (max-width: 480px) {
  .charts-card {
    height: calc(100vh - 350px);
  }
  
  .chart {
    height: 300px;
  }
  
  .el-col {
    width: 100% !important;
  }
}
</style> 