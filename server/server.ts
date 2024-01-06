import express, { Application, RequestHandler, Request, Response, json, NextFunction }
    from 'express';
import cors from 'cors';

type HttpMethod = 'get' | 'post' | 'put' | 'delete';
type Routes = {path: string, method: HttpMethod, handler: RequestHandler};

class ExpressBuilder {
    public readonly app : Application;
    private routes: Routes[];
    private middlewares: RequestHandler[];

    constructor () {
        this.app = express();
        this.routes = [];
        this.middlewares = [];
    }

    addMiddleware (mid: RequestHandler) {
        this.middlewares.push(mid);
        return this;
    }

    /*     addRouter (path: string, routes: Router) {
        return this;
    } */

    addRoute (path: string, method: HttpMethod, route: RequestHandler) {
        this.routes.push({ path, method, handler: route });
        return this;
    }

    build (): Application {
        this.middlewares.forEach(middleware => {
            console.info(middleware);
            this.app.use(middleware);
        });

        this.routes.forEach(route => {
            console.info(route);
            this.app[route.method](route.path, route.handler);
        });

        return this.app;
    }
}

const PORT = 3000;
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
