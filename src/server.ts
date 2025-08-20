import express from 'express'
import connectDb from './config/db';
import { port } from './config/config';
import chalk from 'chalk';
import { Request,Response , NextFunction} from 'express';
import AppError from './utils/appError';
import { globalError } from './middlewares/globalError';
import { requestLogger } from './logging/requestLogger';
import logger from './logging/logger';

const app = express();
app.use(express.json());
// Log all incoming requests
app.use(requestLogger);

// Example route
app.get("/", (req, res) => {
  logger.info({ message: "Home route accessed" });
  res.send("Hello World");
});

app.all('*',( req:Request, res:Response,next:NextFunction)=>{
   next(new AppError(`can not find ${req.originalUrl} on this server`, 404))
})

app.use(globalError)
const startServer=async()=>{
   await connectDb();
   app.listen(port, () => {
      console.log(chalk.green(`Server is running on port ${port}`));
   });
}
startServer();
