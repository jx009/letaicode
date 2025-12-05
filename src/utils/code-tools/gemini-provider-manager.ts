import type { GeminiProvider } from '../../types/gemini-config'
import { ensureI18nInitialized, i18n } from '../../i18n'
import { readGeminiSettings, updateGeminiSettings } from './gemini-config-manager'

/**
 * Get current active provider configuration
 */
export function getCurrentProvider(): GeminiProvider | null {
  const settings = readGeminiSettings()
  if (!settings) {
    return null
  }

  // If in custom mode, return custom provider
  if (settings.mode === 'custom' && settings.customProvider?.enabled) {
    return {
      id: settings.customProvider.id,
      name: settings.customProvider.name,
      baseUrl: settings.customProvider.baseUrl,
      apiKey: settings.customProvider.apiKey,
      model: settings.customProvider.model,
      wireProtocol: settings.customProvider.wireProtocol,
      enabled: true,
    }
  }

  // If in official mode, return official provider info
  if (settings.mode === 'official') {
    return {
      id: 'official',
      name: 'Google Gemini Official',
      baseUrl: 'https://generativelanguage.googleapis.com',
      apiKey: settings.authentication.apiKey,
      model: settings.model.default,
      wireProtocol: 'gemini',
      enabled: true,
    }
  }

  return null
}

/**
 * Switch to custom API provider
 */
export function switchToCustomProvider(
  providerId: string,
  apiKey: string,
  baseUrl?: string,
  model?: string,
  wireProtocol?: 'openai' | 'anthropic' | 'gemini',
): void {
  ensureI18nInitialized()

  const providerNames: Record<string, string> = {
    '302ai': '302.AI',
    'glm': 'GLM (智谱AI)',
    'minimax': 'MiniMax',
    'kimi': 'Kimi (月之暗面)',
    'deepseek': 'DeepSeek',
    'custom': 'Custom Provider',
  }

  const providerName = providerNames[providerId] || providerId

  const defaultBaseUrls: Record<string, string> = {
    '302ai': 'https://api.302.ai/v1',
    'glm': 'https://open.bigmodel.cn/api/paas/v4',
    'minimax': 'https://api.minimax.chat/v1',
    'kimi': 'https://api.moonshot.cn/v1',
    'deepseek': 'https://api.deepseek.com/v1',
  }

  const finalBaseUrl = baseUrl || defaultBaseUrls[providerId] || ''

  updateGeminiSettings({
    mode: 'custom',
    customProvider: {
      enabled: true,
      id: providerId,
      name: providerName,
      baseUrl: finalBaseUrl,
      apiKey,
      model: model || 'gemini-2.0-flash-exp',
      wireProtocol: wireProtocol || 'openai',
    },
  })

  console.log(i18n.t('gemini:provider.switchedToCustom', { name: providerName }))
}

/**
 * Switch to official Google Gemini mode
 */
export function switchToOfficialMode(
  authType: 'oauth' | 'api_key' | 'vertex_ai' = 'oauth',
  apiKey?: string,
  vertexAiProject?: string,
): void {
  ensureI18nInitialized()

  updateGeminiSettings({
    mode: 'official',
    authentication: {
      type: authType,
      apiKey: authType === 'api_key' ? apiKey : undefined,
      vertexAiProject: authType === 'vertex_ai' ? vertexAiProject : undefined,
    },
    customProvider: {
      ...readGeminiSettings()?.customProvider,
      enabled: false,
    } as any,
  })

  console.log(i18n.t('gemini:provider.switchedToOfficial'))
}
