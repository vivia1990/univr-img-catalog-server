import { ObjectId } from 'mongodb';
import Mongo from '../../db/drivers/Mongo.js';
import { InsertedMany } from '../interfaces/BaseRepository.js';
import MongoRepository from './MongoRepository.js';
import DataSet from '../../models/DataSet.js';
import Image from '../../models/Image.js';
import { IImageRepository } from '../interfaces/ImageRepository.js';
import { ModelWithId } from '../factory/mongo/MongoFactory.js';
import DataSetRepository from './DataSetRepository.js';

export type ImageRecord = Omit<Image, 'rects'> & {rects: (Image['rects'][number] & {_id?: ObjectId})[] }

export default class ImageRepository extends MongoRepository<ImageRecord> implements IImageRepository<'_id', ObjectId> {
    private dsRepo: DataSetRepository | null;

    constructor (mongoDatabase: Mongo, dsRepo: DataSetRepository | null = null) {
        super(mongoDatabase, Image.tableName);
        this.dsRepo = dsRepo;
    }

    async checkTag (tagName: string, image: Image): Promise<boolean> {
        const ds = await this.dataset(image.dataset.toString());
        if (!ds) {
            throw new Error('DataSet not found');
        }

        return ds.tags.find(({ name }) => name === tagName) !== undefined;
    }

    private mapRect (rect: Image['rects'][number]) {
        return { ...{ _id: new ObjectId() }, ...rect };
    }

    insert (item: ImageRecord): Promise<ModelWithId<Required<ImageRecord>>> {
        const copy = { ...item };
        copy.rects = copy.rects.map(this.mapRect);
        item.dataset = new ObjectId(item.dataset);

        return super.insert(copy).then(result => {
            result.rects = copy.rects;
            return result;
        });
    }

    insertMany (items: ImageRecord[]): Promise<InsertedMany<Required<ImageRecord>, '_id', ObjectId>> {
        const copy = [...items];
        for (const item of copy) {
            item.rects = item.rects.map(this.mapRect);
            item.dataset = new ObjectId(item.dataset);
        }

        return super.insertMany(copy).then(results => {
            for (const [index, item] of results.inserted.entries()) {
                item.rects = copy[index]!.rects;
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
        if (item.rects?.length) {
            item.rects = item.rects.map(this.mapRect);
        }

        return super.updateById(id, item);
    }

    dataset (idDataset: string): Promise<ModelWithId<PropertiesOnly<DataSet>>> {
        if (!this.dsRepo) {
            throw new Error('istanziato senza relazioni');
        }

        return this.dsRepo.findById(idDataset).then(value => {
            if (!value) {
                throw new Error('DataSet not found');
            }

            return value;
        });
    }
}
