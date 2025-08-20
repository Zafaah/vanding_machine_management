import AppError from "../utils/appError";
import { Request, Response, NextFunction } from 'express';
import logger from '../logging/logger';
export const globalError=(
    err:AppError,
    req:Request,
    res:Response,
    next:NextFunction
)=>{
    let statusCode= 500;
    let status='error';
    let message="internal server error";

    if(err instanceof AppError){
        statusCode=err.statusCode;
        status=err.status;
        message=err.message;
    }else{
        message= err || message;
    }

   
    logger.error({
        message: message,
        stack:err.stack,
        method: req.method,
        url: req.originalUrl,
    })

    res.status(statusCode).json({
        status:status,
        message:message,
        stack:err.stack
    })

}
