import { defineStore } from 'pinia'
import { ref } from 'vue'
import router from '../router'
import { login as apiLogin, logout as apiLogout, checkAuth, Admin, register as apiRegister } from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<Admin | null>(null)
  const isAuthenticated = ref(false)
  
  // 从localStorage中恢复用户会话
  const initAuth = async () => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser)
        isAuthenticated.value = true
        
        // 可选：验证令牌是否仍然有效
        try {
          await checkAuth()
        } catch (error) {
          // 如果验证失败，清除本地状态
          user.value = null
          isAuthenticated.value = false
          localStorage.removeItem('user')
        }
      } catch (e) {
        console.error('解析用户数据时出错:', e)
        localStorage.removeItem('user')
      }
    }
  }

  // 登录函数
  const login = async (username: string, password: string) => {
    try {
      // 调用API登录接口
      const adminData = await apiLogin(username, password)
      
      // 确认管理员账户是激活状态
      if (!adminData.is_active) {
        return Promise.reject(new Error('账户已被禁用，请联系系统管理员'))
      }
      
      // 更新本地状态
      user.value = adminData
      isAuthenticated.value = true
      
      // 保存到localStorage
      localStorage.setItem('user', JSON.stringify(adminData))
      
      return Promise.resolve()
    } catch (error: any) {
      return Promise.reject(new Error(error.response?.data?.message || '用户名或密码错误'))
    }
  }

  // 注册函数
  const register = async (username: string, password: string, email?: string, full_name?: string) => {
    try {
      // 调用API注册接口
      const adminData = await apiRegister(username, password, email, full_name)
      
      // 更新本地状态
      user.value = adminData
      isAuthenticated.value = true
      
      // 保存到localStorage
      localStorage.setItem('user', JSON.stringify(adminData))
      
      return Promise.resolve()
    } catch (error: any) {
      return Promise.reject(new Error(error.response?.data?.message || '注册失败，请稍后重试'))
    }
  }

  // 退出登录
  const logout = async () => {
    try {
      // 调用API登出接口
      await apiLogout()
    } catch (error) {
      console.error('登出时发生错误:', error)
    } finally {
      // 无论API调用是否成功，都清除本地状态
      user.value = null
      isAuthenticated.value = false
      localStorage.removeItem('user')
      router.push('/login')
    }
  }

  return {
    user,
    isAuthenticated,
    login,
    logout,
    register,
    initAuth
  }
}) 