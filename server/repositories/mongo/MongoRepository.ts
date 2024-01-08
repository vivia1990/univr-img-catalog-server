/* eslint-disable @typescript-eslint/no-explicit-any */
// todo pensare a fix
import { Db, ObjectId, Filter, InsertOneResult, Document, InferIdType, Collection, InsertManyResult, MongoBulkWriteError } from 'mongodb';
import { BaseRepository, ModelWithId, InsertedMany } from '../factory/ModelRepository.js';
import Mongo from '../../db/drivers/Mongo.js';

export default class MongoRepository<T extends Document> implements BaseRepository<T, '_id', InferIdType<T>> {
    private db: Db;
    protected collection: Collection<T>;
    protected collectionName: string;

    constructor (mongoDatabase: Mongo, collectionName: string) {
        this.db = mongoDatabase.db;
        this.collectionName = collectionName;
        this.collection = this.db.collection<T>(collectionName);
    }

    insert (item: T): Promise<ModelWithId<T, '_id', InferIdType<T>>> {
        const fields: T = { created_at: new Date(), updated_at: null, ...item };
        return this.collection.insertOne(fields as any)
            .then((result: InsertOneResult<T>) => (
                    { ...{ _id: result.insertedId }, ...fields } as ModelWithId<T, '_id', InferIdType<T>>
            ));
    }

    private mapData (insertIds: {[key: number]: InferIdType<T>}, items: T[]) {
        return Object.values(insertIds)
            .map(
                (id, index) => ({ ...{ _id: id }, ...items[index] }) as ModelWithId<T, '_id', InferIdType<T>>
            );
    }

    insertMany (items: T[]): Promise<InsertedMany<T, '_id', InferIdType<T>>> {
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

    findById (id: string): Promise<ModelWithId<T, '_id', InferIdType<T>> | null> {
        return this.collection.findOne({ _id: new ObjectId(id) } as Filter<T>);
    }

    find (item: Filter<T>): Promise<ModelWithId<T, '_id', InferIdType<T>> | null> {
        return this.collection.findOne(item);
    }

    findAll (item: Filter<T>): Promise<ModelWithId<T, '_id', InferIdType<T>>[]> {
        return this.collection.find(item).toArray();
    }
}
