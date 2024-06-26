/* eslint-disable padded-blocks */
import { test, it } from 'node:test';
import assert from 'node:assert';
import { UserCollection } from '../../server/db/init/Constraints.js';
import User from '../../server/models/User.js';
import MongoConnection from '../../server/db/MongoConnection.js';
import MongoFactory from '../../server/repositories/factory/mongo/MongoFactory.js';
import { createRandomUser } from '../models/fake/User.js';
import { env } from '../../server/env.js';

MongoConnection.setConnectionParams({
    name: 'test_user',
    address: env.DB_ADDRESS,
    passw: env.DB_PASSW,
    port: env.DB_PORT,
    user: env.DB_USER
});
const repo = new MongoFactory(await MongoConnection.getConnection())
    .createUserRepo();

async function cleanUserCollection () {
    const connection = await MongoConnection.getConnection();
    await connection.db.dropCollection(User.tableName).catch(error => { throw error; });
    await UserCollection(connection);
}

test('UserRepository', async () => {
    await cleanUserCollection();
    await it('Insert one', async t => {
        const user = createRandomUser();
        await t.test('User datasets', () => repo.insert(user)
            .then(data => {
                assert.equal(Array.isArray(data.datasets), true);
            }).catch(error => { throw error; }));

    }).catch(error => {
        console.error(error);
        Promise.reject(error);
    });

}).finally(async () => {
    await (await MongoConnection.getConnection()).db.dropDatabase();
    await MongoConnection.closeConnection();
});
