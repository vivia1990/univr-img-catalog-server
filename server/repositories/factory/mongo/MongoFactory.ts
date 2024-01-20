import { Document, ObjectId } from 'mongodb';
import MongoRepository from '../../mongo/MongoRepository.js';
import Mongo from '../../../db/drivers/Mongo.js';
import UserRepository from '../../mongo/UserRepository.js';
import DataSetRepository from '../../mongo/DataSetRepository.js';
import ImageRepository from '../../mongo/ImageRepository.js';
import { IDBFactory } from '../../interfaces/DBFactory.js';

export default class MongoFactory implements IDBFactory<'_id', ObjectId> {
    protected readonly client: Mongo;
    constructor (client: Mongo) {
        this.client = client;
    }

    createUserRepo () {
        return new UserRepository(this.client);
    }

    createDataSetRepo () {
        return new DataSetRepository(this.client);
    }

    createImageRepo () {
        return new ImageRepository(this.client);
    }

    createModelRepo<T extends Document> (table: string) {
        return new MongoRepository<T>(this.client, table);
    }
}
