import express from 'express'
import connectDb from './config/db';
import { port } from './config/config';
import chalk from 'chalk';
import { Request, Response, NextFunction } from 'express';
import AppError from './utils/appError';
import { globalError } from './middlewares/globalError';
import { requestLogger } from './middlewares/requestLogger';
import logger from './logging/logger';
import traysRouter from './routes/traysRoute';
import conisterRoute from './routes/conistersRoute';
import vendingRouter from './routes/vendingRoute';
import slotsRouter from './routes/slotsRoute';
import skuProductRoute from './routes/skuProductRoute';
import slotInventoryRouter from './routes/slotInventoryRoute';
import salesRouter from './routes/salesRoute';
const app = express();
app.use(express.json());
// Log all incoming requests
app.use(requestLogger);

// Example route
app.get("/", (req, res) => {
   logger.info({ message: "Home route accessed" });
   res.send("Hello World");
});


app.use('/api/trays', traysRouter);
app.use('/api/conisters', conisterRoute);
app.use('/api/vending', vendingRouter);
app.use('/api/slots', slotsRouter);
app.use('/api/sku', skuProductRoute);
app.use('/api/slot-inventory', slotInventoryRouter);
app.use('/api/sales', salesRouter);

app.all('*', (req: Request, res: Response, next: NextFunction) => {
   next(new AppError(`can not find ${req.originalUrl} on this server`, 404))
})
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
   console.error("Error middleware:", err);
   res.status(500).json({ message: "Something went wrong", error: err.message });
 });
 
app.use(globalError)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
});
const startServer = async () => {
   await connectDb();
   app.listen(port, '0.0.0.0', () => {
      console.log(chalk.green(`Server is running on port ${port}`));
   });
}
startServer();
