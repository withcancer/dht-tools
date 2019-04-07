const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;
class Logger{
    constructor(){
        const myFormat = printf(info => {
            return `${info.timestamp} [${info.level}]: ${info.message}`;
        });
        this.logger = createLogger({
            level: 'info',
            format: combine(
                timestamp(),
                myFormat
            ),
            transports: [
                new transports.File({
                    filename: 'combined.log'
                })
            ]
        });
        if (process.env.NODE_ENV !== 'production') {
            this.logger.add(new transports.Console({
              format: format.simple()
            }));
        }
    }
}

module.exports = new Logger().logger;
