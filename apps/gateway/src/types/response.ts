export interface StandardResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}
