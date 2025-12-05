import type { GeminiSettings, McpServerConfig } from '../../types/gemini-config'
import inquirer from 'inquirer'
import { ensureI18nInitialized, i18n } from '../../i18n'
import { readGeminiSettings, updateGeminiSettings } from './gemini-config-manager'

/**
 * MCP Service configurations
 * These are commonly used MCP servers
 */
export const GEMINI_MCP_SERVICES: Record<string, McpServerConfig> = {
  github: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: {
      GITHUB_TOKEN: '${GITHUB_TOKEN}',
    },
  },
  filesystem: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/allowed/files'],
  },
  postgres: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-postgres', 'postgresql://localhost/mydb'],
  },
  puppeteer: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-puppeteer'],
  },
  slack: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-slack'],
    env: {
      SLACK_BOT_TOKEN: '${SLACK_BOT_TOKEN}',
    },
  },
  serena: {
    command: 'npx',
    args: ['-y', '@serenaai/mcp', '--context', 'gemini'],
  },
}

/**
 * Add MCP server to configuration
 */
export function addMcpServer(
  name: string,
  config: McpServerConfig,
): void {
  ensureI18nInitialized()
  const settings = readGeminiSettings()
  if (!settings) {
    throw new Error(i18n.t('gemini:configNotFound'))
  }

  const mcpServers = settings.mcpServers || {}
  mcpServers[name] = config

  updateGeminiSettings({
    mcpServers,
  })

  console.log(i18n.t('gemini:mcp.serverAdded', { name }))
}

/**
 * Remove MCP server from configuration
 */
export function removeMcpServer(name: string): void {
  ensureI18nInitialized()
  const settings = readGeminiSettings()
  if (!settings || !settings.mcpServers) {
    return
  }

  const mcpServers = { ...settings.mcpServers }
  delete mcpServers[name]

  updateGeminiSettings({
    mcpServers,
  })

  console.log(i18n.t('gemini:mcp.serverRemoved', { name }))
}

/**
 * List configured MCP servers
 */
export function listMcpServers(): Record<string, McpServerConfig> {
  const settings = readGeminiSettings()
  return settings?.mcpServers || {}
}

/**
 * Install multiple MCP services at once
 */
export function installMcpServices(serviceNames: string[]): void {
  ensureI18nInitialized()
  const settings = readGeminiSettings()
  if (!settings) {
    throw new Error(i18n.t('gemini:configNotFound'))
  }

  const mcpServers = settings.mcpServers || {}

  for (const serviceName of serviceNames) {
    if (GEMINI_MCP_SERVICES[serviceName]) {
      mcpServers[serviceName] = GEMINI_MCP_SERVICES[serviceName]
      console.log(i18n.t('gemini:mcp.serviceInstalled', { name: serviceName }))
    }
    else {
      console.warn(i18n.t('gemini:mcp.serviceNotFound', { name: serviceName }))
    }
  }

  updateGeminiSettings({
    mcpServers,
  })
}

/**
 * Interactive MCP service selection
 */
export async function selectMcpServices(): Promise<string[]> {
  ensureI18nInitialized()

  const choices = Object.keys(GEMINI_MCP_SERVICES).map(id => ({
    name: id,
    value: id,
    checked: false,
  }))

  const { selectedServices } = await inquirer.prompt<{ selectedServices: string[] }>([
    {
      type: 'checkbox',
      name: 'selectedServices',
      message: i18n.t('gemini:mcp.selectServices'),
      choices,
    },
  ])

  return selectedServices
}

/**
 * Check if MCP server is configured
 */
export function isMcpServerConfigured(name: string): boolean {
  const servers = listMcpServers()
  return name in servers
}

/**
 * Get MCP server configuration
 */
export function getMcpServerConfig(name: string): McpServerConfig | null {
  const servers = listMcpServers()
  return servers[name] || null
}
