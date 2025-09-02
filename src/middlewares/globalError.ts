import AppError from "../utils/appError";
import { sendError } from "../utils/apiResponse";
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

    sendError(res, message,statusCode,err.status,err.message, err.stack)
   

}
