import { Router, Request, Response } from 'express';
import DataSet from '../../models/DataSet.js';
import DataSetFactory, { DataSetRepository } from '../../repositories/mongo/DataSetRepository.js';
import MongoConnection from '../../db/MongoConnection.js';

const repo = new DataSetFactory(await MongoConnection.getConnection())
    .createModelRepo() as DataSetRepository;

const router = Router();

type GetSearchReq = Request<Record<string, never>, unknown, unknown, Partial<DataSet>>;

router.get('/:id', async (req: Request<{id: string}>, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(await repo.findById(req.params.id));
});

router.get('/', async (req: GetSearchReq, res: Response) => {
    console.log(req.query);
    const ds = await repo.findAll(req.query);
    res.json(ds);
});

export default router;
