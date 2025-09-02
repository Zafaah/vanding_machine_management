import type { Request, Response, NextFunction } from 'express';

type controllerFunction = (req: Request, res: Response, next: NextFunction) => Promise<any>
const catchAsync = (fn: controllerFunction) => (
   req: Request,
   res: Response,
   next: NextFunction
) =>
   fn(req, res, next).catch((error: any) => {
      console.error('Error caught in catchAsync:', error);
      next(error);
   }
   )

export default catchAsync;



