import { Router } from 'express';
import { getConfigPath, getWorkspacePath, getSkillsPath } from '@zrocclaw/core/fileManager';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { BusinessError } from '../middlewares/errorHandler';

const router = Router();

router.get('/', (req, res) => {
  res.success({ configPath: getConfigPath() });
});

const configDir = getConfigPath();
const configModelPath = path.join(configDir, 'model.json');

// 辅助方法：读取和写入配置文件
async function readModelConfig() {
  try {
    await fs.access(configModelPath);
    const data = await fs.readFile(configModelPath, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return {};
    }
    throw error;
  }
}

async function writeModelConfig(config: any) {
  await fs.mkdir(configDir, { recursive: true });
  await fs.writeFile(configModelPath, JSON.stringify(config, null, 2), 'utf-8');
}

// 4. 查询接口 get
router.get('/model', async (req, res, next) => {
  try {
    const config = await readModelConfig();
    if (Object.keys(config).length === 0) {
      await writeModelConfig({});
      return res.success({});
    }
    res.success(config);
  } catch (error) {
    next(error);
  }
});

// 1. 新增接口 post
router.post('/model', async (req, res, next) => {
  try {
    const { modelName, provider, apiKey, baseURL } = req.body;
    const newModel = {
      id: crypto.randomUUID(),
      modelName,
      provider,
      apiKey,
      baseURL
    };

    const config = await readModelConfig();
    
    if (!Array.isArray(config.models)) {
      config.models = [];
    }
    
    // unshift到models字段下第一条
    config.models.unshift(newModel);

    // 如果defaultModel的值为空，自动配置到defaultModel
    if (!config.defaultModel) {
      config.defaultModel = newModel; // 存完整对象
    }

    await writeModelConfig(config);
    
    // 返回带ID的完整数据
    res.success(newModel);
  } catch (error) {
    next(error);
  }
});

// 2. 编辑接口 post
router.post('/model/edit', async (req, res, next) => {
  try {
    const modelData = req.body;
    if (!modelData || !modelData.id) {
      throw new BusinessError(400, '缺少模型ID');
    }

    const config = await readModelConfig();
    if (!Array.isArray(config.models)) {
      config.models = [];
    }

    const index = config.models.findIndex((m: any) => m.id === modelData.id);
    if (index === -1) {
      throw new BusinessError(404, '模型不存在');
    }

    // 替换模型数据
    config.models[index] = { ...config.models[index], ...modelData };

    // 如果编辑的是默认模型，同步更新
    if (config.defaultModel && config.defaultModel.id === modelData.id) {
      config.defaultModel = config.models[index];
    }

    await writeModelConfig(config);
    res.success(config.models[index]);
  } catch (error) {
    next(error);
  }
});

// 3. 删除接口 post
router.post('/model/delete', async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) {
      throw new BusinessError(400, '缺少模型ID');
    }

    const config = await readModelConfig();
    if (!Array.isArray(config.models)) {
      config.models = [];
    }

    const initialLength = config.models.length;
    config.models = config.models.filter((m: any) => m.id !== id);

    if (config.models.length === initialLength) {
      throw new BusinessError(404, '模型不存在');
    }

    // 如果删除的是默认模型，清除或更新defaultModel
    if (config.defaultModel && config.defaultModel.id === id) {
      config.defaultModel = config.models.length > 0 ? config.models[0] : null;
    }

    await writeModelConfig(config);
    res.success({ success: true }, '删除成功');
  } catch (error) {
    next(error);
  }
});

// 5. 设置defaultmodel接口 post
router.post('/model/default', async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) {
      throw new BusinessError(400, '缺少模型ID');
    }

    const config = await readModelConfig();
    if (!Array.isArray(config.models)) {
      config.models = [];
    }

    const model = config.models.find((m: any) => m.id === id);
    if (!model) {
      throw new BusinessError(404, '模型不存在');
    }

    config.defaultModel = model; // 写入defaultModel完整对象
    await writeModelConfig(config);
    
    res.success({ success: true, defaultModel: config.defaultModel });
  } catch (error) {
    next(error);
  }
});

const workspaceDir = getWorkspacePath();
const workspaceSkillsPath = path.join(workspaceDir, 'SKILLS.json');
const skillsDir = getSkillsPath();

// 辅助方法：读取和写入技能配置文件
async function readSkillsConfig() {
  try {
    await fs.access(workspaceSkillsPath);
    const data = await fs.readFile(workspaceSkillsPath, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writeSkillsConfig(config: any) {
  await fs.mkdir(workspaceDir, { recursive: true });
  await fs.writeFile(workspaceSkillsPath, JSON.stringify(config, null, 2), 'utf-8');
}

// 1. 获取技能列表接口 get
router.get('/skills', async (req, res, next) => {
  try {
    try {
      await fs.access(workspaceSkillsPath);
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        await writeSkillsConfig([]);
        return res.success([]);
      }
    }
    const config = await readSkillsConfig();
    res.success(config);
  } catch (error) {
    next(error);
  }
});

// 2. 新增技能接口 post
router.post('/skills', async (req, res, next) => {
  try {
    const { name, summary, content } = req.body;
    const id = crypto.randomUUID();
    const newSkill = {
      id,
      name,
      summary,
      path: `./skills/${id}.md`
    };

    const skills = await readSkillsConfig();
    if (!Array.isArray(skills)) {
      throw new BusinessError(500, 'skills.json 格式错误');
    }
    
    skills.unshift(newSkill);
    await writeSkillsConfig(skills);

    // 保存内容到 markdown 文件
    await fs.mkdir(skillsDir, { recursive: true });
    const mdPath = path.join(skillsDir, `${id}.md`);
    await fs.writeFile(mdPath, content || '', 'utf-8');

    res.success(newSkill);
  } catch (error) {
    next(error);
  }
});

// 3. 编辑技能接口 post
router.post('/skills/edit', async (req, res, next) => {
  try {
    const { id, name, summary, content } = req.body;
    if (!id) {
      throw new BusinessError(400, '缺少技能ID');
    }

    const skills = await readSkillsConfig();
    if (!Array.isArray(skills)) {
      throw new BusinessError(500, 'skills.json 格式错误');
    }

    const index = skills.findIndex((s: any) => s.id === id);
    if (index === -1) {
      throw new BusinessError(404, '技能不存在');
    }

    skills[index] = { ...skills[index], name, summary };
    await writeSkillsConfig(skills);

    // 替换对应的 markdown 文件内容
    await fs.mkdir(skillsDir, { recursive: true });
    const mdPath = path.join(skillsDir, `${id}.md`);
    await fs.writeFile(mdPath, content || '', 'utf-8');

    res.success(skills[index]);
  } catch (error) {
    next(error);
  }
});

// 4. 删除技能接口 post
router.post('/skills/delete', async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) {
      throw new BusinessError(400, '缺少技能ID');
    }

    let skills = await readSkillsConfig();
    if (!Array.isArray(skills)) {
      throw new BusinessError(500, 'skills.json 格式错误');
    }

    const initialLength = skills.length;
    skills = skills.filter((s: any) => s.id !== id);

    if (skills.length === initialLength) {
      throw new BusinessError(404, '技能不存在');
    }

    await writeSkillsConfig(skills);

    // 删除对应的 markdown 文件
    const mdPath = path.join(skillsDir, `${id}.md`);
    try {
      await fs.unlink(mdPath);
    } catch (e: any) {
      if (e.code !== 'ENOENT') {
        console.error('删除技能文件失败:', e);
      }
    }

    res.success({ success: true }, '删除成功');
  } catch (error) {
    next(error);
  }
});

// 5. 获取技能详情接口 post
router.post('/skills/detail', async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) {
      throw new BusinessError(400, '缺少技能ID');
    }

    const mdPath = path.join(skillsDir, `${id}.md`);
    try {
      await fs.access(mdPath);
      const content = await fs.readFile(mdPath, 'utf-8');
      res.success({ content });
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        throw new BusinessError(404, '技能文件不存在');
      }
      throw e;
    }
  } catch (error) {
    next(error);
  }
});

export default router;