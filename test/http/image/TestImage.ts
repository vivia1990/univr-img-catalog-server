/* eslint-disable padded-blocks */

import { test, it } from 'node:test';
import { json } from 'express';
import ExpressBuilder from '../../../server/ExpressBuilder.js';
import cors from 'cors';
import { env } from '../../../server/env.js';
import assert from 'node:assert';
import MongoFactory from '../../../server/repositories/factory/mongo/MongoFactory.js';
import { RestPaginationMetaData } from '../../../server/repositories/interfaces/Paginator.js';
import MongoConnection from '../../../server/db/MongoConnection.js';
import { createRandomImage } from '../../models/fake/Image.js';
import { ObjectId } from 'mongodb';
import { randomBytes } from 'node:crypto';
import { ImageRecord } from '../../../server/repositories/mongo/ImageRepository.js';
import { loadImages } from '../../db/seed/DatasetAndImages.js';
import osPath from 'path';

type ImageResponse = Omit<ImageRecord, 'dataset'> & {_id: string, dataset: string};
type GetResponse = Promise<{data: (ImageResponse)[], pagination: RestPaginationMetaData}>;
type UploadResponse = Promise<{data: (ImageResponse)[], pagination: RestPaginationMetaData}>;

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
    .createImageRepo(false);

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
                img.rects.forEach((rect, index) => {
                    assert.deepEqual(rect.tags, record.rects[index]?.tags);
                });
                assert.equal(img.path, record.path);
                assert.equal(img.name, record.name);
            }
        });
    });

    await it('POST Request', async t => {
        await t.test('Update image Tags', async () => {
            const img = createRandomImage(0);
            const { _id } = await imgRepo.insert(img);

            const rects: ImageRecord['rects'] = [
                { _id: new ObjectId(randomBytes(12)), endX: 1, endY: 2, startX: 3, startY: 4, tags: [{ name: 'aaa-bbb' }, { name: 'aaa-ccc' }] },
                { _id: new ObjectId(randomBytes(12)), endX: 1, endY: 2, startX: 3, startY: 4, tags: [{ name: 'aaa-bbb' }] },
                { endX: 1, endY: 2, startX: 3, startY: 4, tags: [{ name: 'aaa-bbb' }, { name: 'aaa-eee' }] }
            ];

            await imgRepo.updateById(_id.toString(), { rects });

            const url = new URL('/image', baseUrl);
            url.searchParams.set('name', img.name);
            const { data } = await fetch(url).then(response => response.json() as Promise<GetResponse>);

            assert.equal(data.length, 1);
            data.at(0)?.rects.slice(0, 2).forEach((rect, index) => {
                assert.deepEqual(rect, { ...rects[index], ...{ _id: rects[index]?._id?.toString() } });
            });
            assert.notEqual(data.at(0)?.rects.at(2)?._id, undefined);

        });
    });

    await it('Delete Request', async t => {
        await t.test('Delete single image', async () => {
            const path = new URL('data', import.meta.url);
            const [imgFile] = await loadImages(path.pathname);

            const idDs = new ObjectId().toString();
            const form = new FormData();
            form.append('images', imgFile);
            form.append('idDataset', idDs);
            form.append('total', 1);

            const { data } = await fetch(new URL('/image/upload', baseUrl), {
                method: 'POST',
                body: form
            }).then(response => response.json() as UploadResponse);

            assert.equal(data.length, 1);
            const { _id, path: imPath, dataset } = data.at(0) as ImageResponse;
            const response = await fetch(new URL('/image/delete', baseUrl), {
                method: 'DELETE',
                body: JSON.stringify({ id: _id, path: imPath }),
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            }).then(res => res.json() as Promise<{ success: boolean, message: string }>);

            assert.equal(response.success, true);
            assert.equal(response.message, 'ok');

            await new Promise(resolve => {
                setTimeout(async () => {
                    const img = await loadImages(env.IMG_STORAGE + osPath.sep + dataset);
                    assert.equal(img.length, 0);
                    resolve('');
                }, 200);
            });

        });

        await t.test('Delete one image', async () => {
            const path = new URL('data', import.meta.url);
            const imgS = await loadImages(path.pathname);

            const idDs = new ObjectId().toString();
            const form = new FormData();
            imgS.forEach(image => form.append('images', image));
            form.append('idDataset', idDs);
            form.append('total', imgS.length);

            const { data } = await fetch(new URL('/image/upload', baseUrl), {
                method: 'POST',
                body: form
            }).then(response => response.json() as UploadResponse);

            assert.equal(data.length, imgS.length);

            const index = Math.floor((Math.random() * 100)) % data.length;

            const { _id, path: imPath, dataset, name } = data.at(index) as ImageResponse;
            const response = await fetch(new URL('/image/delete', baseUrl), {
                method: 'DELETE',
                body: JSON.stringify({ id: _id, path: imPath }),
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            }).then(res => res.json() as Promise<{ success: boolean, message: string }>);

            assert.equal(response.success, true);
            assert.equal(response.message, 'ok');

            await new Promise(resolve => {
                setTimeout(async () => {
                    const img = await loadImages(env.IMG_STORAGE + osPath.sep + dataset);
                    assert.equal(img.length, imgS.length - 1);
                    assert.equal(img.find(img => img.name === name), undefined);
                    resolve('');
                }, 200);
            });

        });
    });

}).finally(async () => {
    await MongoConnection.closeConnection();
    server.close();
});
