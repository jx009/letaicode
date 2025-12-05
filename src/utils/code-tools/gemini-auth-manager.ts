import { exec } from 'tinyexec'
import { ensureI18nInitialized, i18n } from '../../i18n'
import { readGeminiSettings, updateGeminiSettings } from './gemini-config-manager'

/**
 * Configure OAuth authentication
 * This guides the user through the official Gemini CLI login flow
 */
export async function configureOAuth(): Promise<void> {
  ensureI18nInitialized()
  console.log(i18n.t('gemini:auth.oauthInstructions'))
  console.log(i18n.t('gemini:auth.runCommand', { command: 'gemini' }))

  // Update settings to use OAuth
  updateGeminiSettings({
    mode: 'official',
    authentication: {
      type: 'oauth',
    },
  })

  console.log(i18n.t('gemini:auth.oauthConfigured'))
}

/**
 * Configure API Key authentication
 */
export async function configureApiKey(apiKey: string): Promise<void> {
  ensureI18nInitialized()

  if (!apiKey || apiKey.trim() === '') {
    throw new Error(i18n.t('gemini:auth.apiKeyRequired'))
  }

  // Set environment variable
  process.env.GEMINI_API_KEY = apiKey

  // Update settings with full structure to bypass OAuth requirement
  updateGeminiSettings({
    mode: 'official',
    authentication: {
      type: 'api_key',
      apiKey,
    },
    // Add security.auth structure to skip OAuth login
    security: {
      auth: {
        selectedType: 'api-key',
        apiKey,
      },
      onboarding: {
        completed: true,
      },
    } as any,
  })

  console.log(i18n.t('gemini:auth.apiKeyConfigured'))
}

/**
 * Configure Vertex AI authentication
 */
export async function configureVertexAi(
  projectId: string,
  apiKey: string,
): Promise<void> {
  ensureI18nInitialized()

  if (!projectId || projectId.trim() === '') {
    throw new Error(i18n.t('gemini:auth.projectIdRequired'))
  }

  if (!apiKey || apiKey.trim() === '') {
    throw new Error(i18n.t('gemini:auth.apiKeyRequired'))
  }

  // Set environment variables
  process.env.GOOGLE_CLOUD_PROJECT = projectId
  process.env.GOOGLE_API_KEY = apiKey
  process.env.GOOGLE_GENAI_USE_VERTEXAI = 'true'

  // Update settings
  updateGeminiSettings({
    mode: 'official',
    authentication: {
      type: 'vertex_ai',
      vertexAiProject: projectId,
    },
  })

  console.log(i18n.t('gemini:auth.vertexAiConfigured'))
}

/**
 * Get current authentication type
 */
export function getCurrentAuthType(): 'oauth' | 'api_key' | 'vertex_ai' | null {
  const settings = readGeminiSettings()
  return settings?.authentication?.type || null
}

/**
 * Verify authentication is configured
 */
export async function verifyAuthentication(): Promise<boolean> {
  try {
    // Try to run a simple Gemini CLI command
    await exec('gemini', ['-p', 'Hello', '--output-format', 'json'])
    return true
  }
  catch {
    return false
  }
}

/**
 * Check if using custom provider mode
 */
export function isCustomProviderMode(): boolean {
  const settings = readGeminiSettings()
  return settings?.mode === 'custom' && settings?.customProvider?.enabled === true
}
