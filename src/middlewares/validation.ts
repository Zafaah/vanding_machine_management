import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { sendError } from '../utils/apiResponse';

// Base validation schemas
const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/, 'valid ObjectId');

// Validation middleware factory
const validate = (schema: Joi.ObjectSchema,
  property: 'body' | 'params' | 'query' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.context?.key || 'unknown',
        message: detail.message,
      }));
      return sendError(
        res,                    
        'Validation Error',     
        400,                    
        undefined,              
        'VALIDATION_ERROR',    
        errors                  
      );
    }



    req[property] = value;
    next();
  };
};

export {
  validate,
  objectId,
};