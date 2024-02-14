import { Router, Request, Response } from 'express';
import DataSet, { dsSchema } from '../../models/DataSet.js';
import MongoConnection from '../../db/MongoConnection.js';
import MongoFactory from '../../repositories/factory/mongo/MongoFactory.js';
import { ObjectId } from 'mongodb';
import { ZodError, z } from 'zod';

const factory = new MongoFactory(await MongoConnection.getConnection());
const repo = factory.createDataSetRepo(true);
repo.getPaginator().setPageSize(10);

const router = Router();
const patchValidator = dsSchema.partial()
    .omit({ owners: true, stats: true })
    .extend({
        id: z.string().length(24),
        owners: z.array(
            z.string().length(24)).transform(val => val.map(val => new ObjectId(val))
        ).optional()
    });

type GetSearchReq = Request<Record<string, never>, unknown, unknown, Partial<DataSet> & {
    page: string,
    id: string
}>;

type PostReq = Request<never, never, DataSet>;
type PutReq = Request<never, never, Partial<Mutable<DataSet>> & {id: string}>;
type PutRes = Response<{success: boolean, message: string, error?: ZodError}>

router.use((req: Request<unknown, unknown, unknown, {
    page: string,
    id: string,
    _id: ObjectId
}>, res: Response, next) => {
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

    const ds = await repo.findAllWithImages(filter, Number(req.query.page) || 1)
        .catch(error => console.log(error));
    res.json(ds);
});

router.post('/add', (req: PostReq, res: Response< unknown | {message: string}>) => {
    repo.insert(req.body)
        .then(data => {
            res.statusCode = 201;
            res.setHeader('Location', `/dataset/${data._id}`);
            res.json(data);
        })
        .catch(error => {
            console.error(error);
            res.statusCode = 422;
            const message = error instanceof Error ? error.message : String(error);

            res.json({ message });
        });
});

router.patch('/edit', (req: PutReq, res: PutRes) => {
    const result = patchValidator.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ success: false, message: 'errore validazione', error: result.error });
        return;
    }

    repo.updateById(result.data.id, result.data)
        .then(success => {
            if (!success) {
                res.status(500).json({ success, message: 'Errore update' });
                return;
            }

            res.status(200).json({ success, message: 'ok' });
        }).catch(error => {
            console.error(error);
            const message = error instanceof Error ? error.message : String(error);
            // 422 errore non gestito
            const statusCode = message.toLowerCase().includes('not found') ? 404 : 422;

            res.status(statusCode).json({ success: false, message });
        });
});

export default router;
