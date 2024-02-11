/* eslint-disable padded-blocks */

import { test, it } from 'node:test';
import { json } from 'express';
import ExpressBuilder from '../../../server/ExpressBuilder.js';
import cors from 'cors';
import { env } from '../../../server/env.js';
import assert from 'node:assert';
import MongoFactory from '../../../server/repositories/factory/mongo/MongoFactory.js';
import MongoConnection from '../../../server/db/MongoConnection.js';
import { ObjectId } from 'mongodb';
import { createRandomDataSet } from '../../models/fake/DataSet.js';
import { DataSetCollection } from '../../../server/db/init/Constraints.js';
import { ZodError } from 'zod';

type PatchResponse = {
    success: boolean;
    message: string;
    error?: ZodError;
};

MongoConnection.setConnectionParams({
    name: 'test_ds_route',
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
    .addRouter('/dataset', (await import('../../../server/http/routes/DataSet.js')).default)
    .addStaticPath('', path)
    .build();

const server = app.listen(env.PORT, () => console.info(`server started on ${env.PORT} \n\n`));

await DataSetCollection(await MongoConnection.getConnection());
const dsRepo = new MongoFactory(await MongoConnection.getConnection())
    .createDataSetRepo();

const baseUrl = `http://localhost:${env.PORT}`;
test('DataSet Route', async () => {
    await it('Update: PATCH', async t => {

        await t.test('Single Dataset', async () => {
            const ds = createRandomDataSet();
            const { _id } = await dsRepo.insert(ds);

            const sId = new ObjectId();
            ds.owners.push(sId);

            const response = await fetch(new URL('/dataset/edit', baseUrl), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify({ ...{ id: _id }, ...ds })
            });
            assert.equal(response.ok, true);
            assert.equal(response.status, 200);
        });

        await t.test('Request without id', async () => {
            const ds = createRandomDataSet();
            await dsRepo.insert(ds);

            const sId = new ObjectId();
            ds.owners.push(sId);

            const response = await fetch(new URL('/dataset/edit', baseUrl), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify(ds)
            });
            assert.equal(response.ok, false);
            assert.equal(response.status, 400);

            const data = await response.json() as PatchResponse;
            assert.equal(data.message, 'errore validazione');
            assert.equal(data.success, false);
            assert.equal(data.error?.issues.length, 1);

        });

        await t.test('Not Found', async () => {
            const ds = createRandomDataSet();

            const sId = new ObjectId();
            ds.owners.push(sId);

            const response = await fetch(new URL('/dataset/edit', baseUrl), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify({ ...{ id: new ObjectId(), image: [] }, ...ds })
            });
            assert.equal(response.ok, false);
            assert.equal(response.status, 404);
        });

        await t.test('Discard other fields', async () => {
            const ds = createRandomDataSet();
            const { _id } = await dsRepo.insert(ds);

            const sId = new ObjectId();
            ds.owners.push(sId);
            ds.owners.push(sId);

            const response = await fetch(new URL('/dataset/edit', baseUrl), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify({ ...{ id: _id, images: ds.owners, examplee: 4212421 }, ...ds })
            });
            assert.equal(response.ok, true);
            assert.equal(response.status, 200);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const newDs = await dsRepo.findById(_id.toString()) as any;
            assert.equal(newDs.images, undefined);
            assert.equal(newDs.examplee, undefined);
            assert.deepEqual(ds.owners, newDs.owners);

        });

        await t.test('Owners ObjectId[]', async () => {
            const ds = createRandomDataSet();
            const { _id } = await dsRepo.insert(ds);

            const sId = new ObjectId();
            ds.owners.push(sId);
            ds.owners.push(sId);

            const response = await fetch(new URL('/dataset/edit', baseUrl), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify({ ...{ id: _id }, ...ds })
            });
            assert.equal(response.ok, true);
            assert.equal(response.status, 200);

            const newDs = await dsRepo.findById(_id.toString());
            if (newDs) {
                assert.deepEqual(ds.owners, newDs.owners);
            } else {
                assert.fail('unreachable');
            }

        });

    });
}).finally(async () => {
    await MongoConnection.closeConnection();
    server.close();
});
