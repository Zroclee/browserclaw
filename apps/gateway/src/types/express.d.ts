import { StandardResponse } from './response';

declare global {
  namespace Express {
    interface Response {
      success<T = any>(data?: T, message?: string): this;
      error(message: string, code?: number): this;
    }
  }
}
