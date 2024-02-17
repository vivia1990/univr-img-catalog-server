import { Router, Request, Response, NextFunction } from 'express';
import MongoConnection from '../../db/MongoConnection.js';
import MongoFactory from '../../repositories/factory/mongo/MongoFactory.js';
import { ObjectId } from 'mongodb';
import { env } from '../../env.js';
import { DiskManager, Transmit, TransmitOptions } from '@quicksend/transmit';
import { mkdir, rename, unlink } from 'fs/promises';
import osPath from 'node:path';
import ImageModel, { imgSchema } from '../../models/Image.js';
import { join as pJoin } from 'path';
import { ZodError, z } from 'zod';

type Image = PropertiesOnly<ImageModel>;
type FileUploadRequest = Request<unknown, never, {idDataset: string, total: string}>;

type DelRequest = Request<unknown, unknown, {id: string, path: string}, unknown>;
type DelResponse = Response<{ success: boolean, message: string }>

type GetSearchReq = Request<unknown, unknown, unknown, Partial<Image> & {
    page: string,
    id: string
}>;

type ImgResponse = Response<unknown, {_id: ObjectId}>;

type UploadResp = Response<unknown, {
    files: string[],
    fields: {
        idDataset: string,
        total: string
    }
}>

const router = Router();
const factory = new MongoFactory(await MongoConnection.getConnection());
const repo = factory.createImageRepo(true);
const basePath = new URL(env.IMG_STORAGE, `file://${process.cwd()}/`).pathname;

router.use((req: GetSearchReq, res: ImgResponse, next) => {
    if (req.query.id) {
        res.locals._id = new ObjectId(req.query.id);
    }

    next();
});

router.get('/:id', async (req: Request<{id: string}>, res: ImgResponse) => {
    repo.findById(req.params.id)
        .then(image => {
            if (!image) {
                res.status(404).json({ message: 'not found' });
                return;
            }

            res.json(image);
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({});
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

const patchValidator = imgSchema.partial()
    .omit({ dataset: true })
    .extend({
        id: z.string().length(24),
        dataset: z.string().length(24).transform(value => new ObjectId(value))
            .optional()
    });
type PatchReq = Request<never, never, z.infer<typeof patchValidator>>;
type PatchRes = Response<{success: boolean, message: string, error?: ZodError}>

router.patch('/edit', (req: PatchReq, res: PatchRes) => {
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
        name => new ImageModel(
            name,
            ImageModel.getStoragePath(env.IMG_STORAGE, pJoin(idDataset, name)),
            [],
            new ObjectId(idDataset))
    );

    repo.insertMany(models).then(data => {
        const meta = repo.getPaginator().buildMetaData(1, 100);
        res.status(201).json({ data: data.inserted, pagination: meta });
    });
});

const getRootPath = (path: string):string => {
    const { pathname } = new URL(path, 'file://');
    return pathname.split('/').at(1) || '';
};

const rootPath = getRootPath(env.IMG_STORAGE) + osPath.sep;
router.delete('/delete', async (req: DelRequest, res: DelResponse) => {
    const imgId = req.body.id;
    await repo.deleteById(imgId)
        .then(success => {
            if (!success) {
                res.statusCode = 404;
                res.json({ success: false, message: 'error' });
                res.end();

                return;
            }
            res.statusCode = 200;
            res.json({ success: true, message: 'ok' });
        })
        .catch(error => {
            console.log(error);
            res.statusCode = 500;
            res.json({ success: false, message: 'error' });
            res.end();
        });

    const imagePath = req.body.path;
    await unlink(rootPath + imagePath).catch(error => {
        console.info('Server: ');
        console.error(error);
    });
});

export default router;
