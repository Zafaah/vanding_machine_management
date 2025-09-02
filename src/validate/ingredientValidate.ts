import Joi from "joi";
import { UnitOfMeasure } from "../types/types";

// Ingredient Validation
export const ingredientValidate = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Name is required',
    'any.required': 'Name is required',
  }),
  unitOfMeasure: Joi.string()
    .valid(...Object.values(UnitOfMeasure))
    .required()
    .messages({
      'any.only': `Unit of measure must be one of: ${Object.values(UnitOfMeasure).join(', ')}`,
      'any.required': 'Unit of measure is required',
    }),
  stockLevel: Joi.number().min(0).required().messages({
    'number.base': 'Stock level must be a number',
    'number.min': 'Stock level cannot be negative',
    'any.required': 'Stock level is required',
  }),
  threshold: Joi.number().min(0).required().messages({
    'number.base': 'Threshold must be a number',
    'number.min': 'Threshold cannot be negative',
    'any.required': 'Threshold is required',
  }),
});
