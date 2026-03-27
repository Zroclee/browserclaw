import { Request, Response, NextFunction } from 'express';

// 自定义业务异常类（可选）
export class BusinessError extends Error {
  public code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = 'BusinessError';
  }
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // 记录错误日志（可根据需要替换为更完善的日志系统）
  console.error(`[Error] ${err.message}`, err);

  // 判断是否为业务异常
  if (err instanceof BusinessError) {
    // 根据已有 res.error(message, code) 的签名顺序调用
    return res.error(err.message, err.code);
  }

  // 其他未知错误，返回 500
  // 开发环境返回具体错误信息，生产环境脱敏处理
  const message = process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error';
  return res.error(message, 500);
}
