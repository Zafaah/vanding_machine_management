import express from 'express';
import {
   getAllVendingMachines,
   createVendingMachine,
   getVendingMachineById,
   updateVendingMachine,
   deleteVendingMachine
} from '../controllers/vendingController';
import { validate } from '../middlewares/validation';
import { vendingValidationSchema, idParamSchema,updateVendingMachineSchema ,getQuerySchema } from '../validate/vendingValidation';

const vendingRouter = express.Router();

vendingRouter.route('/')
   .get(validate(getQuerySchema, 'query'), getAllVendingMachines)
   .post(validate(vendingValidationSchema), createVendingMachine);

vendingRouter.route('/:id')
   .get(validate(idParamSchema, 'params'), getVendingMachineById)
   .put(validate(updateVendingMachineSchema), updateVendingMachine)
   .delete(validate(idParamSchema, 'params'), deleteVendingMachine);

export default vendingRouter;
