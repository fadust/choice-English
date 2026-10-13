import { normalizeApiUrl } from './api-client';

/** 服务商预设：用户在 API 页选一个即自动填好 base URL，并给出密钥/模型指引，
 *  避免让普通用户手写请求头/请求体。预设仅作快捷填充，不新增持久化字段。 */
export interface ApiPreset {
  /** 唯一标识 */
  id: string;
  /** 显示名 */
  name: string;
  /** 自动填入「API 地址」（OpenAI 兼容 base，须经 normalizeApiUrl 核对拼接 /chat/completions 正确） */
  baseUrl: string;
  /** 密钥获取指引（短文案，显示为提示） */
  keyHint: string;
  /** 模型名示例，供输入框 placeholder 提示 */
  modelExamples: string[];
}

/** 常见 OpenAI 兼容服务商预设表。各 baseUrl 已按 normalizeApiUrl 规则核对：
 *  千帆 /v2、智谱 /api/paas/v4、通义 /compatible-mode/v1、Groq/OpenRouter 带版本路径均原样保留，
 *  DeepSeek 裸域名自动补 /v1；酒馆后端在其后拼 /chat/completions 后即对应官方兼容端点。 */
export const API_PRESETS: ApiPreset[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    keyHint: 'Created in platform.openai.com → API keys (sk-...)',
    modelExamples: ['gpt-4o', 'gpt-4o-mini'],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    keyHint: 'Create API Key in platform.deepseek.com',
    modelExamples: ['deepseek-chat', 'deepseek-reasoner'],
  },
  {
    id: 'moonshot',
    name: 'Moonshot (Kimi)',
    baseUrl: 'https://api.moonshot.cn/v1',
    keyHint: 'Create API Key in platform.moonshot.cn',
    modelExamples: ['kimi-k2-0711-preview', 'moonshot-v1-128k'],
  },
  {
    id: 'qianfan',
    name: 'Baidu Qianfan',
    baseUrl: 'https://qianfan.baidubce.com/v2',
    keyHint: 'Baidu Smart Cloud Qianfan Console → System Management → API Key (starting with bce-v3/...); appid optional',
    modelExamples: ['ernie-4.5-turbo-128k', 'ernie-3.5-8k'],
  },
  {
    id: 'dashscope',
    name: 'Tongyi (DashScope)',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    keyHint: 'Alibaba Cloud Bailian Console → API-KEY',
    modelExamples: ['qwen-plus', 'qwen-max'],
  },
  {
    id: 'zhipu',
    name: 'Wisdom spectrum GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    keyHint: 'bigmodel.cn console → API key',
    modelExamples: ['glm-4-plus', 'glm-4-flash'],
  },
  {
    id: 'siliconflow',
    name: 'silicon based flow',
    baseUrl: 'https://api.siliconflow.cn/v1',
    keyHint: 'siliconflow.cn console → API key',
    modelExamples: ['deepseek-ai/DeepSeek-V3', 'Qwen/Qwen2.5-7B-Instruct'],
  },
  {
    id: 'groq',
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    keyHint: 'console.groq.com → API Keys',
    modelExamples: ['llama-3.3-70b-versatile'],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    keyHint: 'openrouter.ai → Keys（sk-or-v1-...）',
    modelExamples: ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o'],
  },
  {
    id: 'hunyuan',
    name: 'Tencent Hunyuan',
    baseUrl: 'https://api.hunyuan.cloud.tencent.com/v1',
    keyHint: 'Tencent Cloud Hunyuan Console → API key',
    modelExamples: ['hunyuan-turbos-latest'],
  },
  {
    id: 'ollama',
    name: 'Ollama (local)',
    baseUrl: 'http://127.0.0.1:11434/v1',
    keyHint: 'No key is required for local services, the API key can be left blank',
    modelExamples: ['llama3', 'qwen2.5'],
  },
];

/** 按 baseUrl 匹配当前选中预设：两边都经 normalizeApiUrl 规范化后比较（兼容用户填完整
 *  /chat/completions 端点或裸域名），用于打开已有 API 时反显服务商下拉；无匹配返回 null。 */
export function presetForApiUrl(apiurl: string): ApiPreset | null {
  const norm = normalizeApiUrl(apiurl);
  return API_PRESETS.find(p => normalizeApiUrl(p.baseUrl) === norm) ?? null;
}
