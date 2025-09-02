 import Joi from 'joi';
 import { objectId } from '../middlewares/validation';
 
  export const recipeIngredientValidate = Joi.object({
    ingredientId: objectId.required().messages({
      'string.empty': 'Ingredient ID is required',
      'any.required': 'Ingredient ID is required',
      'string.pattern.name': 'Invalid Ingredient ID format',
    }),
    amount: Joi.number().min(0).required().messages({
      'number.base': 'Amount must be a number',
      'number.min': 'Amount cannot be negative',
      'any.required': 'Amount is required',
    }),
  });
  
  export const recipeValidate = Joi.object({
    name: Joi.string().trim().required().messages({
      'string.empty': 'Name is required',
      'any.required': 'Name is required',
    }),
    ingredients: Joi.array().items(recipeIngredientValidate).min(1).required().messages({
      'array.base': 'Ingredients must be an array',
      'array.min': 'At least one ingredient is required',
      'any.required': 'Ingredients are required',
    }),
    price: Joi.number().min(0).required().messages({
      'number.base': 'Price must be a number',
      'number.min': 'Price cannot be negative',
      'any.required': 'Price is required',
    }),
    isAvailable: Joi.boolean().default(true),
    machineId: objectId.required().messages({
      'string.empty': 'Machine ID is required',
      'any.required': 'Machine ID is required',
      'string.pattern.name': 'Invalid Machine ID format',
    }),
  });