import { Router, Request, Response } from 'express';
import DataSet from '../../models/DataSet.js';
import MongoConnection from '../../db/MongoConnection.js';
import MongoFactory from '../../repositories/factory/mongo/MongoFactory.js';
import { ObjectId } from 'mongodb';

const factory = new MongoFactory(await MongoConnection.getConnection());
const repo = factory.createDataSetRepo(true);
repo.getPaginator().setPageSize(10);

const router = Router();

type GetSearchReq = Request<Record<string, never>, unknown, unknown, Partial<DataSet> & {
    page: string,
    id: string
}>;

type PostReq = Request<never, never, DataSet>;
type PutReq = Request<never, never, Partial<DataSet> & {id: string}>;

router.use((req: Request<unknown, unknown, unknown, {
    page: string,
    id: string,
    _id: ObjectId
}>, res: Response, next) => {
    res.setHeader('Content-Type', 'application/json');
    if (req.query.id) {
        req.query._id = new ObjectId(req.query.id);
    }
    next();
});

router.get('/:id', async (req: Request<{id: string}>, res: Response) => {
    const dataset = await repo.findById(req.params.id)
        .then(dataset => {
            if (!dataset) {
                res.statusCode = 404;
                res.json({});
                res.end();
            }

            return dataset;
        })
        .catch(error => {
            console.log(error);
            res.statusCode = 500;
            res.json({});
            res.end();
        });

    res.json({
        ...dataset,
        ...{
            users: await repo.users(dataset!._id)
                .catch(error => {
                    console.error(error);
                    return [];
                })
        }
    });
});

const omit = ['page', 'id'];
router.get('/', async (req: GetSearchReq, res: Response) => {
    const filter = Object.fromEntries(
        Object.entries(req.query).filter(([key]) => !omit.includes(key))
    );

    const ds = await repo.findAllPaginated(filter, Number(req.query.page) || 1)
        .catch(error => console.log(error));
    res.json(ds);
});

router.post('/add', (req: PostReq, res: Response<{id: string} | {message: string}>) => {
    repo.insert(req.body)
        .then(data => {
            const id = data._id.toString();
            res.statusCode = 201;
            res.setHeader('Location', `/dataset/${id}`);
            res.json({ id });
        })
        .catch(error => {
            console.error(error);
            res.statusCode = 422;
            const message = error instanceof Error ? error.message : String(error);

            res.json({ message });
        });
});

router.put('/add', (req: PutReq, res: Response<{success: boolean, message: string}>) => {
    repo.updateById(req.body.id, req.body)
        .then(success => {
            if (!success) {
                throw new Error(JSON.stringify(req.body));
            }
            res.statusCode = 204;

            res.json({ success, message: 'ok' });
        })
        .catch(error => {
            console.info(req.body);
            console.error(error);
            res.statusCode = 422;
            const message = error instanceof Error ? error.message : String(error);

            res.json({ success: false, message });
        });
});

export default router;
