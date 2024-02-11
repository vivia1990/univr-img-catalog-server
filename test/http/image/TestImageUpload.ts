/* eslint-disable padded-blocks */

import { test, it } from 'node:test';
import { json } from 'express';
import ExpressBuilder from '../../../server/ExpressBuilder.js';
import cors from 'cors';
import { opendir, readFile } from 'fs/promises';
import osPath from 'node:path';
import { env } from '../../../server/env.js';
import assert from 'node:assert';
import { ObjectId } from 'mongodb';
import { randomBytes } from 'crypto';
import Image from '../../../server/models/Image.js';
import { RestPaginationMetaData } from '../../../server/repositories/interfaces/Paginator.js';
import MongoConnection from '../../../server/db/MongoConnection.js';

type ApiResponse = Promise<{data: PropertiesOnly<Image>[], pagination: RestPaginationMetaData}>;

MongoConnection.setConnectionParams({
    name: 'test_upload_image',
    address: env.DB_ADDRESS,
    passw: env.DB_PASSW,
    port: env.DB_PORT,
    user: env.DB_USER
});

const path = new URL('public', `file://${process.cwd()}/`).pathname;
const imgPath = new URL(env.IMG_STORAGE, 'file://' + path).pathname;

const server = new ExpressBuilder()
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
    .build()
    .listen(env.PORT, () => console.info('server started on' + env.PORT + ' \n\n'));

async function loadImages (directory: string) {
    const files = [];
    const dir = await opendir(directory);

    for await (const dirent of dir) {
        if (!dirent.isFile()) {
            continue;
        }

        const path = osPath.join(dirent.path, dirent.name);
        files.push(new Promise<File>(resolve => {
            readFile(path)
                .then(content => resolve(new File([new Blob([content])], dirent.name)));
        }));
    }

    return await Promise.all(files);
}

const { pathname } = new URL('data', import.meta.url);
const baseUrl = `http://localhost:${env.PORT}`;

test('Test Upload Image', async () => {

    const images = await loadImages(pathname);
    if (images.length === 0) {
        console.error('No immagini trovate in' + pathname);
        process.exit(1);
    }

    await it('Upload single image', async t => {

        await t.test('Simple image', async () => {
            const id = new ObjectId(randomBytes(12)).toString();
            const form = new FormData();
            form.append('images', images[0]);
            form.append('idDataset', id);
            form.append('total', images.length);

            const { data } = await fetch(new URL('/image/upload', baseUrl), {
                method: 'POST',
                body: form
            }).then(response => response.json() as ApiResponse);

            assert.equal(data.length, 1);
            assert.equal(data[0]?.name, images[0]?.name);
            const storageUrl = Image.getStoragePath(
                env.IMG_STORAGE, osPath.join(id, images[0]?.name || '')
            );
            assert.equal(data[0]?.path, storageUrl);

            const savedImg = await loadImages(osPath.join(imgPath, id));
            assert.equal(savedImg.length, 1);
            assert.notEqual(savedImg[0]?.name, undefined);
            assert.equal(savedImg[0]?.name, images[0]?.name);
            assert.equal(savedImg[0]?.size, images[0]?.size);
        });

        await t.test('Same image 2 times', async () => {
            const id = new ObjectId(randomBytes(12)).toString();
            const form = new FormData();
            form.append('images', images[0]);
            form.append('idDataset', id);
            form.append('total', images.length);

            async function uploadFile () {
                const response = await fetch(new URL('/image/upload', baseUrl), {
                    method: 'POST',
                    body: form
                }).then(response => response.json() as ApiResponse);

                assert.equal(response.data.length, 1);
                assert.equal(response.data[0]?.name, images[0]?.name);

                const savedImg = await loadImages(osPath.join(imgPath, id));
                assert.equal(savedImg.length, 1);
                assert.notEqual(savedImg[0]?.name, undefined);
                assert.equal(savedImg[0]?.name, images[0]?.name);
                assert.equal(savedImg[0]?.size, images[0]?.size);
            }

            await Promise.all([uploadFile(), uploadFile()]);

        });

    });

    await it('Upload multiple image', async t => {

        await t.test('Simple image', async () => {
            const id = new ObjectId(randomBytes(12)).toString();
            const form = new FormData();
            for (const image of images) {
                form.append('images', image);
                form.append('idDataset', id);
                form.append('total', images.length);
            }

            const response = await fetch(new URL('/image/upload', baseUrl), {
                method: 'POST',
                body: form
            }).then(response => response.json() as ApiResponse);

            assert.equal(response.data.length, images.length);

            const savedImg = await loadImages(osPath.join(imgPath, id));
            assert.equal(savedImg.length, images.length);

            const sorter = (a: File, b: File) => a.name.localeCompare(b.name);
            savedImg.sort(sorter);
            images.sort(sorter);

            for (let index = 0; index < images.length; index++) {
                const element = images[index];
                assert.notEqual(savedImg[index]?.name, undefined);
                assert.equal(savedImg[index]?.name, element?.name);
                assert.equal(savedImg[index]?.size, element?.size);
            }
        });
    });

}).finally(async () => {
    await MongoConnection.closeConnection();
    server.close();
});
