/* eslint-disable padded-blocks */
import { test, it } from 'node:test';
import assert from 'node:assert';
import { env } from '../../server/env.js';
import User from '../../server/models/User.js';
import MongoConnection from '../../server/db/MongoConnection.js';
import RestPaginator from '../../server/repositories/mongo/RestPaginator.js';
import { RestPaginationMetaData } from '../../server/repositories/interfaces/Paginator.js';
import MongoFactory from '../../server/repositories/factory/mongo/MongoFactory.js';
import { createMultipleRandomUser, createRandomUser } from '../models/fake/User.js';
import { MongoServerError } from 'mongodb';

const user = new User('Mich', 'donvivia@gmail.com', 'aaa');

MongoConnection.setConnectionParams({
    name: 'test_mongo',
    address: env.DB_ADDRESS,
    passw: env.DB_PASSW,
    port: env.DB_PORT,
    user: env.DB_USER
});
const factory = new MongoFactory(await MongoConnection.getConnection());
const repo = factory.createUserRepo();

async function cleanUserCollection () {
    const connection = await MongoConnection.getConnection();
    await connection.db.dropCollection(User.tableName).catch(error => { throw error; });
    await connection.db.collection<User>(User.tableName).createIndex({ email: 1 }, { unique: true });
}

test('MongoRepository', async () => {
    await cleanUserCollection();
    await it('Insert one', async t => {

        await t.test('Insert one user', () => repo.insert(user).then(data => {
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

    await cleanUserCollection();
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

        const arr = [new User('aaa', users[0]?.email || '', 'bbb'), user];
        await t.test('Insert users same email', () => repo.insertMany(arr)
            .then(data => {
                assert.strictEqual(data.inserted.length, 0);
                assert.strictEqual(data.failed.length, arr.length);
                assert.deepEqual(arr, data.failed);
            })
            .catch(error => {
                assert.equal(error instanceof MongoServerError, true);
                assert.notEqual((error as MongoServerError).code, 11000);
                assert.fail(error);
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
                assert.fail(error);
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
                assert.fail(error);
            }));

    });

    await cleanUserCollection();
    await it('Delete one', async t => {
        await t.test('Delete existing record', async () => {
            const data = await repo.insert(user);
            assert.equal(await repo.deleteById(data._id.toString()), true);
        });

        await t.test('Delete existing records', async () => {
            const length = 50;
            const users = createMultipleRandomUser(length);
            await repo.insertMany(users);
            const result = await repo.deleteMany({ _id: { $exists: true } });
            assert.equal(result, length);
        });

    });

    await cleanUserCollection();
    await it('Find paginated', async t => {
        const length = 378;
        await t.test('Inserting users', async () => {
            const users = createMultipleRandomUser(length);
            await repo.insertMany(users).then(data => assert.equal(data.inserted.length, length));
        });

        await t.test('Pagination metadata', async () => {

            let count = 0;
            const pageSize = repo.getPaginator().getPageSize();
            const pageCount = Math.floor(length / pageSize) || 1;
            while (count++ < 5) {
                const results = await repo.findAllPaginated({}, count);

                const pagination = results.pagination;
                assert.equal(pagination.totalItems, length);
                assert.equal(pagination.currentPage, count);
                assert.equal(pagination.totalPages, pageCount);
            }

        }).catch(e => { throw e; });

        await t.test('RestPagination metadata', async () => {

            let count = 0;
            const baseUrl = '/user';
            repo.setPaginator(new RestPaginator('/user'));
            const pageSize = repo.getPaginator().getPageSize();
            const pageCount = Math.floor(length / pageSize) || 1;
            while (count++ < 5) {
                const results = await repo.findAllPaginated({}, count);

                const pagination = results.pagination as RestPaginationMetaData;
                assert.equal(pagination.totalItems, length);
                assert.equal(pagination.currentPage, count);
                assert.equal(pagination.totalPages, pageCount);
                assert.deepEqual(pagination.links, {
                    first: `${baseUrl}?page=${1}`,
                    prev: count > 1 ? `${baseUrl}?page=${count - 1}` : '',
                    next: count < pageCount ? `${baseUrl}?page=${count + 1}` : '',
                    last: `${baseUrl}?page=${pageCount}`
                });
            }

        }).catch(e => { throw e; });

    });

}).finally(async () => {
    await (await MongoConnection.getConnection()).db.dropDatabase();
    await MongoConnection.closeConnection();
});
