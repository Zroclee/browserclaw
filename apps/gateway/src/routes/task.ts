import { Router } from 'express';
import { taskManager, scheduler, TaskConfig } from '@zrocclaw/core/scheduler';
import { BusinessError } from '../middlewares/errorHandler';

const router = Router();

// 1. 查询接口，GET，返回任务数组
router.get('/', async (req, res) => {
  const tasks = await taskManager.getTasks();
  res.success(tasks, '获取任务列表成功');
});

// 2. 新增接口，POST，返回携带ID的完整任务对象
router.post('/add', async (req, res) => {
  const { name, cron, message, isActive } = req.body;
  
  if (!name || !cron || !message) {
    throw new BusinessError(400, '缺少必填字段: name, cron 或 message');
  }

  const newTask = await taskManager.addTask({
    name,
    cron,
    message,
    isActive: !!isActive
  });

  // 如果新增时 isActive 为 true，则自动启动任务
  if (newTask.isActive) {
    scheduler.startTask({
      id: newTask.id,
      name: newTask.name,
      cron: newTask.cron,
      handler: async () => {
        // 这里对接真正跑大模型的逻辑，临时用 console 代替
        console.log(`[Task Execution] 任务 [${newTask.name}] 被触发，消息: ${newTask.message}`);
      }
    });
  }

  res.success(newTask, '新增任务成功');
});

// 3. 编辑接口，POST，参数必须携带ID
router.post('/edit', async (req, res) => {
  const { id, ...updates } = req.body;
  
  if (!id) {
    throw new BusinessError(400, '必须提供任务ID');
  }

  const updatedTask = await taskManager.updateTask(id, updates);
  if (!updatedTask) {
    throw new BusinessError(404, `未找到 ID 为 ${id} 的任务`);
  }

  // 编辑后重新评估调度器状态
  if (updatedTask.isActive) {
    scheduler.startTask({
      id: updatedTask.id,
      name: updatedTask.name,
      cron: updatedTask.cron,
      handler: async () => {
        console.log(`[Task Execution] 任务 [${updatedTask.name}] 被触发，消息: ${updatedTask.message}`);
      }
    });
  } else {
    scheduler.stopTask(updatedTask.id);
  }

  res.success(updatedTask, '更新任务成功');
});

// 4. 删除接口，POST，参数任务ID
router.post('/delete', async (req, res) => {
  const { id } = req.body;
  
  if (!id) {
    throw new BusinessError(400, '必须提供任务ID');
  }

  const success = await taskManager.deleteTask(id);
  if (!success) {
    throw new BusinessError(404, `未找到 ID 为 ${id} 的任务`);
  }

  // 删除任务后也要从调度器中停止
  scheduler.stopTask(id);

  res.success({ id }, '删除任务成功');
});

// 5. 激活/停止任务，POST，参数任务对象（或仅包含ID和isActive状态）
router.post('/toggle', async (req, res) => {
  const { id, isActive } = req.body;

  if (!id || typeof isActive !== 'boolean') {
    throw new BusinessError(400, '必须提供任务ID以及isActive(布尔值)');
  }

  const updatedTask = await taskManager.updateTask(id, { isActive });
  if (!updatedTask) {
    throw new BusinessError(404, `未找到 ID 为 ${id} 的任务`);
  }

  if (updatedTask.isActive) {
    scheduler.startTask({
      id: updatedTask.id,
      name: updatedTask.name,
      cron: updatedTask.cron,
      handler: async () => {
        console.log(`[Task Execution] 任务 [${updatedTask.name}] 被触发，消息: ${updatedTask.message}`);
      }
    });
  } else {
    scheduler.stopTask(updatedTask.id);
  }

  res.success(updatedTask, isActive ? '任务已激活并启动' : '任务已停止');
});

export default router;

