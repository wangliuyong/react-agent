import type { Rule } from 'antd/es/form'

/** 供应商决定 API 地址与模型范围，必须显式选择。 */
export const PROVIDER_RULES = [
  { required: true, message: '请选择模型供应商' }
] satisfies readonly Rule[]

/** Base URL 必须明确配置，避免保存后请求因缺少服务地址而失败。 */
export const BASE_URL_RULES = [
  { required: true, message: '请填写 Base URL' }
] satisfies readonly Rule[]

/**
 * 可选完整 URL（如模型列表链接）。
 * 留空合法；填写时须带 http/https 协议。
 */
export const OPTIONAL_URL_RULES = [
  {
    validator: async (_rule, value: unknown) => {
      const trimmed = String(value ?? '').trim()
      if (!trimmed) return
      try {
        const parsed = new URL(trimmed)
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          throw new Error('invalid')
        }
      } catch {
        throw new Error('请输入包含协议的完整链接，如 https://api.example.com/v1/models')
      }
    }
  }
] satisfies readonly Rule[]

/** 模型必须由用户选择，避免调用接口时缺少模型标识。 */
export const MODEL_RULES = [
  { required: true, message: '请选择模型' }
] satisfies readonly Rule[]
