import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message?: string;
    stack?: string;
    details?: any;
  };
  timestamp: string; // ISO string, not Date object
}

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data: T,
  statusCode: number = 200
): void => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()  // ensure string format
  };

  res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  stack?: string,
  code: string = 'INTERNAL_ERROR',
  details?: any
): void => {
  const response: ApiResponse = {
    success: false,
    message,
    error: {
      code,
      message,
      stack,
      details
    },
    timestamp: new Date().toISOString()
  };

  res.status(statusCode).json(response);
};