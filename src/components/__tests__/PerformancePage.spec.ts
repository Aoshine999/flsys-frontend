/// <reference types="vitest" />
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { nextTick } from 'vue'
import ElementPlus from 'element-plus'
import PerformancePage from '../../pages/PerformancePage.vue'
import type { Component } from 'vue'
// import type { EChartsOption } from 'echarts'

// 测试数据
const validData = {
  rounds: [1, 2, 3],
  accuracies: [0.5, 0.6, 0.7],
  losses: [1.0, 0.8, 0.6],
  total_training_time: "1小时",
  training_type: "federated" as const
}

describe('PerformancePage.vue', () => {
  const wrapper = mount(PerformancePage as Component, {
    global: {
      plugins: [ElementPlus, createPinia()]
    }
  })

  it('初始状态应该显示空状态提示', () => {
    expect(wrapper.find('.el-empty').exists()).toBe(true)
  })

  it('应该正确验证数据格式', () => {
    expect(wrapper.vm.validateHistoryData(validData)).toBe(true)

    const invalidData = {
      rounds: [1],
      accuracies: [],
      losses: [1.0],
      total_training_time: "1小时",
      training_type: "invalid"
    }
    expect(wrapper.vm.validateHistoryData(invalidData)).toBe(false)
  })

  it('文件上传组件应该存在', () => {
    expect(wrapper.find('.el-upload').exists()).toBe(true)
  })

  describe('数据验证测试', () => {
    it('应该正确验证联邦学习数据格式', () => {
      expect(wrapper.vm.validateHistoryData(validData)).toBe(true)
    })

    it('应该正确验证集中式学习数据格式', () => {
      expect(wrapper.vm.validateHistoryData(validData)).toBe(true)
    })

    it('应该拒绝无效的数据格式', () => {
      const invalidData = {
        rounds: [1],
        accuracies: [],
        losses: [1.0],
        total_training_time: "1小时",
        training_type: "invalid"
      }
      expect(wrapper.vm.validateHistoryData(invalidData)).toBe(false)
    })
  })

  describe('图表显示测试', () => {
    beforeEach(async () => {
      // 设置测试数据
      wrapper.vm.federatedTrainingData.value = validData
      wrapper.vm.centralizedTrainingData.value = validData
      await nextTick()
    })

    it('应该正确显示联邦学习数据', async () => {
      wrapper.vm.displayMode.value = 'federated'
      await nextTick()
      const charts = wrapper.findAll('.chart')
      expect(charts.length).toBe(2)
    })

    it('应该正确显示集中式学习数据', async () => {
      wrapper.vm.displayMode.value = 'centralized'
      await nextTick()
      const charts = wrapper.findAll('.chart')
      expect(charts.length).toBe(2)
    })

    it('应该正确显示对比模式数据', async () => {
      wrapper.vm.displayMode.value = 'both'
      await nextTick()
      const charts = wrapper.findAll('.chart')
      expect(charts.length).toBe(2)
    })
  })

  describe('训练时间显示测试', () => {
    beforeEach(async () => {
      wrapper.vm.federatedTrainingData.value = validData
      wrapper.vm.centralizedTrainingData.value = validData
      await nextTick()
    })

    it('应该显示正确的训练时间信息', async () => {
      const alerts = wrapper.findAll('.el-alert')
      expect(alerts.length).toBe(2)
      expect(alerts[0].text()).toContain('1小时')
      expect(alerts[1].text()).toContain('1小时')
    })
  })

  describe('错误处理测试', () => {
    it('应该处理文件上传错误', async () => {
      const consoleSpy = vi.spyOn(console, 'error')
      await wrapper.vm.handleHistoryFileChange({
        raw: new Blob(['invalid json'], { type: 'application/json' })
      })
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('应该处理无效的训练类型', async () => {
      const invalidData = { ...validData, training_type: 'invalid' }
      await wrapper.vm.handleHistoryFileChange({
        raw: new Blob([JSON.stringify(invalidData)], { type: 'application/json' })
      })
      expect(wrapper.vm.federatedTrainingData).toBeNull()
      expect(wrapper.vm.centralizedTrainingData).toBeNull()
    })
  })
}) 