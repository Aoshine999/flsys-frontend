import '@testing-library/jest-dom'
import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'

// 配置全局组件
mount.global = {
  plugins: [ElementPlus]
} 