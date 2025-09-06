import express from 'express';
import { createIngredient, 
    getAllIngredients, 
    getIngredientById, 
    updateIngredient, 
    deleteIngredient,
    updateIngredientStock } from '../controllers/ingredientController';

const ingredientRouter = express.Router();

ingredientRouter.route('/')
   .post(createIngredient)
   .get(getAllIngredients);

ingredientRouter.route('/:id')
   .get(getIngredientById)
   .put(updateIngredient)
   .delete(deleteIngredient);

ingredientRouter.post('/:id/stock', updateIngredientStock);

export default ingredientRouter;
