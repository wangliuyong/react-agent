import type { Rule } from 'antd/es/form'

/** Base URL 必须明确配置，避免保存后请求因缺少服务地址而失败。 */
export const BASE_URL_RULES = [
  { required: true, message: '请填写 Base URL' }
] satisfies readonly Rule[]

/** 模型必须由用户选择，避免调用接口时缺少模型标识。 */
export const MODEL_RULES = [
  { required: true, message: '请选择模型' }
] satisfies readonly Rule[]
