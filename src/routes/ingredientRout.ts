import express from 'express';
import { createIngredient, 
    getAllIngredients, 
    getIngredientById, 
    updateIngredient, 
    deleteIngredient } from '../controllers/ingredientController';

const ingredientRouter = express.Router();

ingredientRouter.route('/')
   .post(createIngredient)
   .get(getAllIngredients);

ingredientRouter.route('/:id')
   .get(getIngredientById)
   .put(updateIngredient)
   .delete(deleteIngredient);

export default ingredientRouter;
