import { ObjectId } from 'mongodb';
import Mongo from '../../db/drivers/Mongo.js';
import User from '../../models/User.js';
import { ModelWithId } from '../interfaces/BaseRepository.js';
import { IUserRepository } from '../interfaces/UserRepository.js';
import MongoRepository from './MongoRepository.js';
import DataSet from '../../models/DataSet.js';

export default class UserRepository extends MongoRepository<User> implements IUserRepository<'_id', ObjectId> {
    constructor (mongoDatabase: Mongo) {
        super(mongoDatabase, User.tableName);
    }

    datasets (): Promise<ModelWithId<DataSet, '_id', ObjectId>[]> {
        throw new Error('Method not implemented.');
    }
}
