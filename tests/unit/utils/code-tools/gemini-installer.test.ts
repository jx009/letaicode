import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { checkGeminiCliUpdate, getGeminiCliVersion, installGeminiCli, installGeminiCliBrew, installGeminiCliNpm, isGeminiCliInstalled, updateGeminiCli } from '../../../src/utils/code-tools/gemini-installer'

// Mock dependencies
vi.mock('../../../src/utils/platform', () => ({
  commandExists: vi.fn(),
}))

vi.mock('tinyexec', () => ({
  exec: vi.fn(),
}))

vi.mock('../../../src/i18n', () => ({
  ensureI18nInitialized: vi.fn(),
  i18n: {
    t: vi.fn((key: string, params?: any) => {
      const translations: Record<string, string> = {
        'gemini:alreadyInstalled': 'Gemini CLI is already installed',
        'gemini:installing': `Installing Gemini CLI via ${params?.method || 'npm'}...`,
        'gemini:installSuccess': 'Gemini CLI installed successfully',
        'gemini:installFailed': `Failed to install Gemini CLI: ${params?.error || 'unknown'}`,
        'gemini:brewNotFound': 'Homebrew not found, please install Homebrew first',
        'gemini:noInstallMethod': 'No installation method available (npm or Homebrew required)',
        'gemini:updating': 'Updating Gemini CLI...',
        'gemini:updateSuccess': 'Gemini CLI updated successfully',
        'gemini:updateFailed': `Failed to update Gemini CLI: ${params?.error || 'unknown'}`,
      }
      return translations[key] || key
    }),
  },
}))

describe('gemini-installer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('isGeminiCliInstalled', () => {
    it('should return true when gemini command exists', async () => {
      const { commandExists } = await import('../../../src/utils/platform')
      vi.mocked(commandExists).mockResolvedValue(true)

      const result = await isGeminiCliInstalled()

      expect(result).toBe(true)
      expect(commandExists).toHaveBeenCalledWith('gemini')
    })

    it('should return false when gemini command does not exist', async () => {
      const { commandExists } = await import('../../../src/utils/platform')
      vi.mocked(commandExists).mockResolvedValue(false)

      const result = await isGeminiCliInstalled()

      expect(result).toBe(false)
    })
  })

  describe('getGeminiCliVersion', () => {
    it('should return version when gemini --version succeeds', async () => {
      const { exec } = await import('tinyexec')
      vi.mocked(exec).mockResolvedValue({
        stdout: '1.2.3\n',
        stderr: '',
        exitCode: 0,
      } as any)

      const result = await getGeminiCliVersion()

      expect(result).toBe('1.2.3')
      expect(exec).toHaveBeenCalledWith('gemini', ['--version'])
    })

    it('should return null when gemini command fails', async () => {
      const { exec } = await import('tinyexec')
      vi.mocked(exec).mockRejectedValue(new Error('Command not found'))

      const result = await getGeminiCliVersion()

      expect(result).toBeNull()
    })
  })

  describe('installGeminiCliNpm', () => {
    it('should install gemini-cli globally via npm', async () => {
      const { exec } = await import('tinyexec')
      vi.mocked(exec).mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 } as any)

      await installGeminiCliNpm(true)

      expect(exec).toHaveBeenCalledWith('npm', ['install', '-g', '@google/gemini-cli'])
    })

    it('should install gemini-cli locally via npm when global is false', async () => {
      const { exec } = await import('tinyexec')
      vi.mocked(exec).mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 } as any)

      await installGeminiCliNpm(false)

      expect(exec).toHaveBeenCalledWith('npm', ['install', '@google/gemini-cli'])
    })

    it('should throw error when npm install fails', async () => {
      const { exec } = await import('tinyexec')
      vi.mocked(exec).mockRejectedValue(new Error('npm install failed'))

      await expect(installGeminiCliNpm()).rejects.toThrow()
    })
  })

  describe('installGeminiCliBrew', () => {
    it('should install gemini-cli via brew', async () => {
      const { commandExists } = await import('../../../src/utils/platform')
      const { exec } = await import('tinyexec')
      vi.mocked(commandExists).mockResolvedValue(true)
      vi.mocked(exec).mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 } as any)

      await installGeminiCliBrew()

      expect(commandExists).toHaveBeenCalledWith('brew')
      expect(exec).toHaveBeenCalledWith('brew', ['install', 'gemini-cli'])
    })

    it('should throw error when brew is not available', async () => {
      const { commandExists } = await import('../../../src/utils/platform')
      vi.mocked(commandExists).mockResolvedValue(false)

      await expect(installGeminiCliBrew()).rejects.toThrow()
    })

    it('should throw error when brew install fails', async () => {
      const { commandExists } = await import('../../../src/utils/platform')
      const { exec } = await import('tinyexec')
      vi.mocked(commandExists).mockResolvedValue(true)
      vi.mocked(exec).mockRejectedValue(new Error('brew install failed'))

      await expect(installGeminiCliBrew()).rejects.toThrow()
    })
  })

  describe('installGeminiCli', () => {
    it('should skip installation when already installed', async () => {
      const { commandExists } = await import('../../../src/utils/platform')
      vi.mocked(commandExists).mockResolvedValue(true)

      await installGeminiCli()

      expect(commandExists).toHaveBeenCalledWith('gemini')
    })

    it('should install via brew when available (auto mode)', async () => {
      const { commandExists } = await import('../../../src/utils/platform')
      const { exec } = await import('tinyexec')
      vi.mocked(commandExists).mockImplementation(async (cmd: string) => {
        if (cmd === 'gemini')
          return false
        if (cmd === 'brew')
          return true
        return false
      })
      vi.mocked(exec).mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 } as any)

      await installGeminiCli('auto')

      expect(exec).toHaveBeenCalledWith('brew', ['install', 'gemini-cli'])
    })

    it('should install via npm when brew not available (auto mode)', async () => {
      const { commandExists } = await import('../../../src/utils/platform')
      const { exec } = await import('tinyexec')
      vi.mocked(commandExists).mockImplementation(async (cmd: string) => {
        if (cmd === 'gemini')
          return false
        if (cmd === 'brew')
          return false
        if (cmd === 'npm')
          return true
        return false
      })
      vi.mocked(exec).mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 } as any)

      await installGeminiCli('auto')

      expect(exec).toHaveBeenCalledWith('npm', ['install', '-g', '@google/gemini-cli'])
    })

    it('should throw error when no installation method available', async () => {
      const { commandExists } = await import('../../../src/utils/platform')
      vi.mocked(commandExists).mockResolvedValue(false)

      await expect(installGeminiCli('auto')).rejects.toThrow()
    })

    it('should install via npm when method is specified', async () => {
      const { commandExists } = await import('../../../src/utils/platform')
      const { exec } = await import('tinyexec')
      vi.mocked(commandExists).mockResolvedValue(false)
      vi.mocked(exec).mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 } as any)

      await installGeminiCli('npm')

      expect(exec).toHaveBeenCalledWith('npm', ['install', '-g', '@google/gemini-cli'])
    })

    it('should install via brew when method is specified', async () => {
      const { commandExists } = await import('../../../src/utils/platform')
      const { exec } = await import('tinyexec')
      vi.mocked(commandExists).mockImplementation(async (cmd: string) => {
        if (cmd === 'gemini')
          return false
        if (cmd === 'brew')
          return true
        return false
      })
      vi.mocked(exec).mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 } as any)

      await installGeminiCli('brew')

      expect(exec).toHaveBeenCalledWith('brew', ['install', 'gemini-cli'])
    })
  })

  describe('updateGeminiCli', () => {
    it('should update via npm when available', async () => {
      const { commandExists } = await import('../../../src/utils/platform')
      const { exec } = await import('tinyexec')
      vi.mocked(commandExists).mockResolvedValue(true)
      vi.mocked(exec).mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 } as any)

      await updateGeminiCli()

      expect(commandExists).toHaveBeenCalledWith('npm')
      expect(exec).toHaveBeenCalledWith('npm', ['update', '-g', '@google/gemini-cli'])
    })

    it('should update via brew when npm not available', async () => {
      const { commandExists } = await import('../../../src/utils/platform')
      const { exec } = await import('tinyexec')
      vi.mocked(commandExists).mockImplementation(async (cmd: string) => {
        if (cmd === 'npm')
          return false
        if (cmd === 'brew')
          return true
        return false
      })
      vi.mocked(exec).mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 } as any)

      await updateGeminiCli()

      expect(exec).toHaveBeenCalledWith('brew', ['upgrade', 'gemini-cli'])
    })

    it('should throw error when update fails', async () => {
      const { commandExists } = await import('../../../src/utils/platform')
      const { exec } = await import('tinyexec')
      vi.mocked(commandExists).mockResolvedValue(true)
      vi.mocked(exec).mockRejectedValue(new Error('Update failed'))

      await expect(updateGeminiCli()).rejects.toThrow()
    })
  })

  describe('checkGeminiCliUpdate', () => {
    it('should return not-installed when CLI is not installed', async () => {
      const { exec } = await import('tinyexec')
      vi.mocked(exec).mockRejectedValue(new Error('Command not found'))

      const result = await checkGeminiCliUpdate()

      expect(result).toEqual({
        version: 'not-installed',
        updateAvailable: false,
      })
    })

    it('should compare installed version with npm registry', async () => {
      const { exec } = await import('tinyexec')
      vi.mocked(exec)
        .mockResolvedValueOnce({ stdout: '1.0.0\n', stderr: '', exitCode: 0 } as any) // gemini --version
        .mockResolvedValueOnce({ stdout: '1.2.0\n', stderr: '', exitCode: 0 } as any) // npm view

      const result = await checkGeminiCliUpdate()

      expect(result).toEqual({
        version: '1.0.0',
        latest: '1.2.0',
        updateAvailable: true,
      })
    })

    it('should return updateAvailable false when versions match', async () => {
      const { exec } = await import('tinyexec')
      vi.mocked(exec)
        .mockResolvedValueOnce({ stdout: '1.2.0\n', stderr: '', exitCode: 0 } as any) // gemini --version
        .mockResolvedValueOnce({ stdout: '1.2.0\n', stderr: '', exitCode: 0 } as any) // npm view

      const result = await checkGeminiCliUpdate()

      expect(result).toEqual({
        version: '1.2.0',
        latest: '1.2.0',
        updateAvailable: false,
      })
    })

    it('should return updateAvailable false when npm registry check fails', async () => {
      const { exec } = await import('tinyexec')
      vi.mocked(exec)
        .mockResolvedValueOnce({ stdout: '1.0.0\n', stderr: '', exitCode: 0 } as any) // gemini --version
        .mockRejectedValueOnce(new Error('npm view failed')) // npm view

      const result = await checkGeminiCliUpdate()

      expect(result).toEqual({
        version: '1.0.0',
        updateAvailable: false,
      })
    })
  })
})
