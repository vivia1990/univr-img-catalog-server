/* eslint-disable padded-blocks */
import { test, it } from 'node:test';
import assert from 'node:assert';
import { User } from '../../server/models/User.js';
import Connection from '../../server/db/Mongo.js';
import UserFactory from '../../server/repositories/factory/mongo/UserFactory.js';
import { createRandomUser } from '../models/fake/User.js';
import UserRepository from 'app/repositories/mongo/UserRepository.js';

const connection = await Promise.race([
    new Connection('mongodb://root:root@192.168.1.253:27017/', 'test')
        .connect(),
    new Promise<Connection>((resolve, reject) => setTimeout(() => reject(new Error('connection timeout')), 10000))
]).catch(error => { throw error; });

const repo = new UserFactory(connection)
    .createModelRepo() as UserRepository;

async function cleanUserCollection () {
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

}).finally(() => connection.getConnection().close());
