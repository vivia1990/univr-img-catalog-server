import { ObjectId } from 'mongodb';
import Mongo from '../../db/drivers/Mongo.js';
import { User } from '../../models/User.js';
import { ModelWithId } from '../interfaces/BaseRepository.js';
import MongoRepository from './MongoRepository.js';
import DataSet from '../../models/DataSet.js';
import { IDataSetRepository } from '../interfaces/DataSetRepository.js';

export default class DataSetRepository extends MongoRepository<DataSet> implements IDataSetRepository<'_id', ObjectId> {
    constructor (mongoDatabase: Mongo) {
        super(mongoDatabase, DataSet.tableName);
    }

    users (): Promise<ModelWithId<Partial<User>, '_id', ObjectId>[]> {
        throw new Error('Method not implemented.');
    }
}
