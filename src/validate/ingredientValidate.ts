import Joi from "joi";
import { UnitOfMeasure } from "../types/types";
import { objectId } from "../middlewares/validation";
// Ingredient Validation
export const ingredientValidate = Joi.object({
  ingredientId: Joi.string().trim().required().messages({
    'string.empty': 'Ingredient ID is required',
    'any.required': 'Ingredient ID is required',
  }),
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
  
  
}).unknown(false); // Reject unknown fields
