import type { SupportedLang } from '../constants'
import ansis from 'ansis'
import { i18n } from '../i18n'
import { displayGeminiStatus, displayHealthCheck, setupGeminiInteractive, updateGeminiConfig } from '../utils/code-tools/gemini'
import { checkGeminiCliUpdate, updateGeminiCli } from '../utils/code-tools/gemini-installer'
import { installMcpServices, selectMcpServices } from '../utils/code-tools/gemini-mcp-manager'
import { uninstallGeminiInteractive } from '../utils/code-tools/gemini-uninstaller'
import { promptBoolean } from '../utils/toggle-prompt'

// Gemini menu helper functions
export async function runGeminiFullInit(): Promise<void> {
  const currentLang = i18n.language as SupportedLang
  await setupGeminiInteractive(currentLang)
}

export async function runGeminiConfigSwitch(): Promise<void> {
  // For now, just update the config
  // TODO: Implement interactive provider switching
  await updateGeminiConfig()
  console.log(ansis.green('✔ Configuration updated'))
}

export async function runGeminiConfigureMcp(): Promise<void> {
  const selectedServices = await selectMcpServices()
  if (selectedServices.length > 0) {
    installMcpServices(selectedServices)
    await updateGeminiConfig()
  }
}

export async function runGeminiStatus(): Promise<void> {
  await displayGeminiStatus()
}

export async function runGeminiHealthCheck(): Promise<void> {
  await displayHealthCheck()
}

export async function runGeminiUninstall(): Promise<void> {
  await uninstallGeminiInteractive()
}

export async function runGeminiCheckUpdates(): Promise<void> {
  const versionInfo = await checkGeminiCliUpdate()

  if (versionInfo.updateAvailable) {
    console.log(ansis.yellow(`Update available: ${versionInfo.version} → ${versionInfo.latest}`))

    const shouldUpdate = await promptBoolean({
      message: 'Would you like to update Gemini CLI now?',
      defaultValue: true,
    })

    if (shouldUpdate) {
      await updateGeminiCli()
      console.log(ansis.green('✔ Gemini CLI updated successfully'))
    }
  }
  else {
    console.log(ansis.green('✔ Gemini CLI is up to date'))
  }
}
