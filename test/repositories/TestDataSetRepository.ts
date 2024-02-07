/* eslint-disable padded-blocks */
import { test, it } from 'node:test';
import assert from 'node:assert';
import { DataSetCollection } from '../../server/db/init/Constraints.js';
import MongoFactory from '../../server/repositories/factory/mongo/MongoFactory.js';
import MongoConnection from '../../server/db/MongoConnection.js';
import { createRandomUser } from '../models/fake/User.js';
import { env } from '../../server/env.js';
import DataSet from '../../server/models/DataSet.js';
import { MongoServerError, ObjectId } from 'mongodb';
import Image from '../../server/models/Image.js';
import { createRandomImage } from '../models/fake/Image.js';

type PrUserType = PromiseFulfilledResult<GetReturnType<typeof createRandomUser> & {_id: ObjectId}>;

MongoConnection.setConnectionParams({
    name: 'test_ds',
    address: env.DB_ADDRESS,
    passw: env.DB_PASSW,
    port: env.DB_PORT,
    user: env.DB_USER
});
const factory = new MongoFactory(await MongoConnection.getConnection());
const dsRepo = factory.createDataSetRepo();
const imRepo = factory.createImageRepo();
const userRepo = factory.createUserRepo();

async function cleanDataSetCollection () {
    const connection = await MongoConnection.getConnection();
    await connection.db.dropCollection(DataSet.tableName).catch(error => { throw error; });
    await DataSetCollection(connection);
}

async function cleanImgCollection () {
    const connection = await MongoConnection.getConnection();
    await connection.db.dropCollection(Image.tableName).catch(error => { throw error; });
}

test('DataSetRepository', async () => {
    await cleanDataSetCollection();
    await it('Insert one', async t => {
        const user = await userRepo.insert(createRandomUser());
        assert.notEqual(user._id, undefined);

        const ds = new DataSet('dataset-1', { count: 20, validated: 0 }, [user._id]);
        await t.test('User datasets', async () => {
            const dsData = await dsRepo.insert(ds)
                .then(data => {
                    assert.deepEqual(ds.owners, data.owners);
                    return data;
                }).catch(error => { throw error; });

            await userRepo.updateById(
                user._id.toString(), { datasets: [dsData._id] })
                .catch(() => console.log('Errore strano'));

            await userRepo.find({ _id: user._id }).then(data => {
                if (data) {
                    assert.deepEqual(data.datasets, [dsData._id]);
                } else {
                    assert.fail(new Error('Utente non trovato'));
                }

                return data;
            });
        });

        await t.test('Select users fields', async () => {

            const ds = await dsRepo.find({}, ['tags']);
            if (ds) {
                assert.notEqual(ds._id, undefined);
                // beat ts
                const test = JSON.parse(JSON.stringify(ds)) as DataSet;
                assert.equal(test?.name, undefined);
                assert.equal(test?.owners, undefined);
            }
        });

        await t.test('Get Dataset Users', async () => {
            await cleanDataSetCollection();
            const dsRepoRel = factory.createDataSetRepo(true);
            const ds = new DataSet('dataset-1', { count: 20, validated: 0 }, []);
            const dsData = await dsRepoRel.insert(ds)
                .catch(error => { throw error; });

            const users = await Promise.allSettled([
                userRepo.insert(createRandomUser(1, { datasets: [dsData._id] })),
                userRepo.insert(createRandomUser(1, { datasets: [dsData._id] })),
                userRepo.insert(createRandomUser(1, { datasets: [dsData._id] }))
            ]).catch(e => { throw e; });

            const ids = users.filter((result)
                : result is PrUserType => result.status === 'fulfilled')
                .map(user => user.value._id);

            await dsRepoRel.updateById(dsData._id.toString(), { owners: ids });

            await dsRepoRel.users(dsData._id).then(result => {
                const idsResult = result.data.map(user => user._id);
                assert.deepEqual(idsResult, ids);
            });

        });

    }).catch(error => {
        console.error(error);
        Promise.reject(error);
    });

    await cleanDataSetCollection();
    await it('Insert Constraint', async () => {
        const user = await userRepo.insert(createRandomUser());
        assert.notEqual(user._id, undefined);

        const ds = new DataSet('dataset-1', { count: 20, validated: 0 }, [user._id]);
        await dsRepo.insert(ds)
            .then(data => {
                assert.deepEqual(ds.owners, data.owners);
                return data;
            }).catch(error => { throw error; });

        await dsRepo.insert(ds)
            .then(() => assert.throws(() => false))
            .catch(error => {
                assert.equal(error instanceof MongoServerError, true);
                assert.equal((error as MongoServerError).code, 11000);
            });

    });

    await cleanDataSetCollection();
    await cleanImgCollection();

    async function insertImages (amount: number): Promise<ObjectId> {
        const user = await userRepo.insert(createRandomUser());

        const ds = new DataSet('dataset-1', { count: 0, validated: 0 }, [user._id]);
        const { _id: id } = await dsRepo.insert(ds);

        let count = 0;
        const chunkSize = 100;
        const chunks = Array<Promise<unknown>>(chunkSize);
        while (count < Math.floor(amount / chunkSize)) {
            const images = Array.from({ length: chunkSize }, () => {
                const img = createRandomImage();
                img.dataset = id;
                return img;
            });
            chunks[count++] = imRepo.insertMany(images);
        }
        await Promise.all(chunks).catch(error => { throw error; });

        ds.stats.count = amount;
        await dsRepo.updateById(id.toString(), ds);

        return id;
    }

    await it('Fetch with images', async t => {

        const ids = await Promise.all([
            insertImages(1000),
            insertImages(1000),
            insertImages(1000)
        ]).catch(error => { throw error; });

        await t.test('Fetch single dataset', async () => {
            const data = await dsRepo.findOneWithImages(ids[0]);
            assert.equal(data?.images.data.length, 1000);
        });

        await t.test('Fetch all dataset', async () => {
            const data = await dsRepo.findAllWithImages();
            assert.equal(data.data.length, 3);
            data.data.forEach(ds => assert.equal(ds.images.data.length, 1000));
        });

    });

}).finally(async () => {
    await (await MongoConnection.getConnection()).db.dropDatabase();
    await MongoConnection.closeConnection();
});
