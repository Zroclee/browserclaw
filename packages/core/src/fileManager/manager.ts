import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

/**
 * 获取 ZrocClaw 的根目录 (~/.zrocclaw)
 */
export function getBasePath(): string {
  const basePath = path.join(os.homedir(), '.zrocclaw');
  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true });
  }
  return basePath;
}

/**
 * 自动处理路径的创建逻辑
 * 如果路径有扩展名，则认为是文件，确保其父目录存在并在文件不存在时创建空文件；
 * 否则认为是目录，直接创建目录。
 */
function resolveAndEnsurePath(baseDir: string, subPath?: string): string {
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  if (!subPath) {
    return baseDir;
  }

  const targetPath = path.join(baseDir, subPath);
  const ext = path.extname(targetPath);

  if (ext) {
    // 带有扩展名，视为文件：确保父目录存在并创建空文件
    const parentDir = path.dirname(targetPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    if (!fs.existsSync(targetPath)) {
      fs.writeFileSync(targetPath, '', 'utf-8');
    }
  } else {
    // 无扩展名，视为目录：确保该目录存在
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }
  }

  return targetPath;
}

/**
 * 获取配置目录 (~/.zrocclaw/config)
 * @param subPath 可选的子路径，用于拼接在 config 目录下
 * @returns 完整的配置文件或目录路径
 */
export function getConfigPath(subPath?: string): string {
  const configPath = path.join(getBasePath(), 'config');
  return resolveAndEnsurePath(configPath, subPath);
}

/**
 * 获取工作空间目录 (~/.zrocclaw/workspace)
 * @param subPath 可选的子路径，用于拼接在 workspace 目录下
 * @returns 完整的工作空间文件或目录路径
 */
export function getWorkspacePath(subPath?: string): string {
  const workspacePath = path.join(getBasePath(), 'workspace');
  return resolveAndEnsurePath(workspacePath, subPath);
}

/**
 * 获取记忆存储目录 (~/.zrocclaw/workspace/memory)
 * @param subPath 可选的子路径，用于拼接在 memory 目录下
 * @returns 完整的记忆文件或目录路径
 */
export function getMemoryPath(subPath?: string): string {
  const memoryPath = path.join(getWorkspacePath(), 'memory');
  return resolveAndEnsurePath(memoryPath, subPath);
}

