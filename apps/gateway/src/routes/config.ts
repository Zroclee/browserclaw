import { Router } from 'express';
import { getConfigPath, getWorkspacePath, getSkillsPath } from '@zrocclaw/core/fileManager';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const router = Router();

router.get('/', (req, res) => {
  res.json({ configPath: getConfigPath()});
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
router.get('/model', async (req, res) => {
  try {
    const config = await readModelConfig();
    if (Object.keys(config).length === 0) {
      await writeModelConfig({});
      return res.json({});
    }
    res.json(config);
  } catch (error) {
    console.error('获取模型失败:', error);
    res.status(500).json({ error: '获取模型失败' });
  }
});

// 1. 新增接口 post
router.post('/model', async (req, res) => {
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
    res.json(newModel);
  } catch (error) {
    console.error('新增模型失败:', error);
    res.status(500).json({ error: '新增模型失败' });
  }
});

// 2. 编辑接口 post
router.post('/model/edit', async (req, res) => {
  try {
    const modelData = req.body;
    if (!modelData || !modelData.id) {
      return res.status(400).json({ error: '缺少模型ID' });
    }

    const config = await readModelConfig();
    if (!Array.isArray(config.models)) {
      config.models = [];
    }

    const index = config.models.findIndex((m: any) => m.id === modelData.id);
    if (index === -1) {
      return res.status(404).json({ error: '模型不存在' });
    }

    // 替换模型数据
    config.models[index] = { ...config.models[index], ...modelData };

    // 如果编辑的是默认模型，同步更新
    if (config.defaultModel && config.defaultModel.id === modelData.id) {
      config.defaultModel = config.models[index];
    }

    await writeModelConfig(config);
    res.json(config.models[index]);
  } catch (error) {
    console.error('编辑模型失败:', error);
    res.status(500).json({ error: '编辑模型失败' });
  }
});

// 3. 删除接口 post
router.post('/model/delete', async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: '缺少模型ID' });
    }

    const config = await readModelConfig();
    if (!Array.isArray(config.models)) {
      config.models = [];
    }

    const initialLength = config.models.length;
    config.models = config.models.filter((m: any) => m.id !== id);

    if (config.models.length === initialLength) {
      return res.status(404).json({ error: '模型不存在' });
    }

    // 如果删除的是默认模型，清除或更新defaultModel
    if (config.defaultModel && config.defaultModel.id === id) {
      config.defaultModel = config.models.length > 0 ? config.models[0] : null;
    }

    await writeModelConfig(config);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除模型失败:', error);
    res.status(500).json({ error: '删除模型失败' });
  }
});

// 5. 设置defaultmodel接口 post
router.post('/model/default', async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: '缺少模型ID' });
    }

    const config = await readModelConfig();
    if (!Array.isArray(config.models)) {
      config.models = [];
    }

    const model = config.models.find((m: any) => m.id === id);
    if (!model) {
      return res.status(404).json({ error: '模型不存在' });
    }

    config.defaultModel = model; // 写入defaultModel完整对象
    await writeModelConfig(config);
    
    res.json({ success: true, defaultModel: config.defaultModel });
  } catch (error) {
    console.error('设置默认模型失败:', error);
    res.status(500).json({ error: '设置默认模型失败' });
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
router.get('/skills', async (req, res) => {
  try {
    try {
      await fs.access(workspaceSkillsPath);
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        await writeSkillsConfig([]);
        return res.json([]);
      }
    }
    const config = await readSkillsConfig();
    res.json(config);
  } catch (error) {
    console.error('获取技能列表失败:', error);
    res.status(500).json({ error: '获取技能列表失败' });
  }
});

// 2. 新增技能接口 post
router.post('/skills', async (req, res) => {
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
      throw new Error('skills.json 格式错误');
    }
    
    skills.unshift(newSkill);
    await writeSkillsConfig(skills);

    // 保存内容到 markdown 文件
    await fs.mkdir(skillsDir, { recursive: true });
    const mdPath = path.join(skillsDir, `${id}.md`);
    await fs.writeFile(mdPath, content || '', 'utf-8');

    res.json(newSkill);
  } catch (error) {
    console.error('新增技能失败:', error);
    res.status(500).json({ error: '新增技能失败' });
  }
});

// 3. 编辑技能接口 post
router.post('/skills/edit', async (req, res) => {
  try {
    const { id, name, summary, content } = req.body;
    if (!id) {
      return res.status(400).json({ error: '缺少技能ID' });
    }

    const skills = await readSkillsConfig();
    if (!Array.isArray(skills)) {
      throw new Error('skills.json 格式错误');
    }

    const index = skills.findIndex((s: any) => s.id === id);
    if (index === -1) {
      return res.status(404).json({ error: '技能不存在' });
    }

    skills[index] = { ...skills[index], name, summary };
    await writeSkillsConfig(skills);

    // 替换对应的 markdown 文件内容
    await fs.mkdir(skillsDir, { recursive: true });
    const mdPath = path.join(skillsDir, `${id}.md`);
    await fs.writeFile(mdPath, content || '', 'utf-8');

    res.json(skills[index]);
  } catch (error) {
    console.error('编辑技能失败:', error);
    res.status(500).json({ error: '编辑技能失败' });
  }
});

// 4. 删除技能接口 post
router.post('/skills/delete', async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: '缺少技能ID' });
    }

    let skills = await readSkillsConfig();
    if (!Array.isArray(skills)) {
      throw new Error('skills.json 格式错误');
    }

    const initialLength = skills.length;
    skills = skills.filter((s: any) => s.id !== id);

    if (skills.length === initialLength) {
      return res.status(404).json({ error: '技能不存在' });
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

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除技能失败:', error);
    res.status(500).json({ error: '删除技能失败' });
  }
});

// 5. 获取技能详情接口 post
router.post('/skills/detail', async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: '缺少技能ID' });
    }

    const mdPath = path.join(skillsDir, `${id}.md`);
    try {
      await fs.access(mdPath);
      const content = await fs.readFile(mdPath, 'utf-8');
      res.json({ content });
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        return res.status(404).json({ error: '技能文件不存在' });
      }
      throw e;
    }
  } catch (error) {
    console.error('获取技能详情失败:', error);
    res.status(500).json({ error: '获取技能详情失败' });
  }
});

export default router;