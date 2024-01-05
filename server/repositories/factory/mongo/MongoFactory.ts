import { Document, InferIdType } from 'mongodb';
import ModelRepository, { BaseRepository } from '../ModelRepository.js';
import MongoRepository from '../../mongo/MongoRepository.js';
import Mongo from '../../../db/Mongo.js';

export default class MongoFactory<T extends Document> extends ModelRepository<T, '_id'> {
    protected readonly client: Mongo;
    protected readonly collection: string;
    constructor (client: Mongo, collection: string) {
        super();
        this.client = client;
        this.collection = collection;
    }

    createModelRepo (): BaseRepository<T, '_id', InferIdType<T>> {
        return new MongoRepository<T>(this.client, this.collection);
    }
}
