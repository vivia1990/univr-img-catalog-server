import { ObjectId } from 'mongodb';
import Mongo from '../../db/drivers/Mongo.js';
import { InsertedMany } from '../interfaces/BaseRepository.js';
import MongoRepository from './MongoRepository.js';
import DataSet from '../../models/DataSet.js';
import Image from '../../models/Image.js';
import { IImageRepository } from '../interfaces/ImageRepository.js';
import Tag from '../../models/Tag.js';
import { ModelWithId } from '../factory/mongo/MongoFactory.js';

export type ImageRecord = Omit<Image, 'tags'> & {tags: (Tag & {_id?: ObjectId})[]}

export default class ImageRepository extends MongoRepository<ImageRecord> implements IImageRepository<'_id', ObjectId> {
    constructor (mongoDatabase: Mongo) {
        super(mongoDatabase, Image.tableName);
    }

    private mapTag (tag: Tag) {
        return { ...{ _id: new ObjectId() }, ...tag };
    }

    insert (item: ImageRecord): Promise<ModelWithId<Required<ImageRecord>>> {
        const copy = { ...item };
        copy.tags = item.tags.map(this.mapTag);
        item.dataset = new ObjectId(item.dataset);

        return super.insert(copy).then(result => {
            result.tags = copy.tags;
            return result;
        });
    }

    insertMany (items: ImageRecord[]): Promise<InsertedMany<Required<ImageRecord>, '_id', ObjectId>> {
        const copy = [...items];
        for (const item of copy) {
            item.tags = item.tags.map(this.mapTag);
            item.dataset = new ObjectId(item.dataset);
        }

        return super.insertMany(copy).then(results => {
            for (const [index, item] of results.inserted.entries()) {
                item.tags = copy[index]!.tags;
            }

            return {
                inserted: results.inserted,
                failed: results.failed
            };
        });
    }

    /**
     *
     * @param id
     * @param item Side Effect! La proprietà tag viene mutata se presente in item
     * @returns
     */
    updateById (id: string, item: Partial<ImageRecord>): Promise<boolean> {
        if (item.tags) {
            item.tags = item.tags.map(this.mapTag);
        }

        return super.updateById(id, item);
    }

    dataset (): Promise<ModelWithId<Partial<DataSet>>> {
        throw new Error('Method not implemented.');
    }
}
