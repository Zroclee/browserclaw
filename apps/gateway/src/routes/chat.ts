import { Router } from 'express';
import { browser_stream_invoke } from '@zrocclaw/core/agents'
import { getConfigPath } from '@zrocclaw/core/fileManager';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { sessionModel } from '@zrocclaw/core/fileManager';

const configDir = getConfigPath();
const configFilePath = path.join(configDir, 'model.json');



const router = Router();
router.get('/', (req, res) => {
  res.json({ status: "OK" });
});

router.post('/stream', async (req, res) => {
  try {
    const query = req.body.query as string;
    const thread_id = req.body.thread_id as string;
    
    if (!query || !thread_id) {
      return res.status(400).json({ error: "Missing query or thread_id in request body" });
    }

    const configContent = await fs.readFile(configFilePath, 'utf-8');
    const config = JSON.parse(configContent);
    const modelConfig = config.defaultModel;

    if (!modelConfig) {
      return res.status(500).json({ error: "defaultModel not found in config" });
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
    console.error("Stream error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.end();
    }
  }
});

router.get('/session', (req, res) => {
  const isNew = req.query.new === 'true';
  let sessionId = sessionModel.getSessionId();
  if (!sessionId || isNew) {
    sessionId = crypto.randomUUID();
    sessionModel.setSessionId(sessionId);
  }
  res.json({ sessionId });
});

export default router;
