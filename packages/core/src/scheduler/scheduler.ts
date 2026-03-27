import schedule from 'node-schedule';

export interface TaskDefinition {
  id: string;
  name?: string;
  cron: string | Date | schedule.RecurrenceRule;
  handler: () => void | Promise<void>;
}

export class TaskScheduler {
  // 只管理实际在运行的 job，不再管理 task 的配置数据
  private jobs: Map<string, schedule.Job> = new Map();

  /**
   * 启动/调度一个任务
   */
  public startTask(task: TaskDefinition): void {
    if (this.jobs.has(task.id)) {
      // 任务已经处于运行状态，这里为了安全，先停止旧的再启动新的
      this.stopTask(task.id);
    }

    const job = schedule.scheduleJob(task.cron, async () => {
      try {
        await task.handler();
      } catch (error) {
        console.error(`[TaskScheduler] Error executing task ${task.name || task.id}:`, error);
      }
    });

    if (job) {
      this.jobs.set(task.id, job);
      console.log(`[TaskScheduler] Task [${task.name || task.id}] scheduled with cron: ${task.cron}`);
    } else {
      throw new Error(`[TaskScheduler] Failed to schedule task ${task.name || task.id}. Invalid cron expression?`);
    }
  }

  /**
   * 停止单个任务
   */
  public stopTask(id: string): void {
    const job = this.jobs.get(id);
    if (job) {
      job.cancel();
      this.jobs.delete(id);
      console.log(`[TaskScheduler] Task [${id}] stopped.`);
    }
  }

  /**
   * 停止所有正在运行的任务
   */
  public stopAll(): void {
    for (const id of this.jobs.keys()) {
      this.stopTask(id);
    }
  }

  /**
   * 获取某个任务的当前运行状态
   */
  public getStatus(id: string): 'running' | 'stopped' {
    return this.jobs.has(id) ? 'running' : 'stopped';
  }

  /**
   * 获取所有正在运行的任务 ID 列表
   */
  public getRunningTasks(): string[] {
    return Array.from(this.jobs.keys());
  }
}

// 导出一个默认的单例实例
export const scheduler = new TaskScheduler();
