import { Request, Response, NextFunction } from "express";
import logger from "../logging/logger";

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info({
      message: "Incoming request",
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      ip: req.ip,
      durationMs: duration,
    });
  });

  next();
};
