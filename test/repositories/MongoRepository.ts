/* eslint-disable padded-blocks */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { User } from '../../server/models/User.js';
import Connection from '../../server/db/Mongo.js';
import MongoFactory from '../../server/repositories/factory/MongoFactory.js';
import { createMultipleRandomUser, createRandomUser } from '../models/fake/User.js';
import { MongoServerError } from 'mongodb';

const connection = await Promise.race([
    new Connection('mongodb://root:root@192.168.1.253:27017/', 'test')
        .connect(),
    new Promise<Connection>((resolve, reject) => setTimeout(() => reject(new Error('connection timeout')), 10000))
]).catch(error => { throw error; });

const user = new User('Mich', 'donvivia@gmail.com', 'aaa');

const repo = new MongoFactory(connection).createModelRepo<User>(user);

async function cleanUserCollection (user: User) {
    await connection.db.dropCollection(user.getTableName()).catch(error => { throw error; });
    await connection.db.collection<User>(user.getTableName()).createIndex({ email: 1 }, { unique: true });
}

describe('MongoRepository', async () => {
    await cleanUserCollection(user);
    await it('Insert one', async t => {

        await t.test('Insert one user', () => repo.insert(user).then(data => {
            console.log('insert');
            assert.equal(data.email, user.email);
            assert.equal(data.password, user.password);
            assert.equal(data.name, user.name);
            assert.notEqual(data._id, undefined);
        }).catch(error => { throw error; }));

        await t.test('Insert user same email', () => repo.insert(user)
            .then(() => assert.throws(() => false))
            .catch(error => {
                assert.equal(error instanceof MongoServerError, true);
                assert.equal((error as MongoServerError).code, 11000);
            }));

    }).catch(error => {
        console.error(error);
        Promise.reject(error);
    });

    await it('Insert Many', async t => {
        const length = 50;
        const users = createMultipleRandomUser(length);

        await t.test('Insert users', () => repo.insertMany(users)
            .then(data => {
                assert.equal(data.inserted.length, length);
                data.inserted.forEach((userDb, index) => {
                    const user = users[index];
                    if (user) {
                        assert.equal(userDb.email, user.email);
                        assert.equal(userDb.password, user.password);
                        assert.equal(userDb.name, user.name);
                        assert.notEqual(userDb._id, undefined);
                    }
                });
            }).catch(error => { throw error; }));

        const arr = [user, new User('aaa', users[0]?.email || '', 'bbb')];
        await t.test('Insert users same email', () => repo.insertMany(arr)
            .then(data => {
                assert.strictEqual(data.inserted.length, 0);
                assert.strictEqual(data.failed.length, arr.length);
                assert.deepEqual(arr, data.failed);
            })
            .catch(error => {
                assert.equal(error instanceof MongoServerError, true);
                assert.notEqual((error as MongoServerError).code, 11000);
            }));

        const arr2 = [...arr, createRandomUser()];
        await t.test('Insert users mixed', () => repo.insertMany(arr2)
            .then(data => {
                assert.equal(data.failed.length, arr2.length);
                assert.deepEqual(data.failed, arr2);
            })
            .catch(error => {
                assert.equal(error instanceof MongoServerError, true);
                assert.notEqual((error as MongoServerError).code, 11000);
            }));

        const arr3 = [createRandomUser(), ...arr];
        await t.test('Insert users mixed', () => repo.insertMany(arr3)
            .then(data => {
                assert.equal(data.inserted.length, 1);
                data.inserted.forEach((userDb, index) => {
                    const user = arr3[index];
                    if (user) {
                        assert.equal(userDb.email, user.email);
                        assert.equal(userDb.password, user.password);
                        assert.equal(userDb.name, user.name);
                        assert.notEqual(userDb._id, undefined);
                    }
                });
            })
            .catch(error => {
                assert.equal(error instanceof MongoServerError, true);
                assert.notEqual((error as MongoServerError).code, 11000);
            }));

    }).catch(error => {
        console.error(error);
        Promise.reject(error);
    });

}).finally(() => connection.getConnection().close());
