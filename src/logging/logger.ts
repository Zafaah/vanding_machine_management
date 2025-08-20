
import { createLogger, format,  transports } from "winston";
const {combine, timestamp, errors, json} = format

const logger = createLogger({
    level:'info',
    format:combine(
        timestamp({
            format:'YYYY-MM-DD HH:mm:ss'
        }),
        errors({ stack: true }), // Include stack trace if error
        json() 
    ),
    transports:[
        new transports.Console({ stderrLevels: ["error"] }) 
    ],
});

export default logger;
