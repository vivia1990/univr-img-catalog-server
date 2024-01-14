import { Document, ObjectId } from 'mongodb';
import { BaseRepository } from '../../interfaces/BaseRepository.js';
import MongoRepository from '../../mongo/MongoRepository.js';
import Mongo from '../../../db/drivers/Mongo.js';
import { DBFactory } from '../../interfaces/DBFactory.js';
import { IDataSetRepository } from '../../interfaces/DataSetRepository.js';
import { IUserRepository } from '../../interfaces/UserRepository.js';
import UserRepository from '../../mongo/UserRepository.js';
import DataSetRepository from '../../mongo/DataSetRepository.js';
import { IImageRepository } from '../../interfaces/ImageRepository.js';
import ImageRepository from '../../mongo/ImageRepository.js';

export default class MongoFactory implements DBFactory<'_id', ObjectId> {
    protected readonly client: Mongo;
    constructor (client: Mongo) {
        this.client = client;
    }

    createUserRepo (): IUserRepository<'_id', ObjectId> {
        return new UserRepository(this.client);
    }

    createDataSetRepo (): IDataSetRepository<'_id', ObjectId> {
        return new DataSetRepository(this.client);
    }

    createImageRepo (): IImageRepository<'_id', ObjectId> {
        return new ImageRepository(this.client);
    }

    createModelRepo<T extends Document> (table: string): BaseRepository<T, '_id', ObjectId> {
        return new MongoRepository<T>(this.client, table);
    }
}
