import mongoose from 'mongoose';
import { dbUrl } from './config'
import chalk from 'chalk'
const connectDb = async () => {
   try {
      await mongoose.connect(dbUrl);
      console.log(chalk.green('Database connected successfully (docker)....'));
   } catch (error) {
      console.error(chalk.red('Error connecting to the database:', error));
      process.exit(1); // Exit the process with failure
   }
};

export default connectDb;
