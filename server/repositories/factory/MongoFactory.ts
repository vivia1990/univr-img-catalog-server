import { Document, InferIdType } from 'mongodb';
import ModelRepository, { BaseRepository, Model } from './ModelRepository.js';
import { MongoRepository } from '../MongoRepository.js';
import Mongo from '../../db/Mongo.js';

export default class MongoFactory extends ModelRepository<'_id'> {
    private client: Mongo;
    constructor (client: Mongo) {
        super();
        this.client = client;
    }

    createModelRepo<T extends Document> (model: Model): BaseRepository<T, '_id', InferIdType<T>> {
        return new MongoRepository<T>(this.client, model.getTableName());
    }
}
