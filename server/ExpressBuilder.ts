import express, { Application, RequestHandler, Router }
    from 'express';

type HttpMethod = 'get' | 'post' | 'put' | 'delete';
type Routes = {path: string, method: HttpMethod, handler: RequestHandler};
type Routers = {path: string, router: Router};

export default class ExpressBuilder {
    public readonly app : Application;
    private routes: Routes[];
    private middlewares: RequestHandler[];
    private routers: Routers[];

    constructor () {
        this.app = express();
        this.routes = [];
        this.middlewares = [];
        this.routers = [];
    }

    addMiddleware (mid: RequestHandler) {
        this.middlewares.push(mid);
        return this;
    }

    addRouter (path: string, router: Router) {
        this.routers.push({ path, router });
        return this;
    }

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
            console.info('\nRotta: "%s", Method: "%s"\n', route.path, route.method);
            this.app[route.method](route.path, route.handler);
        });

        this.routers.forEach(obj => {
            console.info('\n%s\n', obj.path);
            this.app.use(obj.path, obj.router);
        });

        return this.app;
    }
}
