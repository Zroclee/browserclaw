import { Router } from 'express';
import { browser_stream_invoke } from '@zrocclaw/core/agents'
import { getConfigPath } from '@zrocclaw/core/fileManager';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { sessionModel } from '@zrocclaw/core/fileManager';
import { BusinessError } from '../middlewares/errorHandler';

const configDir = getConfigPath();
const configFilePath = path.join(configDir, 'model.json');



const router = Router();
router.get('/', (req, res) => {
  res.success({ status: "OK" });
});

router.post('/stream', async (req, res, next) => {
  try {
    const query = req.body.query as string;
    const thread_id = req.body.thread_id as string;
    
    if (!query || !thread_id) {
      throw new BusinessError(400, "Missing query or thread_id in request body");
    }

    const configContent = await fs.readFile(configFilePath, 'utf-8');
    const config = JSON.parse(configContent);
    const modelConfig = config.defaultModel;

    if (!modelConfig) {
      throw new BusinessError(500, "defaultModel not found in config");
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = browser_stream_invoke(query, thread_id, modelConfig);

    for await (const chunk of stream) {
      res.write(chunk);
    }

    res.end();
  } catch (error) {
    if (!res.headersSent) {
      next(error);
    } else {
      console.error("Stream error after headers sent:", error);
      res.end();
    }
  }
});

router.get('/session', (req, res, next) => {
  try {
    const isNew = req.query.new === 'true';
    let sessionId = sessionModel.getSessionId();
    if (!sessionId || isNew) {
      sessionId = crypto.randomUUID();
      sessionModel.setSessionId(sessionId);
    }
    res.success({ sessionId });
  } catch (error) {
    next(error);
  }
});

router.post('/history', (req, res, next) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      throw new BusinessError(400, "Missing sessionId");
    }
    
    const data = sessionModel.getSessionData();
    res.success({ data });
  } catch (error) {
    next(error);
  }
});

router.post('/history/add', (req, res, next) => {
  try {
    const { sessionId, id, role, content, ...rest } = req.body;
    if (!sessionId) {
      throw new BusinessError(400, "Missing sessionId");
    }
    if (!id || !role || !content) {
      throw new BusinessError(400, "Missing required SessionDataItem fields (id, role, content)");
    }

    const item = { id, role, content, ...rest };
    sessionModel.addSessionItem(item);
    
    res.success({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
