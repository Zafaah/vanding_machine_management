import express from 'express';
import { conisterValidate, updateCanisterValidate } from '../validate/conisterValidate';
import { validate } from '../middlewares/validation';
import { createCanister,getAllCanisters, getCanisterById, updateCanister, deleteCanister, assignIngredientToCanister, refillCanister, consumeCanistersForSale } from '../controllers/conister';


const conisterRoute = express.Router();

conisterRoute.route('/')
   .post(validate(conisterValidate), createCanister)
   .get(getAllCanisters);

conisterRoute.route('/:id')
   .get(getCanisterById)
   .put(validate(updateCanisterValidate), updateCanister)
   .delete(deleteCanister);

// assign ingredient to a canister
conisterRoute.post('/:id/assign', assignIngredientToCanister);
// refill canister
conisterRoute.post('/:id/refill', refillCanister);
// consume for coffee sale
conisterRoute.post('/consume', consumeCanistersForSale);

export default conisterRoute;
