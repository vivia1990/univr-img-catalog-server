/* eslint-disable @typescript-eslint/no-explicit-any */
// todo pensare a fix
import { Db, ObjectId, Filter, InsertOneResult, Document, Collection, InsertManyResult, MongoBulkWriteError } from 'mongodb';
import { BaseRepository, ModelWithId, InsertedMany, PaginationResult } from '../interfaces/BaseRepository.js';
import Mongo from '../../db/drivers/Mongo.js';
import { IPaginator } from '../interfaces/Paginator.js';
import Paginator from './Paginator.js';

export default class MongoRepository<T extends Document> implements BaseRepository<T, '_id', ObjectId> {
    private db: Db;
    protected paginator: IPaginator;
    protected collection: Collection<T>;
    protected collectionName: string;

    constructor (mongoDatabase: Mongo, collectionName: string, paginator: Paginator = new Paginator(100)) {
        this.db = mongoDatabase.db;
        this.collectionName = collectionName;
        this.collection = this.db.collection<T>(collectionName);
        this.paginator = paginator;
    }

    setPaginator (paginator: IPaginator): void {
        this.paginator = paginator;
    }

    getPaginator (): IPaginator {
        return this.paginator;
    }

    async findAllPaginated (item: Filter<T>, page: number): Promise<PaginationResult<T, '_id', ObjectId>> {
        const pageSize = this.paginator.getPageSize();
        const filter = {
            $facet: {
                metadata: [{ $count: 'totalCount' }],
                data: [{ $skip: (page - 1) * pageSize }, { $limit: pageSize }]
            }
        };
        const [values] = await this.collection
            .aggregate([{ $match: item }, filter]).toArray() as Document[1];

        return {
            data: values.data,
            pagination: this.paginator.buildMetaData(page, values.metadata[0].totalCount)
        };
    }

    insert (item: T): Promise<ModelWithId<T, '_id', ObjectId>> {
        const fields: T = { created_at: new Date(), updated_at: null, ...item };
        return this.collection.insertOne(fields as any)
            .then((result: InsertOneResult<T>) => (
                    { ...{ _id: result.insertedId }, ...fields } as ModelWithId<T, '_id', ObjectId>
            ));
    }

    private mapData (insertIds: {[key: number]: ObjectId}, items: T[]) {
        return Object.values(insertIds)
            .map(
                (id, index) => ({ ...{ _id: id }, ...items[index] }) as ModelWithId<T, '_id', ObjectId>
            );
    }

    insertMany (items: T[]): Promise<InsertedMany<T, '_id', ObjectId>> {
        const length = items.length;
        const records: T[] = items.map(item => ({ created_at: new Date(), updated_at: null, ...item }));

        return this.collection.insertMany(records as any)
            .then((result: InsertManyResult<T>) => {
                if (result.insertedCount !== length) {
                    throw new Error(`Errore inserimento, inseriti ${result.insertedCount}`);
                }

                return {
                    inserted: this.mapData(result.insertedIds, records),
                    failed: []
                };
            }).catch(error => {
                if (!(error instanceof MongoBulkWriteError)) {
                    throw error;
                }

                return {
                    inserted: this.mapData(error.insertedIds, records),
                    failed: items.slice(error.insertedCount)
                };
            });
    }

    updateById (id: string, item: Partial<T>): Promise<boolean | Error> {
        const filter = { _id: new ObjectId(id) } as Filter<T>;

        return this.collection.updateOne(filter, { $set: { updated_at: new Date(), ...item } })
            .then(result => {
                if (result.matchedCount === 0) {
                    return Promise.reject(new Error('Document not found'));
                }
                return true;
            })
            .catch(error => (new Error(error.message || 'Update failed')));
    }

    deleteById (id: string): Promise<boolean | Error> {
        const filter = { _id: new ObjectId(id) } as Filter<T>;

        return this.collection.deleteOne(filter)
            .then(result => {
                if (result.deletedCount === 0) {
                    return Promise.reject(new Error('Document not found'));
                }
                return true;
            })
            .catch(error => (new Error(error.message || 'Delete failed')));
    }

    deleteMany (item: Filter<T>): Promise<number | Error> {
        return this.collection.deleteMany(item).then(result => {
            if (result.deletedCount) {
                return result.deletedCount;
            }

            throw new Error('Record non cancellati');
        });
    }

    findById (id: string): Promise<ModelWithId<T, '_id', ObjectId> | null> {
        return this.collection.findOne({ _id: new ObjectId(id) } as Filter<T>);
    }

    find (item: Filter<T>): Promise<ModelWithId<T, '_id', ObjectId> | null> {
        return this.collection.findOne(item);
    }

    findAll (item: Filter<T>): Promise<ModelWithId<T, '_id', ObjectId>[]> {
        return this.collection.find(item).toArray();
    }
}
