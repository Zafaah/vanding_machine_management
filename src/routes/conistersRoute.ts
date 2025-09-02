import express from 'express';
import { conisterValidate, updateCanisterValidate } from '../validate/conisterValidate';
import { validate } from '../middlewares/validation';
import { createCanister,getAllCanisters, getCanisterById, updateCanister, deleteCanister } from '../controllers/conister';


const conisterRoute = express.Router();

conisterRoute.route('/')
   .post(validate(conisterValidate), createCanister)
   .get(getAllCanisters);

conisterRoute.route('/:id')
   .get(getCanisterById)
   .put(validate(updateCanisterValidate), updateCanister)
   .delete(deleteCanister);

export default conisterRoute;
