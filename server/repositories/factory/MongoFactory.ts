import { Document } from 'mongodb';
import ModelRepository, { Model } from './ModelRepository.js';
import MongoRepository from '../MongoRepository.js';
import Mongo from '../../db/Mongo.js';

export default class MongoFactory extends ModelRepository<'_id'> {
    private client: Mongo;
    constructor (client: Mongo) {
        super();
        this.client = client;
    }

    createModelRepo<T extends Document> (model: Model): MongoRepository<T> {
        return new MongoRepository<T>(this.client, model.getTableName());
    }
}
