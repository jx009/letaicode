import type { CodeToolType } from '../../constants'
import type { GeminiInstallOptions, GeminiSettings } from '../../types/gemini-config'
import inquirer from 'inquirer'
import { API_DEFAULT_URL, GEMINI_DIR, GEMINI_SETTINGS_FILE } from '../../constants'
import { ensureI18nInitialized, i18n } from '../../i18n'
import { configureApiKey, getCurrentAuthType } from './gemini-auth-manager'
import { createDefaultGeminiSettings, isGeminiConfigured, readGeminiSettings, updateGeminiSettings, writeGeminiSettings } from './gemini-config-manager'
import { getConfigSummary, initializeGeminiContext, updateGeminiContext } from './gemini-context-manager'
import { checkGeminiCliUpdate, getGeminiCliVersion, installGeminiCli, isGeminiCliInstalled } from './gemini-installer'
import { installMcpServices, selectMcpServices } from './gemini-mcp-manager'
import { checkGeminiInstallation, uninstallGemini, uninstallGeminiInteractive } from './gemini-uninstaller'

/**
 * Main Gemini setup function
 * This is the primary entry point for Gemini configuration and installation
 * IMPORTANT: Always uses hardcoded URL http://165.154.198.22:3000, same as Claude Code and Codex
 */
export async function setupGemini(options: GeminiInstallOptions): Promise<void> {
  ensureI18nInitialized()

  console.log(i18n.t('gemini:setup.welcome'))

  try {
    // Step 1: Check and install Gemini CLI if needed
    if (options.installMethod !== 'skip') {
      await installGeminiCliIfNeeded(options)
    }

    // Step 2: Create initial configuration with hardcoded URL
    await createGeminiConfiguration(options)

    // Step 3: Configure API Key (no mode selection, just API key)
    await configureAuthentication(options)

    // Step 4: Install MCP services if specified
    if (options.mcpServices && options.mcpServices.length > 0) {
      await installMcpServices(options.mcpServices)
    }

    // Step 5: Initialize context file
    initializeGeminiContext()

    console.log(i18n.t('gemini:setup.complete'))
    console.log(i18n.t('gemini:setup.nextSteps'))

    // Display configuration summary
    const summary = getConfigSummary()
    console.log(`\n${summary}`)
  }
  catch (error: any) {
    console.error(i18n.t('gemini:setup.failed', { error: error.message }))
    throw error
  }
}

/**
 * Install Gemini CLI if needed
 */
async function installGeminiCliIfNeeded(options: GeminiInstallOptions): Promise<void> {
  const isInstalled = await isGeminiCliInstalled()

  if (!isInstalled || options.force) {
    console.log(i18n.t('gemini:setup.installingCli'))
    await installGeminiCli(options.installMethod)
  }
  else {
    console.log(i18n.t('gemini:setup.cliAlreadyInstalled'))

    // Check for updates
    const versionInfo = await checkGeminiCliUpdate()
    if (versionInfo.updateAvailable) {
      console.log(i18n.t('gemini:setup.updateAvailable', {
        current: versionInfo.version,
        latest: versionInfo.latest,
      }))
    }
  }
}

/**
 * Create Gemini configuration
 * IMPORTANT: Uses hardcoded URL http://165.154.198.22:3000, same as Claude Code and Codex
 */
async function createGeminiConfiguration(options: GeminiInstallOptions): Promise<void> {
  const existingConfig = readGeminiSettings()

  if (existingConfig && !options.force) {
    console.log(i18n.t('gemini:setup.configExists'))
    return
  }

  // Always use API key mode with hardcoded URL
  const defaultSettings = createDefaultGeminiSettings(
    'api_key',
    options.apiKey,
  )

  // Force custom provider mode with hardcoded URL
  defaultSettings.mode = 'custom'
  defaultSettings.customProvider = {
    enabled: true,
    id: 'zcf-hardcoded',
    name: 'ZCF Default API',
    baseUrl: API_DEFAULT_URL, // http://165.154.198.22:3000
    apiKey: options.apiKey || '',
    model: 'gemini-2.0-flash-exp',
    wireProtocol: 'openai',
  }

  // Apply language settings
  if (options.lang) {
    defaultSettings.ui = {
      ...defaultSettings.ui,
      language: options.lang,
    }
  }

  writeGeminiSettings(defaultSettings)
  console.log(i18n.t('gemini:setup.configCreated'))
}

/**
 * Configure authentication - simplified to only API key
 * IMPORTANT: Always uses hardcoded URL http://165.154.198.22:3000
 * Sets environment variable GOOGLE_GEMINI_BASE_URL for Gemini CLI
 */
async function configureAuthentication(options: GeminiInstallOptions): Promise<void> {
  if (!options.apiKey) {
    throw new Error(i18n.t('gemini:auth.apiKeyRequired'))
  }

  // Write environment variable to shell config files
  await writeGeminiEnvironmentVariable(API_DEFAULT_URL)

  // Update settings to use the hardcoded URL with API key
  updateGeminiSettings({
    mode: 'custom',
    customProvider: {
      enabled: true,
      id: 'zcf-hardcoded',
      name: 'ZCF Default API',
      baseUrl: API_DEFAULT_URL, // http://165.154.198.22:3000
      apiKey: options.apiKey,
      model: 'gemini-2.0-flash-exp',
      wireProtocol: 'openai',
    },
    // Add security.auth structure to skip OAuth login
    security: {
      auth: {
        selectedType: 'api-key',
        apiKey: options.apiKey,
      },
      onboarding: {
        completed: true,
      },
    } as any,
  })

  console.log(i18n.t('gemini:auth.apiKeyConfigured'))
  console.log(`✓ Environment variable GOOGLE_GEMINI_BASE_URL set to: ${API_DEFAULT_URL}`)
}

/**
 * Write GOOGLE_GEMINI_BASE_URL environment variable to shell config files
 */
async function writeGeminiEnvironmentVariable(baseUrl: string): Promise<void> {
  const { homedir } = await import('node:os')
  const { existsSync, appendFileSync, readFileSync } = await import('node:fs')
  const { join } = await import('pathe')

  const homeDir = homedir()
  const envLine = `export GOOGLE_GEMINI_BASE_URL="${baseUrl}"`

  // Determine which shell config files to update
  const configFiles = [
    join(homeDir, '.bashrc'),
    join(homeDir, '.bash_profile'),
    join(homeDir, '.zshrc'),
  ]

  for (const configFile of configFiles) {
    if (existsSync(configFile)) {
      const content = readFileSync(configFile, 'utf-8')

      // Check if already exists
      if (content.includes('GOOGLE_GEMINI_BASE_URL')) {
        // Replace existing line
        const updatedContent = content.replace(
          /export GOOGLE_GEMINI_BASE_URL=.*/g,
          envLine,
        )
        const { writeFileSync } = await import('node:fs')
        writeFileSync(configFile, updatedContent, 'utf-8')
        console.log(`✓ Updated ${configFile}`)
      }
      else {
        // Append new line
        appendFileSync(configFile, `\n# ZCF Gemini Configuration\n${envLine}\n`, 'utf-8')
        console.log(`✓ Added to ${configFile}`)
      }
    }
  }

  // Also set for current process
  process.env.GOOGLE_GEMINI_BASE_URL = baseUrl
}

/**
 * Configure custom provider
 */
async function configureCustomProvider(options: GeminiInstallOptions): Promise<void> {
  if (!options.customProvider) {
    throw new Error(i18n.t('gemini:provider.customProviderRequired'))
  }

  switchToCustomProvider(
    options.customProvider.id,
    options.customProvider.apiKey,
    options.customProvider.baseUrl,
    options.customProvider.model,
  )
}

/**
 * Interactive Gemini setup
 * IMPORTANT: Simplified flow - no mode selection, just API key input
 * Always uses hardcoded URL http://165.154.198.22:3000
 */
export async function setupGeminiInteractive(lang: 'zh-CN' | 'en' = 'zh-CN'): Promise<void> {
  ensureI18nInitialized()

  console.log(i18n.t('gemini:setup.interactiveWelcome'))

  // Step 1: Ask for installation method
  const { installMethod } = await inquirer.prompt<{
    installMethod: 'npm' | 'brew' | 'skip'
  }>([
    {
      type: 'list',
      name: 'installMethod',
      message: i18n.t('gemini:setup.selectInstallMethod'),
      choices: [
        { name: 'npm', value: 'npm' },
        { name: 'Homebrew', value: 'brew' },
        { name: i18n.t('gemini:setup.skipInstall'), value: 'skip' },
      ],
      default: 'npm',
    },
  ])

  // Step 2: Ask for API Key (required, visible input)
  const { apiKey } = await inquirer.prompt<{ apiKey: string }>([
    {
      type: 'input',
      name: 'apiKey',
      message: i18n.t('gemini:setup.enterApiKey'),
      validate: (input: string) => {
        if (!input || input.trim() === '') {
          return i18n.t('gemini:auth.apiKeyRequired')
        }
        return true
      },
    },
  ])

  const options: GeminiInstallOptions = {
    lang,
    installMethod,
    apiKey,
    authType: 'api_key',
  }

  // Step 3: Optional MCP services installation
  const { installMcp } = await inquirer.prompt<{ installMcp: boolean }>([
    {
      type: 'confirm',
      name: 'installMcp',
      message: i18n.t('gemini:setup.installMcpServices'),
      default: false,
    },
  ])

  if (installMcp) {
    const selectedServices = await selectMcpServices()
    options.mcpServices = selectedServices
  }

  // Step 4: Execute setup with hardcoded URL
  await setupGemini(options)
}

/**
 * Configure official mode interactively
 */
async function configureOfficialModeInteractive(options: GeminiInstallOptions): Promise<void> {
  // Ask for installation method
  const { installMethod } = await inquirer.prompt<{
    installMethod: 'npm' | 'brew' | 'skip'
  }>([
    {
      type: 'list',
      name: 'installMethod',
      message: i18n.t('gemini:setup.selectInstallMethod'),
      choices: [
        { name: 'npm', value: 'npm' },
        { name: 'Homebrew', value: 'brew' },
        { name: i18n.t('gemini:setup.skipInstall'), value: 'skip' },
      ],
      default: 'npm',
    },
  ])

  options.installMethod = installMethod

  // Ask for authentication type
  const { authType } = await inquirer.prompt<{
    authType: 'oauth' | 'api_key' | 'vertex_ai'
  }>([
    {
      type: 'list',
      name: 'authType',
      message: i18n.t('gemini:setup.selectAuthType'),
      choices: [
        { name: 'OAuth (Recommended)', value: 'oauth' },
        { name: 'API Key', value: 'api_key' },
        { name: 'Vertex AI', value: 'vertex_ai' },
      ],
    },
  ])

  options.authType = authType

  // Collect additional info based on auth type
  if (authType === 'api_key') {
    const { apiKey } = await inquirer.prompt<{ apiKey: string }>([
      {
        type: 'password',
        name: 'apiKey',
        message: i18n.t('gemini:setup.enterApiKey'),
      },
    ])
    options.apiKey = apiKey
  }
  else if (authType === 'vertex_ai') {
    const answers = await inquirer.prompt<{
      projectId: string
      apiKey: string
    }>([
      {
        type: 'input',
        name: 'projectId',
        message: i18n.t('gemini:setup.enterProjectId'),
      },
      {
        type: 'password',
        name: 'apiKey',
        message: i18n.t('gemini:setup.enterApiKey'),
      },
    ])
    options.vertexAiProject = answers.projectId
    options.apiKey = answers.apiKey
  }
}

/**
 * Configure custom mode interactively
 */
async function configureCustomModeInteractive(options: GeminiInstallOptions): Promise<void> {
  // Get available API provider presets
  const presets = getApiProviders('gemini')

  // Ask user to choose a preset or custom
  const presetChoices = presets.map(p => ({
    name: `${p.name} - ${p.description || ''}`,
    value: p.id,
  }))

  presetChoices.push({
    name: i18n.t('gemini:setup.customProvider'),
    value: 'custom',
  })

  const { providerId } = await inquirer.prompt<{ providerId: string }>([
    {
      type: 'list',
      name: 'providerId',
      message: i18n.t('gemini:setup.selectProvider'),
      choices: presetChoices,
    },
  ])

  let baseUrl: string
  let model: string | undefined

  if (providerId === 'custom') {
    const answers = await inquirer.prompt<{
      providerId: string
      baseUrl: string
      model: string
    }>([
      {
        type: 'input',
        name: 'providerId',
        message: i18n.t('gemini:setup.enterProviderId'),
      },
      {
        type: 'input',
        name: 'baseUrl',
        message: i18n.t('gemini:setup.enterBaseUrl'),
      },
      {
        type: 'input',
        name: 'model',
        message: i18n.t('gemini:setup.enterModel'),
        default: 'gemini-2.0-flash-exp',
      },
    ])

    options.customProvider = {
      id: answers.providerId,
      baseUrl: answers.baseUrl,
      apiKey: '', // Will be filled next
      model: answers.model,
    }
  }
  else {
    const preset = presets.find(p => p.id === providerId)
    if (!preset || !preset.gemini) {
      throw new Error(i18n.t('gemini:setup.presetNotFound'))
    }

    options.customProvider = {
      id: providerId,
      baseUrl: preset.gemini.baseUrl,
      apiKey: '', // Will be filled next
      model: preset.gemini.defaultModel,
    }
  }

  // Ask for API key
  const { apiKey } = await inquirer.prompt<{ apiKey: string }>([
    {
      type: 'password',
      name: 'apiKey',
      message: i18n.t('gemini:setup.enterApiKey'),
    },
  ])

  options.customProvider!.apiKey = apiKey
}

/**
 * Update Gemini configuration and context
 */
export async function updateGeminiConfig(): Promise<void> {
  ensureI18nInitialized()

  if (!isGeminiConfigured()) {
    console.log(i18n.t('gemini:update.notConfigured'))
    return
  }

  console.log(i18n.t('gemini:update.updating'))

  // Update context file
  updateGeminiContext()

  console.log(i18n.t('gemini:update.complete'))
}

/**
 * Get Gemini status
 */
export async function getGeminiStatus(): Promise<{
  installed: boolean
  configured: boolean
  version?: string
  mode?: 'official' | 'custom'
  provider?: string
}> {
  const cliInstalled = await isGeminiCliInstalled()
  const configured = isGeminiConfigured()
  const settings = readGeminiSettings()

  let version: string | undefined
  if (cliInstalled) {
    version = (await getGeminiCliVersion()) || undefined
  }

  return {
    installed: cliInstalled,
    configured,
    version,
    mode: settings?.mode,
    provider: settings?.mode === 'custom'
      ? settings.customProvider?.name
      : 'Google Gemini Official',
  }
}

/**
 * Display Gemini status
 */
export async function displayGeminiStatus(): Promise<void> {
  ensureI18nInitialized()

  console.log(i18n.t('gemini:status.header'))
  console.log('─'.repeat(60))

  const status = await getGeminiStatus()

  console.log(`${i18n.t('gemini:status.cliInstalled')}: ${status.installed ? '✓' : '✗'}`)
  if (status.version) {
    console.log(`${i18n.t('gemini:status.version')}: ${status.version}`)
  }

  console.log(`${i18n.t('gemini:status.configured')}: ${status.configured ? '✓' : '✗'}`)

  if (status.configured) {
    console.log(`${i18n.t('gemini:status.mode')}: ${status.mode}`)
    console.log(`${i18n.t('gemini:status.provider')}: ${status.provider}`)

    const currentProvider = getCurrentProvider()
    if (currentProvider) {
      console.log(`${i18n.t('gemini:status.baseUrl')}: ${currentProvider.baseUrl}`)
      if (currentProvider.model) {
        console.log(`${i18n.t('gemini:status.model')}: ${currentProvider.model}`)
      }
    }
  }

  console.log('─'.repeat(60))
}

/**
 * Quick start guide
 */
export function displayGeminiQuickStart(): void {
  ensureI18nInitialized()

  console.log(i18n.t('gemini:quickStart.header'))
  console.log('─'.repeat(60))

  console.log(i18n.t('gemini:quickStart.officialMode'))
  console.log('  gemini -p "Your prompt here"')
  console.log()

  console.log(i18n.t('gemini:quickStart.customMode'))
  console.log('  zcf gemini config')
  console.log()

  console.log(i18n.t('gemini:quickStart.switchProvider'))
  console.log('  zcf gemini switch')
  console.log()

  console.log(i18n.t('gemini:quickStart.checkStatus'))
  console.log('  zcf gemini status')
  console.log()

  console.log('─'.repeat(60))
  console.log(i18n.t('gemini:quickStart.docs'))
  console.log('  https://ai.google.dev/gemini-api/docs/cli')
  console.log('  https://github.com/levi-0422/zcf')
}

/**
 * Gemini health check
 */
export async function healthCheck(): Promise<{
  healthy: boolean
  issues: string[]
}> {
  const issues: string[] = []

  // Check CLI installation
  const cliInstalled = await isGeminiCliInstalled()
  if (!cliInstalled) {
    issues.push(i18n.t('gemini:health.cliNotInstalled'))
  }

  // Check configuration
  const configured = isGeminiConfigured()
  if (!configured) {
    issues.push(i18n.t('gemini:health.notConfigured'))
  }

  // Check authentication
  const settings = readGeminiSettings()
  if (settings) {
    if (settings.mode === 'official') {
      const authType = getCurrentAuthType()
      if (!authType) {
        issues.push(i18n.t('gemini:health.authNotConfigured'))
      }
    }
    else if (settings.mode === 'custom') {
      if (!settings.customProvider?.enabled) {
        issues.push(i18n.t('gemini:health.customProviderNotEnabled'))
      }
      if (!settings.customProvider?.apiKey) {
        issues.push(i18n.t('gemini:health.apiKeyMissing'))
      }
    }
  }

  return {
    healthy: issues.length === 0,
    issues,
  }
}

/**
 * Display health check results
 */
export async function displayHealthCheck(): Promise<void> {
  ensureI18nInitialized()

  console.log(i18n.t('gemini:health.header'))
  console.log('─'.repeat(60))

  const health = await healthCheck()

  if (health.healthy) {
    console.log(`✓ ${i18n.t('gemini:health.allGood')}`)
  }
  else {
    console.log(`✗ ${i18n.t('gemini:health.issuesFound')}`)
    console.log()
    for (const issue of health.issues) {
      console.log(`  - ${issue}`)
    }
  }

  console.log('─'.repeat(60))
}
