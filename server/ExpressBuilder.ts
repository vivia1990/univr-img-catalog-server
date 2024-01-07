import express, { Application, RequestHandler }
    from 'express';

type HttpMethod = 'get' | 'post' | 'put' | 'delete';
type Routes = {path: string, method: HttpMethod, handler: RequestHandler};

export default class ExpressBuilder {
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
