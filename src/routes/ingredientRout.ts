import express from 'express';
import { createIngredient, 
    getAllIngredients, 
    getIngredientById, 
    updateIngredient, 
    deleteIngredient } from '../controllers/ingredientController';
import { ingredientValidate } from '../validate/ingredientValidate';
import { validate } from '../middlewares/validation';

const ingredientRouter = express.Router();

ingredientRouter.route('/')
   .post(validate(ingredientValidate), createIngredient)
   .get(getAllIngredients);

ingredientRouter.route('/:id')
   .get(getIngredientById)
   .put(updateIngredient)
   .delete(deleteIngredient);



export default ingredientRouter;
