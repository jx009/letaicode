import type { GeminiSettings } from '../../types/gemini-config'
import { existsSync, rmSync } from 'node:fs'
import inquirer from 'inquirer'
import { join } from 'pathe'
import { exec } from 'tinyexec'
import { GEMINI_CACHE_DIR, GEMINI_CHECKPOINTS_DIR, GEMINI_CONTEXT_FILE, GEMINI_DIR, GEMINI_SETTINGS_FILE } from '../../constants'
import { ensureI18nInitialized, i18n } from '../../i18n'
import { commandExists } from '../platform'
import { moveToTrash } from '../trash'
import { backupGeminiSettings, readGeminiSettings } from './gemini-config-manager'
import { backupGeminiContext } from './gemini-context-manager'

/**
 * Uninstallation options
 */
export interface GeminiUninstallOptions {
  /** Remove Gemini CLI binary */
  removeCli?: boolean
  /** Remove configuration files */
  removeConfig?: boolean
  /** Remove context file (GEMINI.md) */
  removeContext?: boolean
  /** Remove cache */
  removeCache?: boolean
  /** Remove checkpoints */
  removeCheckpoints?: boolean
  /** Create backup before removal */
  backup?: boolean
  /** Force removal without confirmation */
  force?: boolean
  /** Interactive mode */
  interactive?: boolean
}

/**
 * Uninstall result
 */
export interface UninstallResult {
  success: boolean
  removed: string[]
  failed: string[]
  backups: string[]
  messages: string[]
}

/**
 * Check what Gemini components are installed
 */
export async function checkGeminiInstallation(): Promise<{
  cliInstalled: boolean
  configExists: boolean
  contextExists: boolean
  cacheExists: boolean
  checkpointsExist: boolean
}> {
  const cliInstalled = await commandExists('gemini')
  const configExists = existsSync(GEMINI_SETTINGS_FILE)
  const contextExists = existsSync(GEMINI_CONTEXT_FILE)
  const cacheExists = existsSync(GEMINI_CACHE_DIR)
  const checkpointsExist = existsSync(GEMINI_CHECKPOINTS_DIR)

  return {
    cliInstalled,
    configExists,
    contextExists,
    cacheExists,
    checkpointsExist,
  }
}

/**
 * Uninstall Gemini CLI binary
 */
async function uninstallGeminiCli(): Promise<{ success: boolean, message: string }> {
  ensureI18nInitialized()

  try {
    // Try npm uninstall first
    if (await commandExists('npm')) {
      try {
        await exec('npm', ['uninstall', '-g', '@google/gemini-cli'])
        return {
          success: true,
          message: i18n.t('gemini:uninstall.cliRemovedNpm'),
        }
      }
      catch {
        // npm uninstall failed, try brew
      }
    }

    // Try brew uninstall
    if (await commandExists('brew')) {
      try {
        await exec('brew', ['uninstall', 'gemini-cli'])
        return {
          success: true,
          message: i18n.t('gemini:uninstall.cliRemovedBrew'),
        }
      }
      catch {
        // brew uninstall failed
      }
    }

    return {
      success: false,
      message: i18n.t('gemini:uninstall.cliRemovalFailed'),
    }
  }
  catch (error: any) {
    return {
      success: false,
      message: i18n.t('gemini:uninstall.cliRemovalError', { error: error.message }),
    }
  }
}

/**
 * Remove file or directory with trash support
 */
async function removeItem(path: string, useTrash: boolean = true): Promise<boolean> {
  if (!existsSync(path)) {
    return true
  }

  try {
    if (useTrash) {
      await moveToTrash(path)
    }
    else {
      rmSync(path, { recursive: true, force: true })
    }
    return true
  }
  catch (error) {
    console.error(`Failed to remove ${path}:`, error)
    return false
  }
}

/**
 * Uninstall Gemini with specified options
 */
export async function uninstallGemini(
  options: GeminiUninstallOptions = {},
): Promise<UninstallResult> {
  ensureI18nInitialized()

  const result: UninstallResult = {
    success: true,
    removed: [],
    failed: [],
    backups: [],
    messages: [],
  }

  // Check current installation
  const installation = await checkGeminiInstallation()

  // Create backups if requested
  if (options.backup) {
    try {
      if (installation.configExists) {
        const backupPath = backupGeminiSettings()
        result.backups.push(backupPath)
        result.messages.push(i18n.t('gemini:uninstall.configBackedUp', { path: backupPath }))
      }

      if (installation.contextExists) {
        const backupPath = backupGeminiContext()
        result.backups.push(backupPath)
        result.messages.push(i18n.t('gemini:uninstall.contextBackedUp', { path: backupPath }))
      }
    }
    catch (error: any) {
      result.messages.push(i18n.t('gemini:uninstall.backupFailed', { error: error.message }))
    }
  }

  // Remove Gemini CLI
  if (options.removeCli && installation.cliInstalled) {
    const cliResult = await uninstallGeminiCli()
    if (cliResult.success) {
      result.removed.push('Gemini CLI')
      result.messages.push(cliResult.message)
    }
    else {
      result.failed.push('Gemini CLI')
      result.messages.push(cliResult.message)
      result.success = false
    }
  }

  // Remove configuration
  if (options.removeConfig && installation.configExists) {
    const success = await removeItem(GEMINI_SETTINGS_FILE, !options.force)
    if (success) {
      result.removed.push('Configuration')
      result.messages.push(i18n.t('gemini:uninstall.configRemoved'))
    }
    else {
      result.failed.push('Configuration')
      result.success = false
    }
  }

  // Remove context file
  if (options.removeContext && installation.contextExists) {
    const success = await removeItem(GEMINI_CONTEXT_FILE, !options.force)
    if (success) {
      result.removed.push('Context File')
      result.messages.push(i18n.t('gemini:uninstall.contextRemoved'))
    }
    else {
      result.failed.push('Context File')
      result.success = false
    }
  }

  // Remove cache
  if (options.removeCache && installation.cacheExists) {
    const success = await removeItem(GEMINI_CACHE_DIR, !options.force)
    if (success) {
      result.removed.push('Cache')
      result.messages.push(i18n.t('gemini:uninstall.cacheRemoved'))
    }
    else {
      result.failed.push('Cache')
      result.success = false
    }
  }

  // Remove checkpoints
  if (options.removeCheckpoints && installation.checkpointsExist) {
    const success = await removeItem(GEMINI_CHECKPOINTS_DIR, !options.force)
    if (success) {
      result.removed.push('Checkpoints')
      result.messages.push(i18n.t('gemini:uninstall.checkpointsRemoved'))
    }
    else {
      result.failed.push('Checkpoints')
      result.success = false
    }
  }

  // Remove entire Gemini directory if empty
  if (existsSync(GEMINI_DIR)) {
    try {
      const remainingFiles = require('node:fs').readdirSync(GEMINI_DIR)
      if (remainingFiles.length === 0 || (remainingFiles.length === 1 && remainingFiles[0] === 'backup')) {
        await removeItem(GEMINI_DIR, !options.force)
        result.messages.push(i18n.t('gemini:uninstall.dirRemoved'))
      }
    }
    catch {
      // Directory not empty or removal failed, which is fine
    }
  }

  return result
}

/**
 * Interactive uninstallation
 */
export async function uninstallGeminiInteractive(): Promise<UninstallResult> {
  ensureI18nInitialized()

  console.log(i18n.t('gemini:uninstall.welcome'))

  // Check current installation
  const installation = await checkGeminiInstallation()

  console.log(i18n.t('gemini:uninstall.currentInstallation'))
  console.log(`  - Gemini CLI: ${installation.cliInstalled ? '✓ Installed' : '✗ Not installed'}`)
  console.log(`  - Configuration: ${installation.configExists ? '✓ Exists' : '✗ Not found'}`)
  console.log(`  - Context File: ${installation.contextExists ? '✓ Exists' : '✗ Not found'}`)
  console.log(`  - Cache: ${installation.cacheExists ? '✓ Exists' : '✗ Not found'}`)
  console.log(`  - Checkpoints: ${installation.checkpointsExist ? '✓ Exists' : '✗ Not found'}`)

  // Ask for uninstall type
  const { uninstallType } = await inquirer.prompt<{
    uninstallType: 'complete' | 'custom' | 'cancel'
  }>([
    {
      type: 'list',
      name: 'uninstallType',
      message: i18n.t('gemini:uninstall.selectType'),
      choices: [
        {
          name: i18n.t('gemini:uninstall.types.complete'),
          value: 'complete',
        },
        {
          name: i18n.t('gemini:uninstall.types.custom'),
          value: 'custom',
        },
        {
          name: i18n.t('gemini:uninstall.types.cancel'),
          value: 'cancel',
        },
      ],
    },
  ])

  if (uninstallType === 'cancel') {
    return {
      success: true,
      removed: [],
      failed: [],
      backups: [],
      messages: [i18n.t('gemini:uninstall.cancelled')],
    }
  }

  let options: GeminiUninstallOptions

  if (uninstallType === 'complete') {
    // Complete uninstallation
    const { backup } = await inquirer.prompt<{ backup: boolean }>([
      {
        type: 'confirm',
        name: 'backup',
        message: i18n.t('gemini:uninstall.confirmBackup'),
        default: true,
      },
    ])

    options = {
      removeCli: installation.cliInstalled,
      removeConfig: installation.configExists,
      removeContext: installation.contextExists,
      removeCache: installation.cacheExists,
      removeCheckpoints: installation.checkpointsExist,
      backup,
      force: false,
    }
  }
  else {
    // Custom uninstallation
    const { items } = await inquirer.prompt<{ items: string[] }>([
      {
        type: 'checkbox',
        name: 'items',
        message: i18n.t('gemini:uninstall.selectItems'),
        choices: [
          {
            name: 'Gemini CLI Binary',
            value: 'cli',
            checked: false,
            disabled: !installation.cliInstalled,
          },
          {
            name: 'Configuration (settings.json)',
            value: 'config',
            checked: false,
            disabled: !installation.configExists,
          },
          {
            name: 'Context File (GEMINI.md)',
            value: 'context',
            checked: false,
            disabled: !installation.contextExists,
          },
          {
            name: 'Cache',
            value: 'cache',
            checked: false,
            disabled: !installation.cacheExists,
          },
          {
            name: 'Checkpoints',
            value: 'checkpoints',
            checked: false,
            disabled: !installation.checkpointsExist,
          },
        ],
      },
    ])

    if (items.length === 0) {
      return {
        success: true,
        removed: [],
        failed: [],
        backups: [],
        messages: [i18n.t('gemini:uninstall.noItemsSelected')],
      }
    }

    const { backup } = await inquirer.prompt<{ backup: boolean }>([
      {
        type: 'confirm',
        name: 'backup',
        message: i18n.t('gemini:uninstall.confirmBackup'),
        default: true,
      },
    ])

    options = {
      removeCli: items.includes('cli'),
      removeConfig: items.includes('config'),
      removeContext: items.includes('context'),
      removeCache: items.includes('cache'),
      removeCheckpoints: items.includes('checkpoints'),
      backup,
      force: false,
    }
  }

  // Final confirmation
  const { confirm } = await inquirer.prompt<{ confirm: boolean }>([
    {
      type: 'confirm',
      name: 'confirm',
      message: i18n.t('gemini:uninstall.finalConfirm'),
      default: false,
    },
  ])

  if (!confirm) {
    return {
      success: true,
      removed: [],
      failed: [],
      backups: [],
      messages: [i18n.t('gemini:uninstall.cancelled')],
    }
  }

  // Perform uninstallation
  return uninstallGemini(options)
}

/**
 * Get uninstallation summary
 */
export function getUninstallSummary(result: UninstallResult): string {
  ensureI18nInitialized()

  let summary = `${i18n.t('gemini:uninstall.summary')}\n\n`

  if (result.removed.length > 0) {
    summary += `${i18n.t('gemini:uninstall.removedItems')}\n`
    for (const item of result.removed) {
      summary += `  ✓ ${item}\n`
    }
    summary += '\n'
  }

  if (result.failed.length > 0) {
    summary += `${i18n.t('gemini:uninstall.failedItems')}\n`
    for (const item of result.failed) {
      summary += `  ✗ ${item}\n`
    }
    summary += '\n'
  }

  if (result.backups.length > 0) {
    summary += `${i18n.t('gemini:uninstall.backupLocations')}\n`
    for (const backup of result.backups) {
      summary += `  📦 ${backup}\n`
    }
    summary += '\n'
  }

  if (result.messages.length > 0) {
    summary += `${i18n.t('gemini:uninstall.details')}\n`
    for (const message of result.messages) {
      summary += `  • ${message}\n`
    }
  }

  return summary
}
