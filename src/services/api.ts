import axios from 'axios'

const api = axios.create({
  baseURL: '/api'
})

// 添加响应拦截器来处理常见错误
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // 可以在这里处理身份验证错误，例如清除本地存储并重定向到登录页面
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 添加请求拦截器来附加认证令牌
api.interceptors.request.use(
  config => {
    const user = localStorage.getItem('user')
    if (user) {
      try {
        const userData = JSON.parse(user)
        if (userData.token) {
          config.headers['Authorization'] = `Bearer ${userData.token}`
        }
      } catch (e) {
        console.error('解析用户数据时出错:', e)
      }
    }
    return config
  },
  error => Promise.reject(error)
)

// 认证相关接口
export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  admin: {
    id: number
    username: string
    email?: string
    full_name?: string
    is_active: boolean
  }
  token: string
}

export interface Admin {
  id: number
  username: string
  email?: string
  full_name?: string
  is_active: boolean
  token?: string
}

// 登录API
export const login = async (username: string, password: string): Promise<Admin> => {
  const response = await api.post<LoginResponse>('/auth/login', {
    username,
    password
  })
  
  const admin = {
    ...response.data.admin,
    token: response.data.token
  }
  
  return admin
}

// 登出API
export const logout = async (): Promise<void> => {
  await api.post('/auth/logout')
}

// 检查管理员身份API
export const checkAuth = async (): Promise<Admin> => {
  const response = await api.get<{ admin: Admin }>('/auth/me')
  return response.data.admin
}

export interface Model {
  id: number | string
  name: string
  description: string
}

export interface Prediction {
  label: string
  probability: number
}

export interface TrainingHistoryData {
  rounds: number[]
  accuracies: number[]
  losses: number[]
  total_training_time?: string
}

export const getModels = async (): Promise<Model[]> => {
  const response = await api.get<{ models: Model[] }>('/models/')
  return response.data.models
}

export const postPrediction = async (modelId: number | string, imageData: string): Promise<Prediction[]> => {
  const response = await api.post<{ predictions: Prediction[] }>('/predict/', {
    model_id: modelId,
    image_data: imageData
  })
  return response.data.predictions
}

export const getTrainingHistory = async (modelId: number | string): Promise<Blob> => {
  const response = await api.get(`/models/${modelId}/training_history/`, {
    responseType: 'blob'
  })
  return response.data
}

// 获取所有具有训练日志的模型列表
export const getModelsWithTrainingLogs = async (): Promise<Model[]> => {
  const response = await api.get<{ models: Model[] }>('/models/with_training_logs/')
  return response.data.models
}

// 获取特定模型的训练日志
export const getModelTrainingLog = async (modelId: number | string): Promise<Blob> => {
  const response = await api.get(`/models/${modelId}/training_log/`, {
    responseType: 'blob'
  })
  return response.data
} 