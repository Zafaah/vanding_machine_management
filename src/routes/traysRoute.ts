import express from 'express';
import { validate } from '../middlewares/validation';
import { trayValidate } from '../validate/traysValidate';
import { createTrays, deleteTray, getAllTrays, getTrayById, updateTray } from '../controllers/traysController';
const traysRouter = express.Router();

traysRouter.route('/')
   .post(validate(trayValidate), createTrays)
   .get(getAllTrays);

traysRouter.route('/:id')
   .get(getTrayById)
   .put(validate(trayValidate), updateTray)
   .delete(deleteTray);

export default traysRouter;
