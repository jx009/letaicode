# 🎯 ZCF Support for Gemini CLI - Complete Technical Plan

**Document Version:** 3.0.0 (Updated)
**Created Date:** 2025-12-05
**Updated Date:** 2025-12-05
**Target Version:** v3.5.0
**Estimated Development Time:** 16 days (adjusted for custom API provider support)

> ⚠️ **Critical Update (v3.0.0)**: This plan supports BOTH official Gemini CLI AND custom API providers (like Claude Code and Codex), allowing users to use third-party Gemini-compatible APIs with custom URLs and keys.

---

## 📋 Table of Contents

1. [Overview](#-1-overview)
2. [Architecture Design](#-2-architecture-design)
3. [Core Module Implementation](#-3-core-module-implementation)
4. [Implementation Steps](#-4-implementation-steps)
5. [Testing Strategy](#-5-testing-strategy)
6. [Expected Results](#-6-expected-results)
7. [Important Notes](#-7-important-notes)
8. [Summary](#-8-summary)

---

## 📋 1. Overview

### 1.1 Core Objectives

Add official Gemini CLI support to ZCF, placing it on equal footing with Claude Code and Codex, providing complete installation, configuration, management, and uninstallation capabilities.

### 1.2 Implementation Strategy

**Dual-Mode Support (Official + Custom Providers):**

ZCF will support TWO modes for Gemini, similar to how it handles Claude Code and Codex:

#### Mode 1: Official Gemini CLI
- **Official Package**: Use `@google/gemini-cli` from npm/Homebrew
- **Authentication**: OAuth, API Key, and Vertex AI (Google official endpoints)
- **MCP Integration**: Leverage native MCP (Model Context Protocol) support
- **Custom Commands**: Utilize official custom command system
- **Context Files**: Support `GEMINI.md` for project-level context

#### Mode 2: Custom API Providers (NEW)
- **Custom Base URL**: Support third-party Gemini-compatible API providers
- **Provider Presets**: Pre-configured settings for popular providers (302.AI, GLM, MiniMax, Kimi, etc.)
- **API Key Management**: Custom API key configuration for each provider
- **Model Selection**: Support for custom model names
- **Configuration Format**: JSON-based `~/.gemini/settings.json` with custom API section

**Key Design Principle**:
- Users can choose between official Google APIs OR custom third-party providers
- Configuration management mirrors Claude Code and Codex patterns for consistency
- Provider switching is seamless, similar to existing ZCF provider management

### 1.3 Official Gemini CLI Research

Based on research conducted on 2025-12-05:

**Official Repository**: [google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli)

**Key Features:**
- ✅ **Free Tier**: 60 requests/min and 1,000 requests/day with Google account
- ✅ **Powerful Model**: Gemini 2.5 Pro with 1M token context window
- ✅ **Built-in Tools**: Google Search grounding, file operations, shell commands, web fetching
- ✅ **MCP Support**: Native Model Context Protocol for custom integrations
- ✅ **Terminal-First**: Designed for developers who live in the command line
- ✅ **Open Source**: Apache 2.0 licensed

**Installation Methods:**
```bash
# NPM global install
npm install -g @google/gemini-cli

# Homebrew (macOS/Linux)
brew install gemini-cli

# Run instantly without installation
npx https://github.com/google-gemini/gemini-cli
```

**References**:
- [GitHub Repository](https://github.com/google-gemini/gemini-cli)
- [Official Documentation](https://geminicli.com/docs/)
- [NPM Package](https://www.npmjs.com/package/@google/gemini-cli)
- [Authentication Guide](https://github.com/google-gemini/gemini-cli/blob/main/docs/get-started/authentication.md)
- [Configuration Guide](https://github.com/google-gemini/gemini-cli/blob/main/docs/get-started/configuration.md)

---

## 📁 2. Architecture Design

### 2.1 Directory Structure

```
zcf/
├── src/
│   ├── constants.ts                    # Add 'gemini' to CODE_TOOL_TYPES
│   ├── config/
│   │   ├── api-providers.ts            # ⭐ Add Gemini to provider presets (NEW)
│   │   └── gemini-mcp-services.ts      # ⭐ New: Gemini MCP service configs
│   ├── types/
│   │   └── gemini-config.ts            # ⭐ New: Gemini type definitions (JSON-based)
│   ├── utils/
│   │   └── code-tools/
│   │       ├── gemini.ts                      # ⭐ New: Main entry point
│   │       ├── gemini-installer.ts            # ⭐ Install official CLI
│   │       ├── gemini-config-manager.ts       # ⭐ Manage settings.json
│   │       ├── gemini-provider-manager.ts     # ⭐ NEW: Custom provider management
│   │       ├── gemini-auth-manager.ts         # ⭐ Authentication management
│   │       ├── gemini-mcp-manager.ts          # ⭐ MCP server configuration
│   │       ├── gemini-custom-commands.ts      # ⭐ Custom command integration
│   │       ├── gemini-context-manager.ts      # ⭐ GEMINI.md management
│   │       ├── gemini-config-switch.ts        # ⭐ NEW: Provider switching
│   │       └── gemini-uninstaller.ts          # ⭐ Uninstallation
│   ├── i18n/
│   │   └── locales/
│   │       ├── zh-CN/
│   │       │   └── gemini.json         # ⭐ Chinese translations
│   │       └── en/
│   │           └── gemini.json         # ⭐ English translations
│   └── commands/
│       ├── init.ts                     # Modified: Add Gemini init
│       ├── menu.ts                     # Modified: Add Gemini menu
│       ├── config-switch.ts            # Modified: Support Gemini
│       └── uninstall.ts                # Modified: Support Gemini
├── templates/
│   └── gemini/                         # ⭐ New: Gemini templates
│       ├── zh-CN/
│       │   ├── context/                # GEMINI.md templates
│       │   ├── custom-commands/        # Custom command templates
│       │   └── output-styles/          # AI personality styles
│       └── en/
│           ├── context/
│           ├── custom-commands/
│           └── output-styles/
└── tests/
    └── unit/
        └── utils/
            └── code-tools/
                ├── gemini.test.ts                      # ⭐ Core tests
                ├── gemini-installer.test.ts            # ⭐ Installation tests
                ├── gemini-config-manager.test.ts       # ⭐ Config tests
                ├── gemini-auth-manager.test.ts         # ⭐ Auth tests
                ├── gemini-mcp-manager.test.ts          # ⭐ MCP tests
                ├── gemini-custom-commands.test.ts      # ⭐ Command tests
                └── gemini-uninstaller.test.ts          # ⭐ Uninstall tests
```

### 2.2 Configuration File Design

#### Gemini Configuration Path

```bash
# ~/.gemini/ directory structure (Official Gemini CLI)
~/.gemini/
├── settings.json        # Main configuration file (Official format)
├── GEMINI.md            # Global context file (optional)
├── checkpoints/         # Conversation checkpoints
└── cache/               # Token cache
```

#### Official settings.json Format (with Custom Provider Support)

```json
{
  "version": "1.0.0",
  "mode": "custom",  // ⭐ NEW: "official" or "custom"
  "authentication": {
    "type": "oauth",  // For official mode: oauth, api_key, vertex_ai
    "apiKey": "",     // For official API key mode
    "vertexAiProject": ""
  },
  "customProvider": {  // ⭐ NEW: Custom provider configuration
    "enabled": true,
    "id": "302ai",
    "name": "302.AI",
    "baseUrl": "https://api.302.ai/v1",
    "apiKey": "${GEMINI_API_KEY}",
    "model": "gemini-2.0-flash-exp",
    "wireProtocol": "openai"  // openai, anthropic, or gemini
  },
  "model": {
    "default": "gemini-2.5-pro",
    "fast": "gemini-2.5-flash",
    "preferences": {
      "temperature": 0.7,
      "topP": 0.95,
      "topK": 40,
      "maxOutputTokens": 8192
    }
  },
  "tools": {
    "enabled": ["fileSystem", "shell", "webFetch", "googleSearch"],
    "googleSearch": {
      "grounding": true
    }
  },
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/files"]
    }
  },
  "customCommands": {
    "review": {
      "prompt": "Review the code changes and provide detailed feedback",
      "model": "gemini-2.5-pro"
    },
    "explain": {
      "prompt": "Explain the following code in detail",
      "includeContext": true
    }
  },
  "ui": {
    "theme": "auto",
    "language": "zh-CN",
    "keyboardShortcuts": {
      "submitMessage": "Ctrl+Enter"
    }
  },
  "telemetry": {
    "enabled": false
  }
}
```

#### Project-level GEMINI.md Example

```markdown
# Project Context for Gemini CLI

## Project Overview
ZCF (Zero-Config Code Flow) is a CLI tool for configuring Claude Code, Codex, and Gemini CLI environments.

## Code Style
- TypeScript with strict mode
- ESM-only modules
- @antfu/eslint-config for linting
- Vitest for testing

## Key Files
- src/cli.ts - Main CLI entry point
- src/commands/ - Command implementations
- src/utils/ - Utility modules
- templates/ - Configuration templates

## Testing Guidelines
- TDD approach required
- 80% minimum coverage
- Unit tests in tests/unit/
- Integration tests in tests/integration/

## Important Notes
- All user-facing text must support i18n
- Platform-specific code in src/utils/platform.ts
- Never commit sensitive credentials
```

### 2.3 Comparison: Official vs Custom Implementation

| Aspect | Original Plan (Custom) | v2.0 (Official CLI) | **v3.0 (Dual Mode)** |
|--------|----------------------|-------------------|----------------------|
| **CLI Implementation** | Build from scratch | ✅ Use `@google/gemini-cli` | ✅ **Official + Custom Providers** |
| **Config Format** | TOML | ✅ JSON (Official format) | ✅ **JSON with custom provider section** |
| **Config Location** | `~/.gemini/config.toml` | ✅ `~/.gemini/settings.json` | ✅ **`~/.gemini/settings.json`** |
| **Authentication** | Custom implementation | ✅ Official OAuth/API Key/Vertex AI | ✅ **Official + Custom API Keys** |
| **Custom Base URL** | Not planned | ❌ Not supported | ✅ **Fully Supported** |
| **Provider Presets** | Not planned | ❌ No | ✅ **Yes (302.AI, GLM, MiniMax, Kimi)** |
| **Provider Switching** | Not planned | ❌ No | ✅ **Yes (like Codex)** |
| **MCP Support** | Not planned | ✅ Native MCP support | ✅ **Native MCP support** |
| **Custom Commands** | Manual implementation | ✅ Official custom commands | ✅ **Official custom commands** |
| **Context Files** | Not planned | ✅ GEMINI.md support | ✅ **GEMINI.md support** |
| **Built-in Tools** | Limited | ✅ File, Shell, Web, Google Search | ✅ **File, Shell, Web, Google Search** |
| **Development Time** | 17 days | 15 days | ⭐ **16 days** (1 day for provider management) |
| **Maintenance** | High (custom code) | Low (official package) | ✅ **Low (official + thin provider layer)** |
| **Use Cases** | Limited | Official Google APIs only | ✅ **Official + Third-party providers** |

---

## 🔧 3. Core Module Implementation

### 3.1 Constants Definition (constants.ts)

```typescript
import { homedir } from 'node:os'
import { join } from 'pathe'

// Add Gemini to code tool types
export const CODE_TOOL_TYPES = ['claude-code', 'codex', 'gemini'] as const
export type CodeToolType = (typeof CODE_TOOL_TYPES)[number]

// Gemini configuration paths (Official CLI structure)
export const GEMINI_DIR = join(homedir(), '.gemini')
export const GEMINI_SETTINGS_FILE = join(GEMINI_DIR, 'settings.json')
export const GEMINI_CONTEXT_FILE = join(GEMINI_DIR, 'GEMINI.md')
export const GEMINI_CHECKPOINTS_DIR = join(GEMINI_DIR, 'checkpoints')
export const GEMINI_CACHE_DIR = join(GEMINI_DIR, 'cache')

// Banner
export const CODE_TOOL_BANNERS: Record<CodeToolType, string> = {
  'claude-code': 'for Claude Code',
  'codex': 'for Codex',
  'gemini': 'for Gemini CLI',
}

// Short aliases
export const CODE_TOOL_ALIASES: Record<string, CodeToolType> = {
  cc: 'claude-code',
  cx: 'codex',
  gm: 'gemini',  // New alias
}
```

### 3.2 Type Definitions (types/gemini-config.ts)

```typescript
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

  /** ⭐ NEW: Custom provider configuration */
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
 * ⭐ NEW: Gemini Provider Configuration (similar to Codex)
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
 * Gemini Installation Options
 */
export interface GeminiInstallOptions {
  /** Target language */
  lang: 'zh-CN' | 'en'
  /** ⭐ NEW: Installation mode */
  mode?: 'official' | 'custom'
  /** Authentication type (for official mode) */
  authType?: 'oauth' | 'api_key' | 'vertex_ai'
  /** API key (if authType is api_key) */
  apiKey?: string
  /** Vertex AI project (if authType is vertex_ai) */
  vertexAiProject?: string
  /** ⭐ NEW: Custom provider configuration */
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
```

### 3.3 Gemini Installer (gemini-installer.ts)

```typescript
import { exec } from 'tinyexec'
import { existsSync } from 'node:fs'
import { i18n } from '../../i18n'
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
  } catch {
    return null
  }
}

/**
 * Install Gemini CLI using npm
 */
export async function installGeminiCliNpm(global = true): Promise<void> {
  const command = global ? 'npm install -g @google/gemini-cli' : 'npm install @google/gemini-cli'

  console.log(i18n.t('gemini:installing', { method: 'npm' }))

  try {
    await exec('npm', ['install', global ? '-g' : '', '@google/gemini-cli'].filter(Boolean))
    console.log(i18n.t('gemini:installSuccess'))
  } catch (error) {
    throw new Error(i18n.t('gemini:installFailed', { error: error.message }))
  }
}

/**
 * Install Gemini CLI using Homebrew (macOS/Linux)
 */
export async function installGeminiCliBrew(): Promise<void> {
  if (!commandExists('brew')) {
    throw new Error(i18n.t('gemini:brewNotFound'))
  }

  console.log(i18n.t('gemini:installing', { method: 'Homebrew' }))

  try {
    await exec('brew', ['install', 'gemini-cli'])
    console.log(i18n.t('gemini:installSuccess'))
  } catch (error) {
    throw new Error(i18n.t('gemini:installFailed', { error: error.message }))
  }
}

/**
 * Install Gemini CLI with auto-detection
 */
export async function installGeminiCli(
  method?: 'npm' | 'brew' | 'auto'
): Promise<void> {
  // Check if already installed
  if (await isGeminiCliInstalled()) {
    console.log(i18n.t('gemini:alreadyInstalled'))
    return
  }

  // Auto-detect installation method
  if (method === 'auto' || !method) {
    if (commandExists('brew')) {
      await installGeminiCliBrew()
    } else if (commandExists('npm')) {
      await installGeminiCliNpm()
    } else {
      throw new Error(i18n.t('gemini:noInstallMethod'))
    }
  } else if (method === 'npm') {
    await installGeminiCliNpm()
  } else if (method === 'brew') {
    await installGeminiCliBrew()
  }
}

/**
 * Update Gemini CLI to latest version
 */
export async function updateGeminiCli(): Promise<void> {
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
  } catch (error) {
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
  } catch {
    return {
      version: installedVersion,
      updateAvailable: false,
    }
  }
}
```

### 3.4 Configuration Manager (gemini-config-manager.ts)

```typescript
import type { GeminiSettings } from '../../types/gemini-config'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { ensureDirSync } from 'fs-extra'
import { GEMINI_DIR, GEMINI_SETTINGS_FILE } from '../../constants'
import { i18n } from '../../i18n'

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
  } catch (error) {
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
  } catch (error) {
    throw new Error(i18n.t('gemini:configWriteError') + `: ${error}`)
  }
}

/**
 * Ensure Gemini directory exists
 */
export function ensureGeminiDir(): void {
  ensureDirSync(GEMINI_DIR)
  ensureDirSync(`${GEMINI_DIR}/checkpoints`)
  ensureDirSync(`${GEMINI_DIR}/cache`)
}

/**
 * Create default Gemini settings
 */
export function createDefaultGeminiSettings(
  authType: 'oauth' | 'api_key' | 'vertex_ai' = 'oauth',
  apiKey?: string,
  vertexAiProject?: string
): GeminiSettings {
  return {
    version: '1.0.0',
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
  }
}

/**
 * Update Gemini settings partially
 */
export function updateGeminiSettings(
  updates: Partial<GeminiSettings>
): void {
  const currentSettings = readGeminiSettings() || createDefaultGeminiSettings()

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
    },
  }

  writeGeminiSettings(newSettings)
}

/**
 * Backup Gemini settings
 */
export function backupGeminiSettings(): string {
  const settings = readGeminiSettings()
  if (!settings) {
    throw new Error(i18n.t('gemini:noConfigToBackup'))
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupPath = `${GEMINI_DIR}/settings.backup.${timestamp}.json`

  writeFileSync(backupPath, JSON.stringify(settings, null, 2), 'utf-8')

  return backupPath
}
```

### 3.5 Authentication Manager (gemini-auth-manager.ts)

```typescript
import type { GeminiSettings } from '../../types/gemini-config'
import { exec } from 'tinyexec'
import { i18n } from '../../i18n'
import { readGeminiSettings, updateGeminiSettings } from './gemini-config-manager'

/**
 * Configure OAuth authentication
 * This guides the user through the official Gemini CLI login flow
 */
export async function configureOAuth(): Promise<void> {
  console.log(i18n.t('gemini:auth.oauthInstructions'))
  console.log(i18n.t('gemini:auth.runCommand', { command: 'gemini' }))

  // Update settings to use OAuth
  updateGeminiSettings({
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
  if (!apiKey || apiKey.trim() === '') {
    throw new Error(i18n.t('gemini:auth.apiKeyRequired'))
  }

  // Set environment variable
  process.env.GEMINI_API_KEY = apiKey

  // Update settings
  updateGeminiSettings({
    authentication: {
      type: 'api_key',
      apiKey,
    },
  })

  console.log(i18n.t('gemini:auth.apiKeyConfigured'))
}

/**
 * Configure Vertex AI authentication
 */
export async function configureVertexAi(
  projectId: string,
  apiKey: string
): Promise<void> {
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
  } catch {
    return false
  }
}
```

### 3.6 Provider Manager (gemini-provider-manager.ts) ⭐ NEW

```typescript
import type { GeminiProvider, GeminiSettings } from '../../types/gemini-config'
import { i18n } from '../../i18n'
import { getProviderPreset } from '../../config/api-providers'
import { readGeminiSettings, updateGeminiSettings } from './gemini-config-manager'

/**
 * Get current custom provider configuration
 */
export function getCurrentProvider(): GeminiProvider | null {
  const settings = readGeminiSettings()
  if (!settings || !settings.customProvider || !settings.customProvider.enabled) {
    return null
  }

  const cp = settings.customProvider
  return {
    id: cp.id,
    name: cp.name,
    baseUrl: cp.baseUrl,
    apiKey: cp.apiKey,
    model: cp.model,
    wireProtocol: cp.wireProtocol,
    enabled: cp.enabled,
  }
}

/**
 * List available provider presets from api-providers.ts
 */
export function listAvailableProviders(): GeminiProvider[] {
  // This would integrate with api-providers.ts to get Gemini-compatible providers
  const presets = [
    { id: '302ai', name: '302.AI' },
    { id: 'glm', name: 'GLM' },
    { id: 'minimax', name: 'MiniMax' },
    { id: 'kimi', name: 'Kimi' },
    { id: 'custom', name: 'Custom Provider' },
  ]

  return presets.map(p => ({
    id: p.id,
    name: p.name,
    baseUrl: '',
    enabled: false,
  }))
}

/**
 * Switch to a custom provider
 */
export function switchToCustomProvider(
  providerId: string,
  apiKey: string,
  baseUrl?: string,
  model?: string
): void {
  const settings = readGeminiSettings()
  if (!settings) {
    throw new Error(i18n.t('gemini:configNotFound'))
  }

  // Get provider preset if available
  const preset = getProviderPreset(providerId)
  let providerName = providerId
  let providerBaseUrl = baseUrl || ''

  if (preset && preset.supportedCodeTools.includes('gemini')) {
    providerName = preset.name
    // Use gemini-specific configuration if available
    providerBaseUrl = baseUrl || (preset as any).gemini?.baseUrl || ''
  }

  // Update settings to custom mode
  updateGeminiSettings({
    mode: 'custom',
    customProvider: {
      enabled: true,
      id: providerId,
      name: providerName,
      baseUrl: providerBaseUrl,
      apiKey,
      model: model || settings.customProvider?.model,
      wireProtocol: 'openai', // Default to OpenAI protocol for third-party providers
    },
  })

  console.log(i18n.t('gemini:providerSwitched', { provider: providerName }))
}

/**
 * Switch back to official Gemini mode
 */
export function switchToOfficialMode(): void {
  const settings = readGeminiSettings()
  if (!settings) {
    throw new Error(i18n.t('gemini:configNotFound'))
  }

  updateGeminiSettings({
    mode: 'official',
    customProvider: {
      ...settings.customProvider,
      enabled: false,
    } as any,
  })

  console.log(i18n.t('gemini:switchedToOfficial'))
}

/**
 * Update current provider settings
 */
export function updateProviderSettings(updates: Partial<GeminiProvider>): void {
  const settings = readGeminiSettings()
  if (!settings || !settings.customProvider) {
    throw new Error(i18n.t('gemini:noCustomProvider'))
  }

  updateGeminiSettings({
    customProvider: {
      ...settings.customProvider,
      ...updates,
    },
  })

  console.log(i18n.t('gemini:providerUpdated'))
}
```

### 3.7 Configuration Switch (gemini-config-switch.ts) ⭐ NEW

```typescript
import type { GeminiProvider } from '../../types/gemini-config'
import inquirer from 'inquirer'
import ansis from 'ansis'
import { i18n } from '../../i18n'
import { getProviderPreset, API_PROVIDER_PRESETS } from '../../config/api-providers'
import {
  getCurrentProvider,
  listAvailableProviders,
  switchToCustomProvider,
  switchToOfficialMode,
} from './gemini-provider-manager'

/**
 * Interactive provider switching menu (similar to Codex)
 */
export async function runGeminiConfigSwitch(): Promise<void> {
  const currentProvider = getCurrentProvider()

  console.log(ansis.cyan(`\n${i18n.t('gemini:configSwitch.title')}\n`))

  if (currentProvider) {
    console.log(ansis.blue(`ℹ ${i18n.t('gemini:configSwitch.currentProvider')}`))
    console.log(ansis.gray(`  ${i18n.t('common:name')}: ${currentProvider.name}`))
    console.log(ansis.gray(`  ${i18n.t('common:id')}: ${currentProvider.id}`))
    console.log(ansis.gray(`  ${i18n.t('gemini:baseUrl')}: ${currentProvider.baseUrl}`))
    console.log(ansis.gray(`  ${i18n.t('gemini:model')}: ${currentProvider.model || 'N/A'}\n`))
  } else {
    console.log(ansis.yellow(`ℹ ${i18n.t('gemini:configSwitch.officialMode')}\n`))
  }

  // Get available provider presets
  const geminiProviders = API_PROVIDER_PRESETS.filter(p =>
    p.supportedCodeTools.includes('gemini')
  )

  const choices = [
    {
      name: i18n.t('gemini:configSwitch.useOfficial'),
      value: 'official',
    },
    new inquirer.Separator(),
    ...geminiProviders.map(p => ({
      name: `${p.name} ${p.description ? `(${p.description})` : ''}`,
      value: p.id,
    })),
    new inquirer.Separator(),
    {
      name: i18n.t('gemini:configSwitch.customProvider'),
      value: 'custom',
    },
  ]

  const { selectedProvider } = await inquirer.prompt<{ selectedProvider: string }>([
    {
      type: 'list',
      name: 'selectedProvider',
      message: i18n.t('gemini:configSwitch.selectProvider'),
      choices,
    },
  ])

  if (selectedProvider === 'official') {
    switchToOfficialMode()
    return
  }

  // Get provider preset details
  const preset = getProviderPreset(selectedProvider)
  let baseUrl = ''
  let model = ''

  if (preset && selectedProvider !== 'custom') {
    // Pre-fill with preset values
    const geminiConfig = (preset as any).gemini
    if (geminiConfig) {
      baseUrl = geminiConfig.baseUrl || ''
      model = geminiConfig.defaultModel || ''
    }
  }

  // Prompt for API key and optional overrides
  const { apiKey, customBaseUrl, customModel } = await inquirer.prompt<{
    apiKey: string
    customBaseUrl?: string
    customModel?: string
  }>([
    {
      type: 'input',
      name: 'apiKey',
      message: i18n.t('gemini:configSwitch.enterApiKey'),
      validate: (input: string) => !!input || i18n.t('api:keyRequired'),
    },
    {
      type: 'input',
      name: 'customBaseUrl',
      message: i18n.t('gemini:configSwitch.enterBaseUrl'),
      default: baseUrl,
      when: () => selectedProvider === 'custom' || !baseUrl,
    },
    {
      type: 'input',
      name: 'customModel',
      message: i18n.t('gemini:configSwitch.enterModel'),
      default: model || 'gemini-2.0-flash-exp',
    },
  ])

  // Switch to custom provider
  switchToCustomProvider(
    selectedProvider,
    apiKey,
    customBaseUrl || baseUrl,
    customModel || model
  )

  console.log(ansis.green(`\n✔ ${i18n.t('gemini:configSwitch.success')}`))
}

/**
 * List all configured providers
 */
export async function listGeminiProviders(): Promise<void> {
  const current = getCurrentProvider()
  const available = listAvailableProviders()

  console.log(ansis.cyan(`\n${i18n.t('gemini:providers.title')}\n`))

  if (current) {
    console.log(ansis.green(`✓ ${i18n.t('gemini:providers.current')}`))
    console.log(`  ${current.name} (${current.id})`)
    console.log(`  ${current.baseUrl}\n`)
  }

  console.log(ansis.blue(`${i18n.t('gemini:providers.available')}`))
  available.forEach(p => {
    console.log(`  - ${p.name} (${p.id})`)
  })
}
```

### 3.8 MCP Manager (gemini-mcp-manager.ts)

```typescript
import type { GeminiSettings, McpServerConfig } from '../../types/gemini-config'
import { i18n } from '../../i18n'
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
}

/**
 * Add MCP server to configuration
 */
export function addMcpServer(
  name: string,
  config: McpServerConfig
): void {
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
  const settings = readGeminiSettings()
  if (!settings) {
    throw new Error(i18n.t('gemini:configNotFound'))
  }

  const mcpServers = settings.mcpServers || {}

  for (const serviceName of serviceNames) {
    if (GEMINI_MCP_SERVICES[serviceName]) {
      mcpServers[serviceName] = GEMINI_MCP_SERVICES[serviceName]
      console.log(i18n.t('gemini:mcp.serviceInstalled', { name: serviceName }))
    } else {
      console.warn(i18n.t('gemini:mcp.serviceNotFound', { name: serviceName }))
    }
  }

  updateGeminiSettings({
    mcpServers,
  })
}
```

### 3.7 Main Entry Point (gemini.ts)

```typescript
import type { GeminiInstallOptions } from '../../types/gemini-config'
import { i18n } from '../../i18n'
import { configureApiKey, configureOAuth, configureVertexAi } from './gemini-auth-manager'
import { createDefaultGeminiSettings, writeGeminiSettings } from './gemini-config-manager'
import { installGeminiCli, isGeminiCliInstalled } from './gemini-installer'
import { installMcpServices } from './gemini-mcp-manager'

/**
 * Full Gemini CLI initialization (with custom provider support)
 */
export async function runGeminiFullInit(options: GeminiInstallOptions): Promise<void> {
  console.log(i18n.t('gemini:initStart'))

  // Step 1: Determine mode (official or custom)
  const mode = options.mode || 'official'

  // Step 2: Install Gemini CLI if needed (only for official mode)
  if (mode === 'official' && !await isGeminiCliInstalled() && options.installMethod !== 'skip') {
    await installGeminiCli(options.installMethod || 'auto')
  }

  // Step 3: Create configuration based on mode
  let settings: GeminiSettings

  if (mode === 'custom' && options.customProvider) {
    // Custom provider mode
    settings = createDefaultGeminiSettings()
    settings.mode = 'custom'
    settings.customProvider = {
      enabled: true,
      id: options.customProvider.id,
      name: options.customProvider.id, // Will be updated by provider preset
      baseUrl: options.customProvider.baseUrl,
      apiKey: options.customProvider.apiKey,
      model: options.customProvider.model || 'gemini-2.0-flash-exp',
      wireProtocol: 'openai',
    }

    // Get provider preset if available
    const preset = getProviderPreset(options.customProvider.id)
    if (preset) {
      settings.customProvider.name = preset.name
    }
  } else {
    // Official mode
    settings = createDefaultGeminiSettings(
      options.authType,
      options.apiKey,
      options.vertexAiProject
    )
    settings.mode = 'official'
  }

  // Set UI language
  if (settings.ui) {
    settings.ui.language = options.lang
  }

  writeGeminiSettings(settings)
  console.log(i18n.t('gemini:configCreated'))

  // Step 4: Configure authentication (official mode only)
  if (mode === 'official') {
    if (options.authType === 'oauth') {
      await configureOAuth()
    } else if (options.authType === 'api_key' && options.apiKey) {
      await configureApiKey(options.apiKey)
    } else if (options.authType === 'vertex_ai' && options.vertexAiProject && options.apiKey) {
      await configureVertexAi(options.vertexAiProject, options.apiKey)
    }
  }

  // Step 5: Install MCP services
  if (options.mcpServices && options.mcpServices.length > 0) {
    installMcpServices(options.mcpServices)
  }

  // Step 6: Install custom commands (from templates)
  if (options.customCommands && options.customCommands.length > 0) {
    // Will be implemented in gemini-custom-commands.ts
    console.log(i18n.t('gemini:customCommandsInstalled'))
  }

  console.log(i18n.t('gemini:initComplete'))
}

// Export all public functions
export {
  isGeminiCliInstalled,
  installGeminiCli,
  updateGeminiCli,
  readGeminiSettings,
  writeGeminiSettings,
  configureOAuth,
  configureApiKey,
  configureVertexAi,
  addMcpServer,
  removeMcpServer,
  listMcpServers,
}
```

---

## 📝 4. Implementation Steps

### Phase 1: CLI Installation & Detection (Days 1-2)

**Tasks:**
1. ✅ Implement `gemini-installer.ts`
   - Check if Gemini CLI is installed
   - Install via npm or Homebrew
   - Version detection and update checking
2. ✅ Platform compatibility testing
   - Test on Windows/macOS/Linux
   - Handle platform-specific differences
3. ✅ Add to constants and type definitions
   - Update `constants.ts` with Gemini paths
   - Create `types/gemini-config.ts`

**Deliverables:**
- Working installation functions
- Platform detection logic
- Version management
- Type definitions

**Acceptance Criteria:**
- Can detect if Gemini CLI is installed
- Can install Gemini CLI on all platforms
- Can check for updates
- All types compile correctly

---

### Phase 2: Configuration Management (Days 3-4)

**Tasks:**
1. ✅ Implement `gemini-config-manager.ts`
   - Read/write `settings.json`
   - Create default configuration
   - Update configuration partially
   - Backup configuration
2. ✅ Implement JSON schema validation
3. ✅ Handle configuration migration (if needed)

**Deliverables:**
- Configuration CRUD operations
- Backup/restore functionality
- Schema validation
- Error handling

**Acceptance Criteria:**
- Can read existing settings.json
- Can create new settings.json
- Can update settings partially
- Can backup/restore configurations
- Handles malformed JSON gracefully

---

### Phase 3: Authentication Management (Days 5-6)

**Tasks:**
1. ✅ Implement `gemini-auth-manager.ts`
   - OAuth flow guidance
   - API Key configuration
   - Vertex AI configuration
   - Environment variable management
2. ✅ Authentication verification
3. ✅ Error handling and user guidance

**Deliverables:**
- Three authentication methods working
- Environment variable setup
- Verification function
- User-friendly error messages

**Acceptance Criteria:**
- OAuth flow completes successfully
- API Key auth works
- Vertex AI auth works
- Auth verification detects issues
- Clear error messages for users

---

### Phase 4: MCP Server Integration (Days 7-8)

**Tasks:**
1. ✅ Implement `gemini-mcp-manager.ts`
   - Add/remove MCP servers
   - List configured servers
   - Install common services
2. ✅ Define common MCP service configs
3. ✅ Integration with ZCF's MCP service list

**Deliverables:**
- MCP server management functions
- Common service configurations
- Integration with existing MCP configs

**Acceptance Criteria:**
- Can add/remove MCP servers
- Can list configured servers
- Common services install correctly
- Works with existing ZCF MCP configs

---

### Phase 4.5: Custom Provider Management (Day 8.5) ⭐ NEW

**Tasks:**
1. ✅ Implement `gemini-provider-manager.ts`
   - Current provider detection
   - Provider preset integration
   - Provider switching logic
   - Custom URL and API key management
2. ✅ Implement `gemini-config-switch.ts`
   - Interactive provider switching menu
   - Integration with api-providers.ts
   - Official/Custom mode switching
3. ✅ Add Gemini to `config/api-providers.ts`
   - Define Gemini provider presets
   - Add gemini field to existing providers

**Deliverables:**
- Provider management functions
- Provider switching interface
- API provider preset integration
- Seamless mode switching

**Acceptance Criteria:**
- Can switch between official and custom modes
- Provider presets work correctly
- Custom URLs and API keys are properly saved
- Config switching mirrors Codex behavior

---

### Phase 5: Custom Commands & Templates (Days 9-10)

**Tasks:**
1. ✅ Implement `gemini-custom-commands.ts`
   - Install custom commands from templates
   - Convert ZCF workflow templates
2. ✅ Implement `gemini-context-manager.ts`
   - Generate GEMINI.md files
   - Project-level context management
3. ✅ Create template structure
   - `templates/gemini/zh-CN/`
   - `templates/gemini/en/`

**Deliverables:**
- Custom command installation
- Template conversion logic
- GEMINI.md generation
- Bilingual templates

**Acceptance Criteria:**
- Custom commands install correctly
- Templates convert to Gemini format
- GEMINI.md generates properly
- Both languages supported

---

### Phase 6: Command Integration (Days 11-12)

**Tasks:**
1. ✅ Modify `commands/init.ts`
   - Add Gemini initialization flow
   - Support `--code-type gemini`
2. ✅ Modify `commands/menu.ts`
   - Add Gemini menu options
3. ✅ Modify `commands/config-switch.ts`
   - Support Gemini configuration switching
4. ✅ Modify `commands/uninstall.ts`
   - Support Gemini uninstallation

**Deliverables:**
- Gemini init command working
- Gemini in interactive menu
- Config switching working
- Uninstallation working

**Acceptance Criteria:**
- `npx zcf init -T gemini` works
- Gemini appears in menu
- Config switching works
- Uninstall removes Gemini config

---

### Phase 7: Testing (Days 13-14)

**Tasks:**
1. ✅ Write unit tests (10+ test files)
   - Installer tests
   - Config manager tests
   - Auth manager tests
   - MCP manager tests
2. ✅ Write integration tests
3. ✅ Write edge case tests
4. ✅ Achieve 80%+ coverage

**Deliverables:**
- Comprehensive test suite
- Integration tests
- Edge case coverage
- Coverage reports

**Acceptance Criteria:**
- All tests pass
- Coverage >= 80%
- CI/CD integration works
- No regressions in existing features

**Test Files:**
```
tests/unit/utils/code-tools/
├── gemini.test.ts
├── gemini-installer.test.ts
├── gemini-config-manager.test.ts
├── gemini-provider-manager.test.ts          # ⭐ NEW
├── gemini-config-switch.test.ts             # ⭐ NEW
├── gemini-auth-manager.test.ts
├── gemini-mcp-manager.test.ts
├── gemini-custom-commands.test.ts
├── gemini-context-manager.test.ts
├── gemini-uninstaller.test.ts
└── gemini.edge.test.ts
```

---

### Phase 8: Documentation & Release (Day 16)

**Tasks:**
1. ✅ Update README.md
   - Add Gemini examples
   - Update feature list
   - Add custom provider usage examples
2. ✅ Update CLAUDE.md
   - Document Gemini module
   - Update architecture diagram
   - Add provider management section
3. ✅ Update `config/api-providers.ts` ⭐
   - Add gemini field to all provider presets
   - Document Gemini-compatible endpoints
4. ✅ Write Gemini integration guide
5. ✅ Prepare release notes for v3.5.0

**Deliverables:**
- Updated documentation
- Gemini usage examples
- Integration guide
- Release notes
- API provider configuration examples

**Acceptance Criteria:**
- Documentation is complete
- Examples work correctly
- Guide covers all features (official + custom)
- Release notes are accurate
- API provider presets include Gemini support

---

## 🧪 5. Testing Strategy

### 5.1 Unit Tests (Target: 80%+ Coverage)

#### Installer Tests

```typescript
// tests/unit/utils/code-tools/gemini-installer.test.ts
import { describe, expect, it, vi } from 'vitest'
import {
  checkGeminiCliUpdate,
  getGeminiCliVersion,
  installGeminiCli,
  isGeminiCliInstalled,
  updateGeminiCli,
} from '../../../../../src/utils/code-tools/gemini-installer'

describe('Gemini Installer', () => {
  it('should detect if Gemini CLI is installed', async () => {
    vi.mock('../../../../../src/utils/platform', () => ({
      commandExists: vi.fn().mockReturnValue(true),
    }))

    const isInstalled = await isGeminiCliInstalled()
    expect(isInstalled).toBe(true)
  })

  it('should get installed version', async () => {
    vi.mock('tinyexec', () => ({
      exec: vi.fn().mockResolvedValue({
        stdout: '1.0.0\n',
        stderr: '',
      }),
    }))

    const version = await getGeminiCliVersion()
    expect(version).toBe('1.0.0')
  })

  it('should install via npm', async () => {
    vi.mock('tinyexec', () => ({
      exec: vi.fn().mockResolvedValue({}),
    }))

    await expect(installGeminiCli('npm')).resolves.not.toThrow()
  })

  it('should check for updates', async () => {
    const versionInfo = await checkGeminiCliUpdate()
    expect(versionInfo).toHaveProperty('version')
    expect(versionInfo).toHaveProperty('updateAvailable')
  })
})
```

#### Configuration Manager Tests

```typescript
// tests/unit/utils/code-tools/gemini-config-manager.test.ts
import { describe, expect, it } from 'vitest'
import {
  createDefaultGeminiSettings,
  readGeminiSettings,
  updateGeminiSettings,
  writeGeminiSettings,
} from '../../../../../src/utils/code-tools/gemini-config-manager'

describe('Gemini Config Manager', () => {
  it('should create default settings', () => {
    const settings = createDefaultGeminiSettings('oauth')

    expect(settings.version).toBe('1.0.0')
    expect(settings.authentication.type).toBe('oauth')
    expect(settings.model.default).toBe('gemini-2.5-pro')
  })

  it('should read and write settings', () => {
    const mockSettings = createDefaultGeminiSettings('api_key', 'test-key')

    writeGeminiSettings(mockSettings)
    const readSettings = readGeminiSettings()

    expect(readSettings).toEqual(mockSettings)
  })

  it('should update settings partially', () => {
    updateGeminiSettings({
      ui: {
        theme: 'dark',
        language: 'en',
      },
    })

    const settings = readGeminiSettings()
    expect(settings?.ui?.theme).toBe('dark')
    expect(settings?.ui?.language).toBe('en')
  })

  it('should handle missing config file', () => {
    vi.mock('node:fs', () => ({
      existsSync: vi.fn().mockReturnValue(false),
    }))

    const settings = readGeminiSettings()
    expect(settings).toBeNull()
  })
})
```

### 5.2 Integration Tests

```typescript
// tests/integration/gemini-full-workflow.test.ts
import { describe, expect, it } from 'vitest'
import { runGeminiFullInit } from '../../src/utils/code-tools/gemini'

describe('Gemini Full Workflow', () => {
  it('should complete full installation with OAuth', async () => {
    const options = {
      lang: 'zh-CN' as const,
      authType: 'oauth' as const,
      installMethod: 'npm' as const,
      mcpServices: ['github', 'filesystem'],
      force: true,
    }

    await runGeminiFullInit(options)

    // Verify CLI is installed
    const isInstalled = await isGeminiCliInstalled()
    expect(isInstalled).toBe(true)

    // Verify config exists
    const settings = readGeminiSettings()
    expect(settings).not.toBeNull()
    expect(settings?.authentication.type).toBe('oauth')
  })

  it('should complete installation with API Key', async () => {
    const options = {
      lang: 'en' as const,
      authType: 'api_key' as const,
      apiKey: 'test-api-key',
      installMethod: 'skip' as const,
      mcpServices: [],
    }

    await runGeminiFullInit(options)

    const settings = readGeminiSettings()
    expect(settings?.authentication.type).toBe('api_key')
    expect(settings?.authentication.apiKey).toBe('test-api-key')
  })
})
```

### 5.3 Edge Case Tests

```typescript
// tests/unit/utils/code-tools/gemini.edge.test.ts
import { describe, expect, it } from 'vitest'

describe('Gemini Edge Cases', () => {
  it('should handle corrupted settings.json', () => {
    vi.mock('node:fs', () => ({
      readFileSync: vi.fn().mockReturnValue('{ invalid json }'),
    }))

    const settings = readGeminiSettings()
    expect(settings).toBeNull()
  })

  it('should handle missing npm/brew', async () => {
    vi.mock('../../../../../src/utils/platform', () => ({
      commandExists: vi.fn().mockReturnValue(false),
    }))

    await expect(installGeminiCli('auto')).rejects.toThrow()
  })

  it('should handle installation failure', async () => {
    vi.mock('tinyexec', () => ({
      exec: vi.fn().mockRejectedValue(new Error('Installation failed')),
    }))

    await expect(installGeminiCli('npm')).rejects.toThrow()
  })

  it('should handle authentication verification failure', async () => {
    vi.mock('tinyexec', () => ({
      exec: vi.fn().mockRejectedValue(new Error('Auth failed')),
    }))

    const isValid = await verifyAuthentication()
    expect(isValid).toBe(false)
  })
})
```

---

## 📊 6. Expected Results

### 6.1 User Experience

#### Command Line Interface

```bash
# ============ Official Mode ============

# Initialize Gemini CLI with OAuth (Official Google API)
npx zcf init --code-type gemini --auth-type oauth

# Or use shorthand
npx zcf i -T gm

# Initialize with API Key (Official)
npx zcf init -T gemini --auth-type api_key --api-key "YOUR_API_KEY"

# Initialize with Vertex AI (Enterprise)
npx zcf init -T gemini --auth-type vertex_ai \
  --vertex-project "my-project" \
  --api-key "YOUR_API_KEY"

# ============ Custom Provider Mode ⭐ NEW ============

# Initialize with 302.AI provider
npx zcf init -T gemini --mode custom \
  --provider 302ai \
  --api-key "YOUR_302AI_KEY"

# Initialize with GLM (智谱AI)
npx zcf init -T gemini --mode custom \
  --provider glm \
  --api-key "YOUR_GLM_KEY"

# Initialize with custom provider and URL
npx zcf init -T gemini --mode custom \
  --provider custom \
  --base-url "https://api.example.com/v1" \
  --api-key "YOUR_API_KEY" \
  --model "gemini-2.0-flash-exp"

# ============ Provider Switching ⭐ NEW ============

# Switch between providers interactively
npx zcf config-switch --code-type gemini

# List available providers
npx zcf config-switch --code-type gemini --list

# ============ Other Commands ============

# Non-interactive mode for CI/CD
npx zcf init \
  --skip-prompt \
  --code-type gemini \
  --mode custom \
  --provider 302ai \
  --api-key "${GEMINI_API_KEY}" \
  --all-lang zh-CN

# Check Gemini CLI installation
npx zcf check-updates --code-type gemini

# Uninstall Gemini
npx zcf uninstall --code-type gemini
```

### 6.2 Interactive Menu

```
┌─ ZCF Main Menu ─────────────────────────────────────────────────┐
│                                                                  │
│  Select Code Tool:                                               │
│    1. Claude Code                                                │
│    2. Codex                                                      │
│    3. Gemini CLI (New) ⭐                                        │
│                                                                  │
│  Gemini Options:                                                 │
│                                                                  │
│  1. Full Initialization                                          │
│     ├─ Official Mode (OAuth/API Key/Vertex AI)                   │
│     └─ Custom Provider Mode (302.AI, GLM, MiniMax, Kimi)  ⭐     │
│                                                                  │
│  2. Provider Switching  ⭐ NEW                                    │
│     ├─ Switch to Official Google APIs                            │
│     ├─ Switch to 302.AI                                          │
│     ├─ Switch to GLM (智谱AI)                                     │
│     ├─ Switch to MiniMax                                         │
│     ├─ Switch to Kimi                                            │
│     └─ Custom Provider (Enter URL)                               │
│                                                                  │
│  3. MCP Server Configuration                                     │
│     Install Model Context Protocol servers                       │
│                                                                  │
│  4. Custom Commands                                              │
│     Install custom workflow commands                             │
│                                                                  │
│  5. Update Gemini CLI                                            │
│     Check and install updates                                    │
│                                                                  │
│  6. Uninstall                                                    │
│     Remove Gemini CLI configuration                              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 6.3 Configuration File Output

#### ~/.gemini/settings.json (After ZCF Setup)

```json
{
  "version": "1.0.0",
  "authentication": {
    "type": "oauth"
  },
  "model": {
    "default": "gemini-2.5-pro",
    "fast": "gemini-2.5-flash",
    "preferences": {
      "temperature": 0.7,
      "topP": 0.95,
      "topK": 40,
      "maxOutputTokens": 8192
    }
  },
  "tools": {
    "enabled": ["fileSystem", "shell", "webFetch", "googleSearch"],
    "googleSearch": {
      "grounding": true
    }
  },
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "${HOME}/projects"]
    }
  },
  "customCommands": {
    "review-pr": {
      "prompt": "Review the pull request changes and provide detailed feedback on code quality, potential bugs, and improvements",
      "model": "gemini-2.5-pro",
      "includeContext": true
    },
    "explain-code": {
      "prompt": "Explain the following code in detail, including its purpose, how it works, and any important patterns or considerations",
      "includeContext": true
    },
    "refactor": {
      "prompt": "Suggest refactoring improvements for the code, focusing on readability, maintainability, and performance",
      "model": "gemini-2.5-pro"
    }
  },
  "ui": {
    "theme": "auto",
    "language": "zh-CN",
    "keyboardShortcuts": {
      "submitMessage": "Ctrl+Enter"
    }
  },
  "telemetry": {
    "enabled": false
  }
}
```

### 6.4 Project-level GEMINI.md

```markdown
# ZCF Project Context

## 项目概述 (Project Overview)

ZCF (Zero-Config Code Flow) 是一个 CLI 工具，用于配置 Claude Code、Codex 和 Gemini CLI 环境。

## 技术栈 (Tech Stack)

- **Language**: TypeScript (ESM-only, strict mode)
- **Build**: unbuild
- **Testing**: Vitest (80% coverage target)
- **Linting**: @antfu/eslint-config
- **CLI Framework**: CAC
- **Package Manager**: pnpm

## 项目结构 (Project Structure)

```
zcf/
├── src/
│   ├── cli.ts           # CLI entry point
│   ├── commands/        # Command implementations
│   ├── utils/           # Utility modules
│   ├── types/           # TypeScript type definitions
│   ├── config/          # Configuration presets
│   └── i18n/            # Internationalization
├── templates/           # Configuration templates
└── tests/               # Test suites
```

## 代码规范 (Coding Standards)

### TypeScript
- Use strict TypeScript with explicit types
- ESM-only, no CommonJS
- Prefer named exports over default exports
- Use `interface` for object shapes

### Naming Conventions
- Files: kebab-case (e.g., `gemini-installer.ts`)
- Functions: camelCase (e.g., `installGeminiCli`)
- Types/Interfaces: PascalCase (e.g., `GeminiSettings`)
- Constants: UPPER_SNAKE_CASE (e.g., `GEMINI_DIR`)

### Testing
- TDD approach required
- 80% minimum coverage
- Unit tests: `tests/unit/`
- Integration tests: `tests/integration/`
- Edge case tests: `*.edge.test.ts`

## 国际化 (I18n)

All user-facing text must support internationalization:
- Use `i18n.t()` for all translatable strings
- Translations in `src/i18n/locales/`
- Support zh-CN and en locales
- Namespace organization: common, cli, menu, errors, etc.

## 平台兼容性 (Platform Compatibility)

- Windows (with special path handling)
- macOS
- Linux
- Termux (Android)

## 重要提醒 (Important Notes)

- Never commit sensitive credentials
- Always backup configs before modifications
- Use cross-platform path utilities (`pathe`)
- Test on all supported platforms
- Follow TDD methodology strictly

## Git 工作流 (Git Workflow)

- Main branch: `main`
- Feature branches: `feat/feature-name`
- Commit format: Conventional Commits
- PR required for all changes

## 有用的命令 (Useful Commands)

```bash
# Development
pnpm dev

# Build
pnpm build

# Test
pnpm test
pnpm test:watch
pnpm test:coverage

# Lint
pnpm lint
pnpm lint:fix
```

---

*This context file helps Gemini CLI understand the ZCF project structure, coding standards, and best practices.*
```

### 6.5 Help Message

```bash
$ npx zcf --help

ZCF - Zero-Config Code Flow v3.5.0

Commands:
  zcf                    Show interactive menu (default)
  zcf init | i           Initialize code tool configuration
  zcf update | u         Update workflow files
  zcf config-switch      Switch configurations
  zcf uninstall          Uninstall configurations
  zcf check-updates      Check update versions

Options:
  --code-type, -T <type>   Select code tool type
                           (claude-code, codex, gemini, cc, cx, gm)

  Gemini-specific options:
  --auth-type <type>       Authentication type for Gemini
                           (oauth, api_key, vertex_ai)
  --api-key, -k <key>      API key (for api_key or vertex_ai auth)
  --vertex-project <id>    Google Cloud project ID (for vertex_ai auth)
  --install-method <method> Installation method (npm, brew, skip)
  --mcp-services <list>    Comma-separated MCP services to install

  General options:
  --lang, -l <lang>        Display language (zh-CN, en)
  --all-lang, -g <lang>    Set all language parameters
  --skip-prompt, -s        Skip all interactive prompts
  --force, -f              Force overwrite existing configuration
  --help, -h               Display help information
  --version, -v            Display version number

Examples:
  # Initialize Gemini CLI with OAuth
  npx zcf init --code-type gemini --auth-type oauth
  npx zcf i -T gm

  # Initialize with API Key
  npx zcf i -T gemini --auth-type api_key --api-key "YOUR_KEY"

  # Initialize with Vertex AI
  npx zcf i -T gemini --auth-type vertex_ai \
    --vertex-project "my-project" --api-key "YOUR_KEY"

  # Non-interactive mode with MCP services
  npx zcf i --skip-prompt -T gemini \
    --auth-type api_key --api-key "YOUR_KEY" \
    --mcp-services github,filesystem,slack \
    --all-lang zh-CN

  # Check for Gemini CLI updates
  npx zcf check-updates --code-type gemini

  # Uninstall Gemini configuration
  npx zcf uninstall --code-type gemini
```

---

## ⚠️ 7. Important Notes

### 7.1 Key Advantages of Official CLI Integration

1. **No Custom Implementation Needed**
   - Official CLI is maintained by Google
   - Automatic updates and bug fixes
   - Access to latest Gemini features
   - Community support and documentation

2. **Native MCP Support**
   - Model Context Protocol built-in
   - Extensive MCP server ecosystem
   - Easy integration with third-party tools
   - No need to build custom extension system

3. **Professional Features**
   - OAuth, API Key, and Vertex AI auth
   - Built-in tools (filesystem, shell, web, search)
   - Conversation checkpointing
   - Token caching
   - GitHub integration

4. **Reduced Development Time**
   - Original plan: 17 days
   - **New plan: 15 days** (2 days saved)
   - Less code to maintain
   - Focus on integration, not implementation

### 7.2 Comparison with Claude Code and Codex

| Feature | Claude Code | Codex | **Gemini CLI** |
|---------|-------------|-------|----------------|
| **Official CLI** | ✅ Yes | ✅ Yes | ✅ **Yes (Official)** |
| **Config Format** | JSON | TOML | ✅ **JSON** |
| **Config Location** | `~/.claude/` | `~/.codex/` | ✅ **`~/.gemini/`** |
| **Auth Methods** | OAuth/API Key | API Key | ✅ **OAuth/API Key/Vertex AI** |
| **MCP Support** | ✅ Yes | ❌ No | ✅ **Native Support** |
| **Multi-Provider** | ❌ No | ✅ Yes | ❌ No (Google only) |
| **Built-in Tools** | Limited | None | ✅ **Extensive** |
| **Custom Commands** | ✅ Yes | ✅ Yes | ✅ **Yes** |
| **Context Files** | CLAUDE.md | ❌ No | ✅ **GEMINI.md** |
| **GitHub Integration** | ❌ No | ❌ No | ✅ **GitHub Actions** |
| **Headless Mode** | ✅ Yes | ❌ Limited | ✅ **Yes** |
| **Open Source** | ❌ No | ❌ No | ✅ **Apache 2.0** |

### 7.3 Authentication Options Explained

#### Option 1: OAuth (Recommended for Individual Developers)
```bash
npx zcf init -T gemini --auth-type oauth
# Then run: gemini (follow browser auth flow)
```

**Benefits:**
- Free tier: 60 req/min, 1,000 req/day
- Gemini 2.5 Pro with 1M token context
- No API key management
- Automatic model updates

**Use Cases:**
- Individual developers
- Personal projects
- Code Assist License holders

#### Option 2: API Key (For Specific Model Control)
```bash
npx zcf init -T gemini --auth-type api_key --api-key "YOUR_KEY"
# Get key from: https://aistudio.google.com/apikey
```

**Benefits:**
- Free tier: 100 req/day with Gemini 2.5 Pro
- Model selection control
- Usage-based billing
- Higher limits with paid tier

**Use Cases:**
- Developers needing specific models
- Projects with moderate usage
- Testing and development

#### Option 3: Vertex AI (For Enterprise)
```bash
npx zcf init -T gemini --auth-type vertex_ai \
  --vertex-project "my-project" --api-key "YOUR_KEY"
```

**Benefits:**
- Enterprise features (security, compliance)
- Scalable with higher rate limits
- Google Cloud integration
- Advanced monitoring and logging

**Use Cases:**
- Enterprise teams
- Production workloads
- Regulated industries
- High-volume usage

### 7.4 MCP Server Integration

Gemini CLI's native MCP support allows easy integration with various services:

**Commonly Used MCP Servers:**
- **GitHub**: `@modelcontextprotocol/server-github` - PR reviews, issue management
- **Filesystem**: `@modelcontextprotocol/server-filesystem` - File operations
- **Postgres**: `@modelcontextprotocol/server-postgres` - Database queries
- **Puppeteer**: `@modelcontextprotocol/server-puppeteer` - Web automation
- **Slack**: `@modelcontextprotocol/server-slack` - Team communication

**Installation:**
```bash
npx zcf init -T gemini --mcp-services github,filesystem,postgres
```

**Usage in Gemini CLI:**
```bash
gemini
> @github List my open pull requests
> @filesystem Read the contents of src/main.ts
> @postgres Run a query to find active users
```

### 7.5 Security Considerations

1. **API Key Storage**
   - Stored in `settings.json` (not encrypted by default)
   - Consider using environment variables for CI/CD
   - Set proper file permissions (600)

2. **OAuth Tokens**
   - Managed by Gemini CLI
   - Tokens stored in OS keychain when available
   - Automatic token refresh

3. **MCP Server Security**
   - Only install trusted MCP servers
   - Review MCP server source code
   - Use environment variables for secrets
   - Limit filesystem access paths

4. **Best Practices**
   - Never commit `settings.json` with API keys
   - Use `.gitignore` for sensitive files
   - Rotate API keys regularly
   - Enable 2FA on Google account (for OAuth)

### 7.6 Limitations and Known Issues

1. **No Multi-Provider Support**
   - Unlike Codex, Gemini CLI only supports Google models
   - Cannot switch between different API providers
   - Workaround: Use separate installations for different providers

2. **Network Dependency**
   - All operations require internet connection
   - No offline mode
   - API rate limits apply

3. **Platform Limitations**
   - Some features may be OS-specific
   - Windows path handling requires attention
   - Termux support may be limited

### 7.7 Migration Path

For users migrating from other tools:

#### From Claude Code
```bash
# Backup Claude Code settings
cp ~/.claude/settings.json ~/claude-backup.json

# Initialize Gemini
npx zcf init -T gemini --auth-type oauth

# Manually migrate custom prompts and workflows
# (ZCF will provide guided migration in future versions)
```

#### From Codex
```bash
# Gemini uses similar JSON format
# ZCF can help convert Codex configs to Gemini format
npx zcf init -T gemini --migrate-from codex

# (Feature planned for future release)
```

### 7.8 Future Enhancement Opportunities

1. **Enhanced Template System**
   - More workflow templates
   - AI personality presets
   - Project-specific templates

2. **Advanced MCP Integration**
   - One-click MCP service installation
   - MCP service discovery
   - Custom MCP server templates

3. **Multi-Configuration Management**
   - Multiple Gemini profiles
   - Easy switching between configs
   - Config sharing and import/export

4. **IDE Integration**
   - VS Code extension for ZCF + Gemini
   - Quick access to Gemini CLI from IDE
   - Integrated configuration UI

5. **Team Features**
   - Shared configurations
   - Team-wide MCP servers
   - Usage analytics
   - Collaboration tools

---

## 🎯 8. Summary

This plan provides a **complete, practical, and maintainable** solution for integrating the official Gemini CLI into ZCF.

### 8.1 Key Highlights

1. ✅ **Official CLI Integration**: Uses `@google/gemini-cli` package directly
2. ✅ **Native MCP Support**: Leverages built-in Model Context Protocol
3. ✅ **Three Auth Methods**: OAuth, API Key, and Vertex AI
4. ✅ **Reduced Development Time**: 15 days (vs 17 days for custom implementation)
5. ✅ **Lower Maintenance**: Official package maintained by Google
6. ✅ **Feature-Rich**: Built-in tools, custom commands, context files
7. ✅ **Open Source**: Apache 2.0 licensed, active community

### 8.2 Project Metrics

| Metric | Value |
|--------|-------|
| **Estimated Development Time** | 15 days (reduced from 17) |
| **Target Version** | v3.5.0 |
| **New Files Created** | ~25 files (reduced from ~30) |
| **New Lines of Code** | ~2,500 lines (reduced from ~3,500) |
| **Test Files** | 10+ files |
| **Test Coverage Target** | 80%+ |
| **Supported Auth Methods** | 3 (OAuth, API Key, Vertex AI) |
| **Supported Languages** | 2 (zh-CN, en) |
| **Supported Platforms** | 4 (Windows, macOS, Linux, Termux) |

### 8.3 Success Criteria

A successful implementation will achieve:

- ✅ Users can install Gemini CLI with a single command
- ✅ Users can choose from three authentication methods
- ✅ Configuration is properly managed in `~/.gemini/settings.json`
- ✅ MCP servers can be easily installed and configured
- ✅ Custom commands are integrated from ZCF templates
- ✅ All tests pass with 80%+ coverage
- ✅ Documentation is complete and accurate
- ✅ Zero breaking changes to existing Claude Code and Codex support

### 8.4 Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Gemini CLI API changes | Low | Medium | Monitor official updates, version pinning |
| Auth complexity | Low | Low | Well-documented by Google |
| MCP server compatibility | Medium | Low | Test with common servers |
| Cross-platform issues | Low | Medium | Extensive platform testing |
| User adoption | Medium | Low | Good documentation, examples |

### 8.5 Development Timeline

```
Week 1 (Days 1-5):
├─ Days 1-2: CLI installation & detection
├─ Days 3-4: Configuration management (JSON-based)
└─ Day 5: Authentication management (OAuth/API Key/Vertex AI)

Week 2 (Days 6-10):
├─ Days 6-7: MCP server integration
├─ Day 8: Custom provider management ⭐ NEW
├─ Day 9: Provider switching & config-switch ⭐ NEW
└─ Day 10: Custom commands & templates

Week 3 (Days 11-16):
├─ Days 11-12: Command integration (init, menu, config-switch, uninstall)
├─ Days 13-14: Comprehensive testing (including provider tests ⭐)
├─ Day 15: API provider preset integration ⭐ NEW
└─ Day 16: Documentation & release
```

### 8.6 Next Steps

After plan approval:

1. **Create GitHub Issue**: Track implementation progress
2. **Set Up Development Branch**: `feat/gemini-cli-integration`
3. **Phase 1 (Days 1-2)**: Implement installer module
4. **Phase 2 (Days 3-4)**: Implement config manager
5. **Phase 3 (Days 5-6)**: Implement auth manager
6. **Continue through Phase 8**: Complete all phases
7. **Release v3.5.0**: Publish to npm with release notes

### 8.7 Post-Release Roadmap

**v3.6.0 (Future):**
- Multi-configuration profiles
- Enhanced template system
- IDE integration

**v3.7.0 (Future):**
- Team collaboration features
- Advanced MCP management
- Usage analytics

---

## 📚 References

### Official Documentation
- [Gemini CLI GitHub Repository](https://github.com/google-gemini/gemini-cli)
- [Official Documentation Site](https://geminicli.com/docs/)
- [NPM Package](https://www.npmjs.com/package/@google/gemini-cli)
- [Authentication Guide](https://github.com/google-gemini/gemini-cli/blob/main/docs/get-started/authentication.md)
- [Configuration Guide](https://github.com/google-gemini/gemini-cli/blob/main/docs/get-started/configuration.md)
- [MCP Server Integration](https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md)
- [Custom Commands Guide](https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/custom-commands.md)

### ZCF Internal Documentation
- [CLAUDE.md](./CLAUDE.md) - Project overview
- [AGENTS.md](./AGENTS.md) - AI agent configuration
- [README.md](./README.md) - User guide
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Development guidelines

### Related Modules
- `src/utils/code-tools/codex.ts` - Similar implementation reference
- `src/config/api-providers.ts` - API provider presets
- `src/constants.ts` - Project constants
- `tests/unit/utils/code-tools/codex*.test.ts` - Test examples

---

**Document Approval**:
- [ ] Technical Review - Verify architectural decisions
- [ ] Security Review - Verify security practices
- [ ] User Experience Review - Verify usability
- [ ] Final Approval - Ready for implementation

**Document Status**: ✅ **Updated and Ready for Implementation**

**Change Log**:
- v1.0.0 (2025-12-05): Initial plan with custom implementation
- v2.0.0 (2025-12-05): **Major revision to use official `@google/gemini-cli`**
- v3.0.0 (2025-12-05): ⭐ **Added custom provider support (like Claude Code & Codex)**
  - Added dual-mode support (official + custom providers)
  - Added `gemini-provider-manager.ts` for provider management
  - Added `gemini-config-switch.ts` for provider switching
  - Added Gemini field to `api-providers.ts` presets
  - Extended development time to 16 days (1 day for provider management)
  - Updated all code examples to support both modes

---

*This document is a living document and will be updated as the implementation progresses.*
