import { getConfigPath } from '../fileManager';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface TaskConfig {
  id: string;
  name: string;
  cron: string;        // Cron 表达式
  message: string;     // 喂给大模型的任务正文信息
  isActive: boolean;   // 是否启用
}

export class TaskManager {
  /**
   * 获取任务配置文件的绝对路径
   */
  private get taskFilePath(): string {
    return path.join(getConfigPath(), 'task.json');
  }

  /**
   * 统一读取方法：读取 JSON 文件返回任务数组
   * 判断文件是否存在，没有则创建文件并写入 []，返回 []
   */
  private async readTasksFile(): Promise<TaskConfig[]> {
    const filePath = this.taskFilePath;
    try {
      await fs.access(filePath);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data) as TaskConfig[];
    } catch (error: any) {
      // 文件不存在的情况 (ENOENT)
      if (error.code === 'ENOENT') {
        await this.writeTasksFile([]);
        return [];
      }
      // 其他错误向上抛出
      throw error;
    }
  }

  /**
   * 统一写入方法：将任务数组写入 JSON 文件
   */
  private async writeTasksFile(tasks: TaskConfig[]): Promise<void> {
    const filePath = this.taskFilePath;
    const dir = path.dirname(filePath);
    
    // 确保目标目录存在
    await fs.mkdir(dir, { recursive: true });
    // 将数据写入 task.json
    await fs.writeFile(filePath, JSON.stringify(tasks, null, 2), 'utf-8');
  }

  /**
   * 1. 查询任务
   * @returns 所有任务数组
   */
  public async getTasks(): Promise<TaskConfig[]> {
    return await this.readTasksFile();
  }

  /**
   * 2. 新增任务
   * @param task Omit<TaskConfig, 'id'> - 包含 name, cron, message, isActive
   * @returns 新增的完整任务对象
   */
  public async addTask(task: Omit<TaskConfig, 'id'>): Promise<TaskConfig> {
    const tasks = await this.readTasksFile();
    
    const newTask: TaskConfig = {
      id: crypto.randomUUID(), // 通过 crypto 创建 uuid
      ...task
    };
    
    tasks.push(newTask); // 整个对象 push 到数组最后
    await this.writeTasksFile(tasks); // 保存
    
    return newTask;
  }

  /**
   * 3. 编辑任务
   * @param id 要编辑的任务 ID
   * @param updates 包含要更新的字段
   * @returns 更新后的完整任务对象，如果未找到则返回 null
   */
  public async updateTask(id: string, updates: Partial<Omit<TaskConfig, 'id'>>): Promise<TaskConfig | null> {
    const tasks = await this.readTasksFile();
    const index = tasks.findIndex(t => t.id === id);
    
    if (index === -1) {
      return null;
    }

    // ID匹配替换并保存
    const updatedTask = { ...tasks[index], ...updates };
    tasks[index] = updatedTask;
    await this.writeTasksFile(tasks);
    
    return updatedTask;
  }

  /**
   * 4. 删除任务
   * @param id 要删除的任务 ID
   * @returns 删除是否成功 (true表示找到了并删除，false表示未找到)
   */
  public async deleteTask(id: string): Promise<boolean> {
    const tasks = await this.readTasksFile();
    const initialLength = tasks.length;
    
    // ID匹配删除
    const filteredTasks = tasks.filter(t => t.id !== id);
    
    if (filteredTasks.length === initialLength) {
      return false; // 没有任务被删除
    }

    // 保存
    await this.writeTasksFile(filteredTasks);
    return true;
  }
}

// 导出默认单例供其他模块直接使用
export const taskManager = new TaskManager();
