import { Router, Request, Response, NextFunction } from 'express';
import MongoConnection from '../../db/MongoConnection.js';
import MongoFactory from '../../repositories/factory/mongo/MongoFactory.js';
import { ObjectId } from 'mongodb';
import { env } from '../../env.js';
import { DiskManager, Transmit, TransmitOptions } from '@quicksend/transmit';
import { mkdir, rename } from 'fs/promises';
import osPath from 'node:path';
import Image from '../../models/Image.js';

type FileUploadRequest = Request<unknown, never, {idDataset: string, total: string}>;

const basePath = new URL(env.IMG_STORAGE, `file://${process.cwd()}/`).pathname;

const factory = new MongoFactory(await MongoConnection.getConnection());
const repo = factory.createImageRepo();

type UploadResp = Response<unknown, {
    files: string[],
    fields: {
        idDataset: string,
        total: string
    }
}>

const router = Router();
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

const upload = (options: Partial<TransmitOptions> = {}) => (req: FileUploadRequest, res: Response, next: NextFunction) => new Transmit(options)
    .parseAsync(req)
    .then(async sent => {
        res.locals.files = sent.files.map(file => file.name);
        res.locals.fields = Object.fromEntries(
            sent.fields.map(field => [field.name, field.value])
        );

        const { idDataset } = res.locals.fields as {idDataset: string};
        if (!idDataset) {
            next(new Error('Id dataset mancante'));
        }

        const dsPath = osPath.join(basePath, idDataset);
        await mkdir(dsPath, { recursive: true });

        for (const file of sent.files) {
            const path = osPath.join(basePath, file.id);
            const newPath = osPath.join(dsPath, file.name);
            await rename(path, newPath).catch(console.error);
        }

        next();
    })
    .catch(error => {
        console.log(error);
        res.statusCode = 500;
        res.json({ success: false });
    });

const manager = new DiskManager({
    directory: basePath
});

router.post('/upload', upload({ manager, maxFiles: 100 }), (req: FileUploadRequest, res: UploadResp) => {
    const { idDataset } = res.locals.fields;
    const { files } = res.locals;
    const models = files.map(
        name => new Image(name, idDataset + '/' + name, [], new ObjectId(idDataset)));

    repo.insertMany(models).then(data => {
        const meta = repo.getPaginator().buildMetaData(1, 100);
        res.status(201).json({ data: data.inserted, pagination: meta });
    });
});

export default router;
