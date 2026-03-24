import { getConfigPath } from './manager';
import fs from 'fs';
import path from 'path';

export interface SessionDataItem extends Record<string, any> {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface SessionData {
  sessionId: string | null;
  sessionData: SessionDataItem[];
}

class SessionModel {
  private static instance: SessionModel;
  private filePath: string;
  private data: SessionData;

  private constructor() {
    this.filePath = path.join(getConfigPath(), 'session.json');
    this.data = {
      sessionId: null,
      sessionData: [],
    };
    this.load();
  }

  public static getInstance(): SessionModel {
    if (!SessionModel.instance) {
      SessionModel.instance = new SessionModel();
    }
    return SessionModel.instance;
  }

  private load(): void {
    if (fs.existsSync(this.filePath)) {
      try {
        const fileContent = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(fileContent);
        this.data = {
          sessionId: parsed.sessionId ?? this.data.sessionId,
          sessionData: Array.isArray(parsed.sessionData) ? parsed.sessionData : [],
        };
      } catch (error) {
        console.error('Failed to parse session.json:', error);
      }
    } else {
      // 文件不存在就创建一个
      this.save();
    }
  }

  private save(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save session.json:', error);
    }
  }

  public getSessionId(): string | null {
    this.load();
    return this.data.sessionId;
  }

  public setSessionId(id: string | null): void {
    if (this.data.sessionId !== id) {
      this.data.sessionData = [];
    }
    this.data.sessionId = id;
    this.save();
  }

  public getSessionData(): SessionDataItem[] {
    this.load();
    return this.data.sessionData;
  }

  public addSessionItem(item: SessionDataItem): void {
    this.load();
    this.data.sessionData.push(item);
    this.save();
  }
}

export const sessionModel = SessionModel.getInstance();
export default sessionModel;
