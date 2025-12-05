import type { GeminiSettings } from '../../types/gemini-config'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import dayjs from 'dayjs'
import { ensureDirSync } from 'fs-extra'
import { join } from 'pathe'
import { GEMINI_CACHE_DIR, GEMINI_CHECKPOINTS_DIR, GEMINI_DIR, GEMINI_SETTINGS_FILE } from '../../constants'
import { ensureI18nInitialized, i18n } from '../../i18n'

/**
 * Ensure Gemini directory structure exists
 */
export function ensureGeminiDir(): void {
  ensureDirSync(GEMINI_DIR)
  ensureDirSync(GEMINI_CHECKPOINTS_DIR)
  ensureDirSync(GEMINI_CACHE_DIR)
}

/**
 * Read Gemini CLI settings
 */
export function readGeminiSettings(): GeminiSettings | null {
  if (!existsSync(GEMINI_SETTINGS_FILE)) {
    return null
  }

  try {
    const content = readFileSync(GEMINI_SETTINGS_FILE, 'utf-8')
    return JSON.parse(content) as GeminiSettings
  }
  catch (error) {
    ensureI18nInitialized()
    console.error(i18n.t('gemini:configReadError'), error)
    return null
  }
}

/**
 * Write Gemini CLI settings
 */
export function writeGeminiSettings(settings: GeminiSettings): void {
  ensureGeminiDir()

  try {
    const jsonString = JSON.stringify(settings, null, 2)
    writeFileSync(GEMINI_SETTINGS_FILE, jsonString, 'utf-8')
  }
  catch (error) {
    ensureI18nInitialized()
    throw new Error(`${i18n.t('gemini:configWriteError')}: ${error}`)
  }
}

/**
 * Create default Gemini settings
 */
export function createDefaultGeminiSettings(
  authType: 'oauth' | 'api_key' | 'vertex_ai' = 'oauth',
  apiKey?: string,
  vertexAiProject?: string,
): GeminiSettings {
  // For API key mode, add security.auth structure to bypass OAuth
  const securityConfig = authType === 'api_key' && apiKey
    ? {
        security: {
          auth: {
            selectedType: 'api-key',
            apiKey,
          },
          onboarding: {
            completed: true,
          },
        },
      }
    : {}

  return {
    version: '1.0.0',
    mode: 'official',
    authentication: {
      type: authType,
      apiKey: authType === 'api_key' ? apiKey : undefined,
      vertexAiProject: authType === 'vertex_ai' ? vertexAiProject : undefined,
    },
    model: {
      default: 'gemini-2.5-pro',
      fast: 'gemini-2.5-flash',
      preferences: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
    },
    tools: {
      enabled: ['fileSystem', 'shell', 'webFetch', 'googleSearch'],
      googleSearch: {
        grounding: true,
      },
    },
    mcpServers: {},
    customCommands: {},
    ui: {
      theme: 'auto',
      language: 'zh-CN',
    },
    telemetry: {
      enabled: false,
    },
    ...securityConfig,
  } as GeminiSettings
}

/**
 * Update Gemini settings partially
 */
export function updateGeminiSettings(
  updates: Partial<GeminiSettings>,
): void {
  const currentSettings = readGeminiSettings() || createDefaultGeminiSettings()
  const defaultSettings = createDefaultGeminiSettings()

  const newSettings: GeminiSettings = {
    ...currentSettings,
    ...updates,
    // Deep merge nested objects
    authentication: {
      ...currentSettings.authentication,
      ...(updates.authentication || {}),
    },
    model: {
      ...currentSettings.model,
      ...(updates.model || {}),
      preferences: {
        ...(currentSettings.model?.preferences || defaultSettings.model.preferences),
        ...(updates.model?.preferences || {}),
      },
    },
    tools: updates.tools
      ? {
          ...currentSettings.tools,
          ...updates.tools,
        }
      : currentSettings.tools,
    mcpServers: updates.mcpServers
      ? {
          ...currentSettings.mcpServers,
          ...updates.mcpServers,
        }
      : currentSettings.mcpServers,
    customCommands: updates.customCommands
      ? {
          ...currentSettings.customCommands,
          ...updates.customCommands,
        }
      : currentSettings.customCommands,
    ui: updates.ui
      ? {
          ...currentSettings.ui,
          ...updates.ui,
        }
      : currentSettings.ui,
    customProvider: updates.customProvider
      ? {
          ...currentSettings.customProvider,
          ...updates.customProvider,
        }
      : currentSettings.customProvider,
    // Merge security section if provided (for Gemini CLI auth compatibility)
    security: (updates as any).security
      ? {
          ...(currentSettings as any).security,
          ...(updates as any).security,
          // Deep merge auth section
          auth: {
            ...((currentSettings as any).security?.auth || {}),
            ...((updates as any).security?.auth || {}),
          },
          // Deep merge onboarding section
          onboarding: {
            ...((currentSettings as any).security?.onboarding || {}),
            ...((updates as any).security?.onboarding || {}),
          },
        }
      : (currentSettings as any).security,
  }

  writeGeminiSettings(newSettings)
}

/**
 * Backup Gemini settings
 */
export function backupGeminiSettings(): string {
  ensureI18nInitialized()
  const settings = readGeminiSettings()
  if (!settings) {
    throw new Error(i18n.t('gemini:noConfigToBackup'))
  }

  const timestamp = dayjs().format('YYYY-MM-DD_HH-mm-ss')
  const backupDir = join(GEMINI_DIR, 'backup')
  ensureDirSync(backupDir)

  const backupPath = join(backupDir, `settings.backup.${timestamp}.json`)

  writeFileSync(backupPath, JSON.stringify(settings, null, 2), 'utf-8')

  return backupPath
}

/**
 * Check if Gemini is configured
 */
export function isGeminiConfigured(): boolean {
  return existsSync(GEMINI_SETTINGS_FILE)
}

/**
 * Get current Gemini mode (official or custom)
 */
export function getGeminiMode(): 'official' | 'custom' | null {
  const settings = readGeminiSettings()
  if (!settings) {
    return null
  }

  return settings.mode || 'official'
}
