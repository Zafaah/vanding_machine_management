import express from "express";
import {
    createRecipe,
    getAllRecipes,
    getRecipeById,
    updateRecipe,
    deleteRecipe,
    getRecipesByMachine
} from "../controllers/recipeController";

const recipeRouter = express.Router();

recipeRouter.route('/')
    .post(createRecipe)
    .get(getAllRecipes);

recipeRouter.route('/:id')
    .get(getRecipeById)
    .put(updateRecipe)
    .delete(deleteRecipe);

recipeRouter.get('/machine/:machineId', getRecipesByMachine);

export default recipeRouter;
