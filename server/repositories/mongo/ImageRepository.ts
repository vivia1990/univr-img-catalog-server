import { ObjectId } from 'mongodb';
import Mongo from '../../db/drivers/Mongo.js';
import { ModelWithId } from '../interfaces/BaseRepository.js';
import MongoRepository from './MongoRepository.js';
import DataSet from '../../models/DataSet.js';
import { Image } from '../../models/Image.js';
import { IImageRepository } from '../interfaces/ImageRepository.js';

export default class ImageRepository extends MongoRepository<Image> implements IImageRepository<'_id', ObjectId> {
    constructor (mongoDatabase: Mongo) {
        super(mongoDatabase, Image.tableName);
    }

    dataset (): Promise<ModelWithId<Partial<DataSet>, '_id', ObjectId>> {
        throw new Error('Method not implemented.');
    }
}
