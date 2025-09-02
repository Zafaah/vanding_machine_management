import Joi from 'joi';
import { machineType, MachineStatus } from '../types/types';
import { objectId } from '../middlewares/validation';

export const vendingValidationSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Name is required',
    'any.required': 'Name is required',
  }),
  type: Joi.string()
    .valid(...Object.values(machineType))
    .required()
    .messages({
      'any.only': `Type must be one of: ${Object.values(machineType).join(', ')}`,
      'any.required': 'Type is required',
    }),
  status: Joi.string()
    .valid(...Object.values(MachineStatus))
    .default(MachineStatus.ACTIVE)
    .messages({
      'any.only': `Status must be one of: ${Object.values(MachineStatus).join(', ')}`,
    }),
  location: Joi.string().trim().required().messages({
    'string.empty': 'Location is required',
    'any.required': 'Location is required',
  }),
  trays: Joi.array().items(objectId).default([]),
  canisters: Joi.array().items(objectId).default([]),
});

// Example: GET /api/vending?limit=10&page=2
export const getQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).default(10),
  page: Joi.number().integer().min(1).default(1),
  search: Joi.string().optional(),
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
export const updateVendingMachineSchema = Joi.object({
  name: Joi.string().trim().messages({
    'string.empty': 'Name is required',
    'any.required': 'Name is required',
  }),
  type: Joi.string()
    .valid(...Object.values(machineType))
    .messages({
      'any.only': `Type must be one of: ${Object.values(machineType).join(', ')}`,
    }),
  status: Joi.string()
    .valid(...Object.values(MachineStatus))
    .messages({
      'any.only': `Status must be one of: ${Object.values(MachineStatus).join(', ')}`,
    }),
  location: Joi.string().trim().messages({
    'string.empty': 'Location is required',
    'any.required': 'Location is required',
  }),
  trays: Joi.array().items(objectId),
  canisters: Joi.array().items(objectId),
});
