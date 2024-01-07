/* eslint-disable padded-blocks */
import { test, it } from 'node:test';
import assert from 'node:assert';
import { User } from '../../server/models/User.js';
import MongoConnection from '../../server/db/MongoConnection.js';
import UserFactory from '../../server/repositories/factory/mongo/UserFactory.js';
import { createRandomUser } from '../models/fake/User.js';
import { env } from '../../server/env.js';
import UserRepository from 'app/repositories/mongo/UserRepository.js';

MongoConnection.setConnectionParams({
    name: env.DB_NAME,
    address: env.DB_ADDRESS,
    passw: env.DB_PASSW,
    port: env.DB_PORT,
    user: env.DB_USER
});
const repo = new UserFactory(await MongoConnection.getConnection())
    .createModelRepo() as UserRepository;

async function cleanUserCollection () {
    const connection = await MongoConnection.getConnection();
    await connection.db.dropCollection(User.tableName).catch(error => { throw error; });
    await connection.db.collection<User>(User.tableName).createIndex({ email: 1 }, { unique: true });
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

}).finally(async () => await MongoConnection.closeConnection());
