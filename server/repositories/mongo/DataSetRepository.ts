import { ObjectId } from 'mongodb';
import Mongo from '../../db/drivers/Mongo.js';
import User from '../../models/User.js';
import { ModelWithId, QueryFilter } from '../interfaces/BaseRepository.js';
import MongoRepository from './MongoRepository.js';
import DataSet from '../../models/DataSet.js';
import { IDataSetRepository } from '../interfaces/DataSetRepository.js';
import MongoFactory from '../factory/mongo/MongoFactory.js';

export default class DataSetRepository extends MongoRepository<DataSet> implements IDataSetRepository<'_id', ObjectId> {
    constructor (mongoDatabase: Mongo) {
        super(mongoDatabase, DataSet.tableName);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    users (factory: MongoFactory, idDataset: ObjectId, query: Partial<QueryFilter<User>> = {}): Promise<ModelWithId<Partial<User>, '_id', ObjectId>[]> {
        throw new Error('TODO');
        /* const filter: Filter<User> = { datasets: { $in: [new ObjectId(idDataset)] } };
        factory.createDataSetRepo().find(query.filter); */
    }
}
