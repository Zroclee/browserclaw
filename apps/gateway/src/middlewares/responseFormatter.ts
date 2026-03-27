import { Request, Response, NextFunction } from 'express';

export const responseFormatter = (req: Request, res: Response, next: NextFunction) => {
  res.success = function <T = any>(data?: T, message: string = 'success') {
    return this.json({
      code: 0,
      message,
      data,
    });
  };

  res.error = function (message: string, code: number = -1) {
    return this.status(200).json({
      code,
      message,
    });
  };

  next();
};
