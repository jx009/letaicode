/**
 * Gemini CLI Configuration Types
 * Supports both official Gemini CLI and custom API providers
 */

/**
 * MCP Server Configuration
 */
export interface McpServerConfig {
  /** Command to execute */
  command: string
  /** Command arguments */
  args?: string[]
  /** Environment variables */
  env?: Record<string, string>
}

/**
 * Custom Command Configuration
 */
export interface CustomCommandConfig {
  /** Command prompt/description */
  prompt: string
  /** Model to use (optional) */
  model?: string
  /** Whether to include project context */
  includeContext?: boolean
  /** Additional parameters */
  parameters?: Record<string, any>
}

/**
 * Gemini Provider Configuration (similar to Codex)
 */
export interface GeminiProvider {
  /** Provider ID */
  id: string
  /** Provider display name */
  name: string
  /** API base URL */
  baseUrl: string
  /** API key */
  apiKey?: string
  /** Default model */
  model?: string
  /** Wire protocol type */
  wireProtocol?: 'openai' | 'anthropic' | 'gemini'
  /** Whether this provider is currently active */
  enabled: boolean
}

/**
 * Gemini CLI Settings Structure with Custom Provider Support
 * Supports both official Gemini CLI and custom API providers
 */
export interface GeminiSettings {
  /** Configuration version */
  version: string

  /** Operation mode: official or custom */
  mode?: 'official' | 'custom'

  /** Authentication configuration (for official mode) */
  authentication: {
    /** Auth type: oauth, api_key, or vertex_ai */
    type: 'oauth' | 'api_key' | 'vertex_ai'
    /** API key (if type is api_key) */
    apiKey?: string
    /** Vertex AI project ID (if type is vertex_ai) */
    vertexAiProject?: string
  }

  /** Custom provider configuration */
  customProvider?: {
    /** Whether custom provider is enabled */
    enabled: boolean
    /** Provider ID (e.g., '302ai', 'glm', 'minimax', 'kimi') */
    id: string
    /** Provider display name */
    name: string
    /** Custom API base URL */
    baseUrl: string
    /** API key for custom provider */
    apiKey: string
    /** Model name for custom provider */
    model?: string
    /** Wire protocol: openai, anthropic, or gemini */
    wireProtocol?: 'openai' | 'anthropic' | 'gemini'
  }

  /** Model configuration */
  model: {
    /** Default model for standard tasks */
    default: string
    /** Fast model for quick responses */
    fast: string
    /** Model preferences */
    preferences?: {
      temperature?: number
      topP?: number
      topK?: number
      maxOutputTokens?: number
    }
  }

  /** Built-in tools configuration */
  tools?: {
    /** Enabled tool names */
    enabled: string[]
    /** Google Search specific config */
    googleSearch?: {
      grounding: boolean
    }
  }

  /** MCP (Model Context Protocol) servers */
  mcpServers?: Record<string, McpServerConfig>

  /** Custom commands */
  customCommands?: Record<string, CustomCommandConfig>

  /** UI preferences */
  ui?: {
    theme?: 'light' | 'dark' | 'auto'
    language?: 'zh-CN' | 'en'
    keyboardShortcuts?: Record<string, string>
  }

  /** Telemetry settings */
  telemetry?: {
    enabled: boolean
  }
}

/**
 * Gemini Installation Options
 */
export interface GeminiInstallOptions {
  /** Target language */
  lang: 'zh-CN' | 'en'
  /** Installation mode */
  mode?: 'official' | 'custom'
  /** Authentication type (for official mode) */
  authType?: 'oauth' | 'api_key' | 'vertex_ai'
  /** API key (if authType is api_key) */
  apiKey?: string
  /** Vertex AI project (if authType is vertex_ai) */
  vertexAiProject?: string
  /** Custom provider configuration */
  customProvider?: {
    id: string
    baseUrl: string
    apiKey: string
    model?: string
  }
  /** Install via npm or brew */
  installMethod?: 'npm' | 'brew' | 'skip'
  /** Force reinstall */
  force?: boolean
  /** MCP services to install */
  mcpServices?: string[]
  /** Custom commands to install */
  customCommands?: string[]
}

/**
 * Gemini CLI Version Info
 */
export interface GeminiVersionInfo {
  /** Installed version */
  version: string
  /** Latest available version */
  latest?: string
  /** Whether update is available */
  updateAvailable: boolean
}
