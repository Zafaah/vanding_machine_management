import Joi from "joi";
import { objectId } from "../middlewares/validation";
import { recipeIngredientValidate } from "./recipesValidate";

export const conisterValidate = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Name is required',
    'any.required': 'Name is required',
  }),
  machineId: objectId.required().messages({
    'string.empty': 'Machine ID is required',
    'any.required': 'Machine ID is required',
    'string.pattern.name': 'Invalid Machine ID format',
  }),
  ingredients: Joi.array().items(objectId, recipeIngredientValidate).default([]),
  ingredientId: Joi.array().items(objectId).default([]),
  capacity: Joi.number().min(0).required().messages({
    'number.base': 'Capacity must be a number',
    'number.min': 'Capacity cannot be negative',
    'any.required': 'Capacity is required',
  }),
  currentLevel: Joi.number().min(0).required().messages({
    'number.base': 'Current level must be a number',
    'number.min': 'Current level cannot be negative',
    'any.required': 'Current level is required',
  }),
  isAvailable: Joi.boolean().default(true),


});

export const idParamSchema = Joi.object({
  id: Joi.string()
    .length(24)
    .hex()
    .required()
    .messages({
      'string.length': 'ID must be 24 characters',
      'string.hex': 'ID must be a valid hex string',
      'any.required': 'ID is required',
    }),
});

export const updateCanisterValidate = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Name is required',
    'any.required': 'Name is required',
  }),
  machineId: objectId.required().messages({
    'string.empty': 'Machine ID is required',
    'any.required': 'Machine ID is required',
    'string.pattern.name': 'Invalid Machine ID format',
  }),
  ingredients: Joi.array().items(objectId, recipeIngredientValidate).default([]),
  capacity: Joi.number().min(0).required().messages({
    'number.base': 'Capacity must be a number',
    'number.min': 'Capacity cannot be negative',
    'any.required': 'Capacity is required',
  }),
  currentLevel: Joi.number().min(0).required().messages({
    'number.base': 'Current level must be a number',
    'number.min': 'Current level cannot be negative',
    'any.required': 'Current level is required',
  }),
  isAvailable: Joi.boolean().default(true),


});

export const refillCanisterValidate = Joi.object({
  refillAmount: Joi.number().min(0.01).required().messages({
    'number.base': 'Refill amount must be a number',
    'number.min': 'Refill amount must be greater than 0',
    'any.required': 'Refill amount is required',
  }),
});