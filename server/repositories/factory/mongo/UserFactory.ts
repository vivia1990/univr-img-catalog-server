import Mongo from '../../../db/Mongo.js';
import MongoFactory from './MongoFactory.js';
import UserRepository from '../../mongo/UserRepository.js';
import { User } from '../../../models/User.js';
import { InferIdType } from 'mongodb';
import { BaseRepository } from '../ModelRepository.js';

export default class UserFactory extends MongoFactory<User> {
    constructor (client: Mongo) {
        super(client, User.tableName);
    }

    createModelRepo (): BaseRepository<User, '_id', InferIdType<User>> {
        return new UserRepository(this.client);
    }
}
