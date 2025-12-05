import type { GeminiVersionInfo } from '../../types/gemini-config'
import { exec } from 'tinyexec'
import { ensureI18nInitialized, i18n } from '../../i18n'
import { commandExists } from '../platform'

/**
 * Check if Gemini CLI is installed
 */
export async function isGeminiCliInstalled(): Promise<boolean> {
  return commandExists('gemini')
}

/**
 * Get installed Gemini CLI version
 */
export async function getGeminiCliVersion(): Promise<string | null> {
  try {
    const result = await exec('gemini', ['--version'])
    return result.stdout.trim()
  }
  catch {
    return null
  }
}

/**
 * Install Gemini CLI using npm
 */
export async function installGeminiCliNpm(global = true): Promise<void> {
  ensureI18nInitialized()
  const command = global ? 'npm install -g @google/gemini-cli' : 'npm install @google/gemini-cli'

  console.log(i18n.t('gemini:installing', { method: 'npm' }))

  try {
    await exec('npm', ['install', global ? '-g' : '', '@google/gemini-cli'].filter(Boolean))
    console.log(i18n.t('gemini:installSuccess'))
  }
  catch (error: any) {
    throw new Error(i18n.t('gemini:installFailed', { error: error.message }))
  }
}

/**
 * Install Gemini CLI using Homebrew (macOS/Linux)
 */
export async function installGeminiCliBrew(): Promise<void> {
  ensureI18nInitialized()

  if (!commandExists('brew')) {
    throw new Error(i18n.t('gemini:brewNotFound'))
  }

  console.log(i18n.t('gemini:installing', { method: 'Homebrew' }))

  try {
    await exec('brew', ['install', 'gemini-cli'])
    console.log(i18n.t('gemini:installSuccess'))
  }
  catch (error: any) {
    throw new Error(i18n.t('gemini:installFailed', { error: error.message }))
  }
}

/**
 * Install Gemini CLI with auto-detection
 */
export async function installGeminiCli(
  method?: 'npm' | 'brew' | 'auto',
): Promise<void> {
  ensureI18nInitialized()

  // Check if already installed
  if (await isGeminiCliInstalled()) {
    console.log(i18n.t('gemini:alreadyInstalled'))
    return
  }

  // Auto-detect installation method
  if (method === 'auto' || !method) {
    if (commandExists('brew')) {
      await installGeminiCliBrew()
    }
    else if (commandExists('npm')) {
      await installGeminiCliNpm()
    }
    else {
      throw new Error(i18n.t('gemini:noInstallMethod'))
    }
  }
  else if (method === 'npm') {
    await installGeminiCliNpm()
  }
  else if (method === 'brew') {
    await installGeminiCliBrew()
  }
}

/**
 * Update Gemini CLI to latest version
 */
export async function updateGeminiCli(): Promise<void> {
  ensureI18nInitialized()
  console.log(i18n.t('gemini:updating'))

  try {
    // Try npm update first
    if (commandExists('npm')) {
      await exec('npm', ['update', '-g', '@google/gemini-cli'])
    }
    // Try brew upgrade
    else if (commandExists('brew')) {
      await exec('brew', ['upgrade', 'gemini-cli'])
    }

    console.log(i18n.t('gemini:updateSuccess'))
  }
  catch (error: any) {
    throw new Error(i18n.t('gemini:updateFailed', { error: error.message }))
  }
}

/**
 * Check if Gemini CLI update is available
 */
export async function checkGeminiCliUpdate(): Promise<GeminiVersionInfo> {
  const installedVersion = await getGeminiCliVersion()

  if (!installedVersion) {
    return {
      version: 'not-installed',
      updateAvailable: false,
    }
  }

  try {
    // Check npm registry for latest version
    const result = await exec('npm', ['view', '@google/gemini-cli', 'version'])
    const latestVersion = result.stdout.trim()

    return {
      version: installedVersion,
      latest: latestVersion,
      updateAvailable: installedVersion !== latestVersion,
    }
  }
  catch {
    return {
      version: installedVersion,
      updateAvailable: false,
    }
  }
}
