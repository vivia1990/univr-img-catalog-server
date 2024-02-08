/* eslint-disable padded-blocks */

import { test, it } from 'node:test';
import { json } from 'express';
import ExpressBuilder from '../../../server/ExpressBuilder.js';
import cors from 'cors';
import { env } from '../../../server/env.js';
import assert from 'node:assert';
import Image from '../../../server/models/Image.js';
import MongoFactory from '../../../server/repositories/factory/mongo/MongoFactory.js';
import { RestPaginationMetaData } from '../../../server/repositories/interfaces/Paginator.js';
import MongoConnection from '../../../server/db/MongoConnection.js';
import { createRandomImage } from '../../models/fake/Image.js';

type ImageRecord = PropertiesOnly<Image> & {_id: string};
type GetResponse = Promise<{data: ImageRecord[], pagination: RestPaginationMetaData}>;

MongoConnection.setConnectionParams({
    name: 'test_image_route',
    address: env.DB_ADDRESS,
    passw: env.DB_PASSW,
    port: env.DB_PORT,
    user: env.DB_USER
});

const path = new URL('public', `file://${process.cwd()}/`).pathname;

const app = new ExpressBuilder()
    .addMiddleware(json())
    .addMiddleware(cors())
    .addErrorMiddleware((error: Error, req, res, next) => {
        assert.notEqual(error, undefined);
        if (error instanceof Error) {
            res.json({ message: error.message });
        } else {
            res.json(JSON.stringify(error));
        }

        // shuldnt
        next(error);
    })
    .addRouter('/image', (await import('../../../server/http/routes/Images.js')).default)
    .addStaticPath('', path)
    .build();

const server = app.listen(env.PORT, () => console.info(`server started on ${env.PORT} \n\n`));

const imgRepo = new MongoFactory(await MongoConnection.getConnection())
    .createImageRepo();

const baseUrl = `http://localhost:${env.PORT}`;
test('ImageRoute', async () => {
    await it('GET Request', async t => {

        /* await t.test('Image by id', async () => {
            const img = createRandomImage();
            const { _id } = await imgRepo.insert(img);

            const response = await fetch(new URL(`/image/${_id.toString()}`, baseUrl))
                .then(response => response.json() as Promise<ImageRecord>);

            assert.equal(img.dataset.toString(), response._id);
            assert.deepEqual(img.tags, response.tags);
            assert.equal(img.path, response.path);
            assert.equal(img.name, response.name);

        }); */

        await t.test('Images', async () => {
            const img = createRandomImage();
            const { _id } = await imgRepo.insert(img);

            const response = await fetch(new URL('/image', baseUrl))
                .then(response => response.json() as Promise<GetResponse>);

            assert.equal(response.data.length > 0, true);
            const record = response.data.find(obj => obj._id === _id.toString());
            assert.notEqual(record, undefined);
            if (record) {
                assert.deepEqual(img.tags, record.tags);
                assert.equal(img.path, record.path);
                assert.equal(img.name, record.name);
            }
        });
    });

    await it('POST Request', async t => {
        await t.test('Update image Tags', async () => {
            const img = createRandomImage(0);
            const { _id } = await imgRepo.insert(img);

            const tags = [
                { name: 'aaa-bbb', description: 'gfagahfdahahaha' },
                { name: 'aaa-ccc', description: 'gfagahfdahahaha' },
                { name: 'aaa-ddd', description: 'gfagahfdahahaha' }
            ];
            await imgRepo.updateById(_id.toString(), { tags });

            const url = new URL('/image', baseUrl);
            url.searchParams.set('name', img.name);
            const { data } = await fetch(url).then(response => response.json() as Promise<GetResponse>);

            assert.equal(data.length, 1);
            data.at(0)?.tags.forEach((tag, index) => {
                assert.deepEqual(tag, tags[index]);
            });

        });
    });
}).finally(async () => {
    await MongoConnection.closeConnection();
    server.close();
});
