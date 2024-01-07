import cors from 'cors';
import ExpressBuilder from './ExpressBuilder.js';
import { Request, Response, json, NextFunction } from 'express';
import { env } from './env.js';
import MongoConnection from './db/MongoConnection.js';

const PORT = 3000;

const connection = MongoConnection.setConnectionParams({
    name: env.DB_NAME,
    address: env.DB_ADDRESS,
    passw: env.DB_PASSW,
    port: env.DB_PORT,
    user: env.DB_USER
});
console.info(connection);

new ExpressBuilder()
    .addMiddleware((req: Request, res: Response, next: NextFunction) => {
        console.log(req.headers);
        next();
    })
    .addMiddleware(json())
    .addMiddleware(cors())
    .addRoute('/index', 'get', (req: Request, res: Response) => {
        res.send('<h1>hello world</h1>');
    })
    .build()
    .listen(PORT, () => console.info(`server started on ${PORT}`));
