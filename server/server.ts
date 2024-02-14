import cors from 'cors';
import ExpressBuilder from './ExpressBuilder.js';
import { Request, Response, json, NextFunction } from 'express';
import { env } from './env.js';
import MongoConnection from './db/MongoConnection.js';
import { mkdir } from 'fs/promises';

const PORT = env.PORT;
process.env.TZ = 'Europe/Rome';

const path = new URL('public', `file://${process.cwd()}/`).pathname;
console.log(path);
await mkdir(path, {
    recursive: true
}).catch(error => {
    console.error('Impossibile creare path ' + path);
    throw error;
});

console.info(env);

// N.B. Tutti i moduli che usano la connessione con il db devono essere importati dopo, con import dinamici
MongoConnection.setConnectionParams({
    name: env.DB_NAME,
    address: env.DB_ADDRESS,
    passw: env.DB_PASSW,
    port: env.DB_PORT,
    user: env.DB_USER
});

new ExpressBuilder()
    .addMiddleware((req: Request, res: Response, next: NextFunction) => {
        console.info('\n***********\nDebug Middleware\n\n');
        console.info(req.url);
        console.log(req.headers);
        console.log('\n***********\n');
        next();
    })
    .addMiddleware(json())
    .addMiddleware(cors())
    .addRoute('/index', 'get', (req: Request, res: Response) => {
        res.send('<h1>hello world</h1>');
    })
    .addRouter('/dataset', (await import('./http/routes/DataSet.js')).default)
    .addRouter('/user', (await import('./http/routes/User.js')).default)
    .addRouter('/image', (await import('./http/routes/Images.js')).default)
    .addStaticPath('', path)
    .build()
    .listen(PORT, () => console.info(`server started on ${PORT}`));
