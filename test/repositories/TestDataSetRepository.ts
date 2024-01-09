/* eslint-disable padded-blocks */
import { test, it } from 'node:test';
import assert from 'node:assert';
import UserFactory from '../../server/repositories/factory/mongo/UserFactory.js';
import MongoConnection from '../../server/db/MongoConnection.js';
import DataSetFactory, { DataSetRepository } from '../../server/repositories/mongo/DataSetRepository.js';
import { createRandomUser } from '../models/fake/User.js';
import { env } from '../../server/env.js';
import DataSet from '../../server/models/DataSet.js';

MongoConnection.setConnectionParams({
    name: env.DB_NAME,
    address: env.DB_ADDRESS,
    passw: env.DB_PASSW,
    port: env.DB_PORT,
    user: env.DB_USER
});
const repo = new DataSetFactory(await MongoConnection.getConnection())
    .createModelRepo() as DataSetRepository;

const userRepo = new UserFactory(await MongoConnection.getConnection())
    .createModelRepo();

async function cleanDataSetCollection () {
    const connection = await MongoConnection.getConnection();
    await connection.db.dropCollection(DataSet.tableName).catch(error => { throw error; });
}

test('DataSetRepository', async () => {
    await cleanDataSetCollection();
    await it('Insert one', async t => {
        const user = await userRepo.insert(createRandomUser());

        const ds = new DataSet('dataset-1', user._id, { count: 20, validated: 0 });
        await t.test('User datasets', async () => {
            const dsData = await repo.insert(ds)
                .then(data => {
                    assert.deepEqual(ds.owner, data.owner);
                    return data;
                }).catch(error => { throw error; });

            await userRepo.updateById(
                user._id.toString(), { datasets: [dsData._id.toString()] });

            await userRepo.find({ _id: user._id }).then(data => {
                console.log(Object.getPrototypeOf(data?._id));
                if (data) {
                    assert.deepEqual(data.datasets, [dsData._id.toString()]);
                } else {
                    assert.fail(new Error('Utente non trovato'));
                }

                return data;
            });
        });

    }).catch(error => {
        console.error(error);
        Promise.reject(error);
    });

}).finally(async () => await MongoConnection.closeConnection());
