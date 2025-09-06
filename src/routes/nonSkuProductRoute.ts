import express from "express";
import {
    createNonSKUProduct,
    getAllNonSKUProducts,
    getNonSKUProductById,
    updateNonSKUProduct,
    deleteNonSKUProduct
} from "../controllers/nonSkuProductController";

const nonSkuRouter = express.Router();

nonSkuRouter.route('/')
    .post(createNonSKUProduct)
    .get(getAllNonSKUProducts);

nonSkuRouter.route('/:id')
    .get(getNonSKUProductById)
    .put(updateNonSKUProduct)
    .delete(deleteNonSKUProduct);

export default nonSkuRouter;


