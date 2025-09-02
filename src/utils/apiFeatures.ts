import { Request } from "express";
import { Model, Document, PopulateOptions } from "mongoose";

interface PaginatedResult<T> {
  results: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function paginateAndSearch<T extends Document>(
  Model: Model<T>,
  req: Request,
  populate?: string | PopulateOptions | (string | PopulateOptions)[]
): Promise<PaginatedResult<T>> {
  const { page = 1, limit = 10, search = "", ...filters } = req.query;

  const pageNum = Math.max(1, parseInt(page as string));
  const limitNum = Math.max(1, parseInt(limit as string));


  const searchCondition =
    search && typeof search === "string"
      ? { name: { $regex: search, $options: "i" } }
      : {};


  const query = { ...filters, ...searchCondition };

 
  const total = await Model.countDocuments(query);

  
  let dbQuery = Model.find(query)
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum)
    .sort({ createdAt: -1 });

  if (populate) {
    if(typeof populate === 'string') {
      dbQuery = dbQuery.populate(populate);
    }else if(Array.isArray(populate)) {
      dbQuery = dbQuery.populate(populate);
    } else {
      dbQuery = dbQuery.populate(populate);
    }
  }

  const results = await dbQuery.exec();

  return {
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
    results,
  };
}
