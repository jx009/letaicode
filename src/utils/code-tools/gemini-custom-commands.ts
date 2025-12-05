import type { CustomCommandConfig } from '../../types/gemini-config'
import inquirer from 'inquirer'
import { ensureI18nInitialized, i18n } from '../../i18n'
import { readGeminiSettings, updateGeminiSettings } from './gemini-config-manager'

/**
 * Predefined custom command templates
 */
export const GEMINI_CUSTOM_COMMAND_TEMPLATES: Record<string, CustomCommandConfig> = {
  'code-review': {
    prompt: 'Review the code in the current file for potential issues, best practices, and improvements',
    includeContext: true,
    parameters: {
      focusAreas: ['security', 'performance', 'maintainability'],
    },
  },
  'explain-code': {
    prompt: 'Explain the code in the current file in detail, including its purpose, structure, and key concepts',
    includeContext: true,
  },
  'generate-tests': {
    prompt: 'Generate comprehensive unit tests for the code in the current file',
    includeContext: true,
    parameters: {
      framework: 'auto-detect',
    },
  },
  'refactor': {
    prompt: 'Suggest refactoring improvements for the code in the current file to improve readability and maintainability',
    includeContext: true,
  },
  'add-docs': {
    prompt: 'Add comprehensive documentation comments to the code in the current file',
    includeContext: true,
    parameters: {
      style: 'JSDoc',
    },
  },
  'find-bugs': {
    prompt: 'Analyze the code for potential bugs, edge cases, and error handling issues',
    includeContext: true,
  },
  'optimize': {
    prompt: 'Suggest performance optimizations for the code in the current file',
    includeContext: true,
  },
  'translate': {
    prompt: 'Translate comments and documentation in the current file to the specified language',
    includeContext: true,
    parameters: {
      targetLanguage: 'en',
    },
  },
}

/**
 * Add custom command to configuration
 */
export function addCustomCommand(
  name: string,
  config: CustomCommandConfig,
): void {
  ensureI18nInitialized()

  if (!name || name.trim() === '') {
    throw new Error(i18n.t('gemini:customCommand.nameRequired'))
  }

  if (!config.prompt || config.prompt.trim() === '') {
    throw new Error(i18n.t('gemini:customCommand.promptRequired'))
  }

  const settings = readGeminiSettings()
  if (!settings) {
    throw new Error(i18n.t('gemini:configNotFound'))
  }

  const customCommands = settings.customCommands || {}
  customCommands[name] = config

  updateGeminiSettings({
    customCommands,
  })

  console.log(i18n.t('gemini:customCommand.commandAdded', { name }))
}

/**
 * Remove custom command from configuration
 */
export function removeCustomCommand(name: string): void {
  ensureI18nInitialized()

  const settings = readGeminiSettings()
  if (!settings || !settings.customCommands) {
    return
  }

  const customCommands = { ...settings.customCommands }
  delete customCommands[name]

  updateGeminiSettings({
    customCommands,
  })

  console.log(i18n.t('gemini:customCommand.commandRemoved', { name }))
}

/**
 * List configured custom commands
 */
export function listCustomCommands(): Record<string, CustomCommandConfig> {
  const settings = readGeminiSettings()
  return settings?.customCommands || {}
}

/**
 * Install multiple custom commands at once
 */
export function installCustomCommands(commandNames: string[]): void {
  ensureI18nInitialized()

  const settings = readGeminiSettings()
  if (!settings) {
    throw new Error(i18n.t('gemini:configNotFound'))
  }

  const customCommands = settings.customCommands || {}

  for (const commandName of commandNames) {
    if (GEMINI_CUSTOM_COMMAND_TEMPLATES[commandName]) {
      customCommands[commandName] = GEMINI_CUSTOM_COMMAND_TEMPLATES[commandName]
      console.log(i18n.t('gemini:customCommand.commandInstalled', { name: commandName }))
    }
    else {
      console.warn(i18n.t('gemini:customCommand.templateNotFound', { name: commandName }))
    }
  }

  updateGeminiSettings({
    customCommands,
  })
}

/**
 * Interactive custom command selection
 */
export async function selectCustomCommands(): Promise<string[]> {
  ensureI18nInitialized()

  const choices = Object.keys(GEMINI_CUSTOM_COMMAND_TEMPLATES).map(id => ({
    name: `${id} - ${GEMINI_CUSTOM_COMMAND_TEMPLATES[id].prompt.slice(0, 60)}...`,
    value: id,
    checked: false,
  }))

  const { selectedCommands } = await inquirer.prompt<{ selectedCommands: string[] }>([
    {
      type: 'checkbox',
      name: 'selectedCommands',
      message: i18n.t('gemini:customCommand.selectCommands'),
      choices,
    },
  ])

  return selectedCommands
}

/**
 * Check if custom command is configured
 */
export function isCustomCommandConfigured(name: string): boolean {
  const commands = listCustomCommands()
  return name in commands
}

/**
 * Get custom command configuration
 */
export function getCustomCommandConfig(name: string): CustomCommandConfig | null {
  const commands = listCustomCommands()
  return commands[name] || null
}

/**
 * Update custom command configuration
 */
export function updateCustomCommand(
  name: string,
  updates: Partial<CustomCommandConfig>,
): void {
  ensureI18nInitialized()

  const settings = readGeminiSettings()
  if (!settings || !settings.customCommands) {
    throw new Error(i18n.t('gemini:customCommand.commandNotFound', { name }))
  }

  const currentConfig = settings.customCommands[name]
  if (!currentConfig) {
    throw new Error(i18n.t('gemini:customCommand.commandNotFound', { name }))
  }

  settings.customCommands[name] = {
    ...currentConfig,
    ...updates,
  }

  updateGeminiSettings({
    customCommands: settings.customCommands,
  })

  console.log(i18n.t('gemini:customCommand.commandUpdated', { name }))
}

/**
 * Interactive custom command creation
 */
export async function createCustomCommandInteractive(): Promise<void> {
  ensureI18nInitialized()

  console.log(i18n.t('gemini:customCommand.createNew'))

  const { name } = await inquirer.prompt<{ name: string }>([
    {
      type: 'input',
      name: 'name',
      message: i18n.t('gemini:customCommand.enterName'),
      validate: (input: string) => {
        if (!input || input.trim() === '') {
          return i18n.t('gemini:customCommand.nameRequired')
        }
        if (isCustomCommandConfigured(input)) {
          return i18n.t('gemini:customCommand.nameAlreadyExists', { name: input })
        }
        return true
      },
    },
  ])

  const { prompt } = await inquirer.prompt<{ prompt: string }>([
    {
      type: 'input',
      name: 'prompt',
      message: i18n.t('gemini:customCommand.enterPrompt'),
      validate: (input: string) => {
        if (!input || input.trim() === '') {
          return i18n.t('gemini:customCommand.promptRequired')
        }
        return true
      },
    },
  ])

  const { includeContext } = await inquirer.prompt<{ includeContext: boolean }>([
    {
      type: 'confirm',
      name: 'includeContext',
      message: i18n.t('gemini:customCommand.includeContext'),
      default: true,
    },
  ])

  const { useModel } = await inquirer.prompt<{ useModel: boolean }>([
    {
      type: 'confirm',
      name: 'useModel',
      message: i18n.t('gemini:customCommand.specifyModel'),
      default: false,
    },
  ])

  let model: string | undefined
  if (useModel) {
    const answer = await inquirer.prompt<{ model: string }>([
      {
        type: 'input',
        name: 'model',
        message: i18n.t('gemini:customCommand.enterModel'),
      },
    ])
    model = answer.model
  }

  const config: CustomCommandConfig = {
    prompt,
    includeContext,
    model,
  }

  addCustomCommand(name, config)
}

/**
 * Get all available custom command names (configured + templates)
 */
export function getAllCustomCommandNames(): string[] {
  const configured = Object.keys(listCustomCommands())
  const templates = Object.keys(GEMINI_CUSTOM_COMMAND_TEMPLATES)

  return Array.from(new Set([...configured, ...templates]))
}
