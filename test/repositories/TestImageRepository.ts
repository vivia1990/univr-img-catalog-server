/* eslint-disable padded-blocks */
import { test, it } from 'node:test';
import assert from 'node:assert';
import MongoFactory from '../../server/repositories/factory/mongo/MongoFactory.js';
import MongoConnection from '../../server/db/MongoConnection.js';
import { createRandomUser } from '../models/fake/User.js';
import { env } from '../../server/env.js';
import DataSet from '../../server/models/DataSet.js';
import User from '../../server/models/User.js';
import { createRandomImage } from '../models/fake/Image.js';
import Image from '../../server/models/Image.js';

MongoConnection.setConnectionParams({
    name: 'test_im',
    address: env.DB_ADDRESS,
    passw: env.DB_PASSW,
    port: env.DB_PORT,
    user: env.DB_USER
});
const factory = new MongoFactory(await MongoConnection.getConnection());
const imRepo = factory.createImageRepo();

const dsRepo = factory.createDataSetRepo();
const userRepo = factory.createUserRepo();

async function cleanDb () {
    const connection = await MongoConnection.getConnection();
    await connection.db.dropCollection(Image.tableName).catch(error => { throw error; });
    await connection.db.dropCollection(DataSet.tableName).catch(error => { throw error; });
    await connection.db.dropCollection(User.tableName).catch(error => { throw error; });
    await connection.db.collection<User>(User.tableName).createIndex({ email: 1 }, { unique: true });

}

test('ImageRepository', async () => {
    await cleanDb();
    await it('Insert user and dataset', async t => {
        const user = await userRepo.insert(createRandomUser());

        const ds = new DataSet('dataset-1', { count: 20, validated: 0 }, [user._id]);
        await t.test('User datasets', async () => {
            const dsData = await dsRepo.insert(ds)
                .then(data => {
                    assert.deepEqual(ds.owners, data.owners);
                    return data;
                }).catch(error => { throw error; });

            await userRepo.updateById(
                user._id.toString(), { datasets: [dsData._id] });

            await userRepo.find({ _id: user._id }).then(data => {
                if (data) {
                    assert.deepEqual(data.datasets, [dsData._id]);
                } else {
                    assert.fail(new Error('Utente non trovato'));
                }

                return data;
            });
        });

        await t.test('Insert 1000 images', async () => {
            const ds = await dsRepo.find({});
            if (!ds?._id) {
                assert.fail();
            }

            let count = 0;
            const chunks = Array<Promise<unknown>>(10);
            while (count < 10) {
                const images = Array(100);
                for (let index = 0; index < 100; index++) {
                    const img = createRandomImage();
                    img.dataset = ds._id;
                    images[index] = img;
                }
                chunks[count++] = imRepo.insertMany(images);
            }
            await Promise.all(chunks).catch(() => console.log('error'));
        });

    }).catch(error => {
        console.error(error);
        Promise.reject(error);
    });

}).finally(async () => {
    await (await MongoConnection.getConnection()).db.dropDatabase();
    await MongoConnection.closeConnection();
});
