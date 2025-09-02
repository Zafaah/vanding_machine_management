import Joi from "joi";
import { UnitOfMeasure } from "../types/types";

  export const skuProductValidate = Joi.object({
    name: Joi.string().trim().required().messages({
      'string.empty': 'Name is required',
      'any.required': 'Name is required',
    }),
    price: Joi.number().min(0).required().messages({
      'number.base': 'Price must be a number',
      'number.min': 'Price cannot be negative',
      'any.required': 'Price is required',
    }),
    unitOfMeasure: Joi.string()
      .valid(...Object.values(UnitOfMeasure))
      .required()
      .messages({
        'any.only': `Unit of measure must be one of: ${Object.values(UnitOfMeasure).join(', ')}`,
        'any.required': 'Unit of measure is required',
      }),
    quantity: Joi.number().integer().min(0).default(0).messages({
      'number.base': 'Quantity must be a number',
      'number.integer': 'Quantity must be an integer',
      'number.min': 'Quantity cannot be negative',
    }),
  });
  

  