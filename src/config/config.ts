import dotenv from 'dotenv';
dotenv.config();

export const port = process.env.PORT || 5000;
export const dbUrl = process.env.MONGO_URI || 'mongodb://localhost:27017/vending-machines';
