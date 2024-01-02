/* eslint-disable @typescript-eslint/no-explicit-any */
// todo pensare a fix
import { Db, ObjectId, Filter, InsertOneResult, Document, InferIdType, Collection } from 'mongodb';
import { BaseRepository, ModelWithId } from './factory/ModelRepository.js';
import Mongo from '../db/Mongo.js';

export class MongoRepository<T extends Document> implements BaseRepository<T, '_id', InferIdType<T>> {
    private db: Db;
    protected collection: Collection<T>;
    protected collectionName: string;

    constructor (mongoDatabase: Mongo, collectionName: string) {
        this.db = mongoDatabase.db;
        this.collectionName = collectionName;
        this.collection = this.db.collection<T>(collectionName);
    }

    async create (item: T): Promise<ModelWithId<T, '_id', InferIdType<T>>> {
        const fields: T = { created_at: new Date(), updated_at: null, ...item };
        return this.collection.insertOne(fields as any)
            .then((result: InsertOneResult<T>) => {
                console.log(result.insertedId);
                return (
                    { ...{ _id: result.insertedId }, ...fields } as ModelWithId<T, '_id', InferIdType<T>>
                );
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

    find (item: Partial<T>): Promise<ModelWithId<T, '_id', InferIdType<T>> | null> {
        return this.collection.findOne(item as any);
    }

    findAll (item: Partial<T>): Promise<ModelWithId<T, '_id', InferIdType<T>>[]> {
        return this.collection.find(item as any).toArray();
    }
}
