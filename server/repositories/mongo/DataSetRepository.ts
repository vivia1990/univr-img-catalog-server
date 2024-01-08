import Mongo from '../../db/drivers/Mongo.js';
import MongoRepository from './MongoRepository.js';
import MongoFactory from '../factory/mongo/MongoFactory.js';

import { InferIdType } from 'mongodb';
import { BaseRepository, PropertiesOnly } from '../factory/ModelRepository.js';
import DataSet from '../../models/DataSet.js';

export class DataSetRepository extends MongoRepository<PropertiesOnly<DataSet>> {
    constructor (mongoDatabase: Mongo) {
        super(mongoDatabase, DataSet.tableName);
    }
}

export default class DataSetFactory extends MongoFactory<PropertiesOnly<DataSet>> {
    constructor (client: Mongo) {
        super(client, DataSet.tableName);
    }

    createModelRepo (): BaseRepository<PropertiesOnly<DataSet>, '_id', InferIdType<DataSet>> {
        return new DataSetRepository(this.client);
    }
}
