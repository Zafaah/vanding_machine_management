import express from "express";
import {
   createSKUProduct,
   getAllSKUProducts,
   getSKUProductById,
   updateSKUProduct,
   deleteSKUProduct
} from "../controllers/skuProductControllers";

const skuProductRoute = express.Router();

skuProductRoute.route("/")
   .post(createSKUProduct)
   .get(getAllSKUProducts);

skuProductRoute.route("/:id")
   .get(getSKUProductById)
   .put(updateSKUProduct)
   .delete(deleteSKUProduct);

export default skuProductRoute;