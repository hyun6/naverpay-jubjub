import *  as  winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import moment from 'moment-timezone';

const transport: DailyRotateFile = new DailyRotateFile({
    filename: 'jubjub-%DATE%.log',
    datePattern: 'YYYY-MM',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '15d',
    dirname: './log/',
});

interface TimestampOptions {
    tz?: string;
}


const appendTimestamp = winston.format((info, opts) => {
    const options = opts as TimestampOptions;
    if (options?.tz)
        info.timestamp = moment().tz(options.tz).format('YYYY-MM-DD HH:mm:ss ||');
    return info;
});

export const logger = winston.createLogger({
    transports: [
        transport,
        new winston.transports.Console(),
    ],
    format: winston.format.combine(
        appendTimestamp({ tz: 'Asia/Seoul' }),
        winston.format.printf(
            (info) => `${info.timestamp} ${info.level} | ${info.message}`,
        ),
    ),
});
