import cors from 'cors';
import ExpressBuilder from './ExpressBuilder.js';
import { Request, Response, json, NextFunction } from 'express';
import { env } from './env.js';
import MongoConnection from './db/MongoConnection.js';

const PORT = 3000;
process.env.TZ = 'Europe/Rome';

console.info(env);
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
        console.info(req.url);
        console.log(req.headers);
        next();
    })
    .addMiddleware(json())
    .addMiddleware(cors())
    .addRoute('/index', 'get', (req: Request, res: Response) => {
        res.send('<h1>hello world</h1>');
    })
    .build()
    .use('/dataset', (await import('./http/routes/DataSet.js')).default)
    .listen(PORT, () => console.info(`server started on ${PORT}`));
