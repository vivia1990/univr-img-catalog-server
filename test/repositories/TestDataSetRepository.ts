/* eslint-disable padded-blocks */
import { test, it } from 'node:test';
import assert from 'node:assert';
import MongoFactory from '../../server/repositories/factory/mongo/MongoFactory.js';
import MongoConnection from '../../server/db/MongoConnection.js';
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
const factory = new MongoFactory(await MongoConnection.getConnection());
const dsRepo = factory.createDataSetRepo();

const userRepo = factory.createUserRepo();

async function cleanDataSetCollection () {
    const connection = await MongoConnection.getConnection();
    await connection.db.dropCollection(DataSet.tableName).catch(error => { throw error; });
}

test('DataSetRepository', async () => {
    await cleanDataSetCollection();
    await it('Insert one', async t => {
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

    }).catch(error => {
        console.error(error);
        Promise.reject(error);
    });

}).finally(async () => await MongoConnection.closeConnection());
