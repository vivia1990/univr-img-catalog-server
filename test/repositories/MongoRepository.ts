/* eslint-disable padded-blocks */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { User } from '../../server/models/User.js';
import Connection from '../../server/db/Mongo.js';
import MongoFactory from '../../server/repositories/factory/MongoFactory.js';
import { MongoServerError } from 'mongodb';

const user = new User('Mich', 'donvivia@gmail.com', 'aaa');
const connection = await Promise.race([
    new Connection('mongodb://root:root@192.168.1.253:27017/', 'test')
        .connect(),
    new Promise<Connection>((resolve, reject) => setTimeout(() => reject(new Error('connection timeout')), 10000))
]).catch(error => { throw error; });

const repo = new MongoFactory(connection).createModelRepo<User>(user);
await connection.db.dropCollection(user.getTableName()).catch(error => { throw error; });
await connection.db.collection<User>(user.getTableName()).createIndex({ email: 1 }, { unique: true });

describe('MongoRepository', async () => {
    await it('Insert one', async t => {

        await t.test('Insert one user', () => repo.create(user).then(data => {
            assert.equal(data.email, user.email);
            assert.equal(data.password, user.password);
            assert.equal(data.name, user.name);
            assert.notEqual(data._id, undefined);
        }).catch(error => { throw error; }));

        await t.test('Insert user same email', () => repo.create(user)
            .then(() => assert.throws(() => false))
            .catch(error => {
                assert.equal(error instanceof MongoServerError, true);
                assert.equal((error as MongoServerError).code, 11000);
            }));

    }).catch(error => {
        console.error(error);
        Promise.reject(error);
    });

}).finally(() => connection.getConnection().close());
