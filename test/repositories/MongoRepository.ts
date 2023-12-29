import { describe, it } from 'node:test';
import assert from 'node:assert';
import { User } from '../../server/models/User.js';
import Connection from '../../server/db/Mongo.js';
import { MongoRepository } from '../../server/repositories/MongoRepository.js';

const user = new User('Mich', 'donvivia@gmail.com', 'aaa');
const connection = await new Connection('mongodb://root:root@192.168.1.253:27017/', 'test')
    .connect()
    .catch(error => { throw error; });
const repo = new MongoRepository<User>(connection, 'user');

describe('MongoRepository', async () => {
    await it('Test insert', () => {
        repo.create(user).then(data => {
            console.log(data);
            assert.notEqual(data._id, undefined);
            connection.getConnection().close();
        });
    });
});
