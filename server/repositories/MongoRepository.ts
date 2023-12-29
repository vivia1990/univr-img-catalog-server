/* eslint-disable @typescript-eslint/no-explicit-any */
// todo pensare a fix
import { Db, ObjectId, Filter, InsertOneResult, Document, InferIdType } from 'mongodb';
import Mongo from '../db/Mongo.js';

type ModelWithId<T, ID extends string, TYPE extends object> = Omit<T, ID> & { [key in ID]: TYPE };

interface Writer<T extends Document, IDKEY extends string, IDTYPE extends object> {
    create(item: T): Promise<ModelWithId<T, IDKEY, IDTYPE>>;
    updateById(id: string, item: Partial<T>): Promise<boolean | Error>;
    deleteById(id: string): Promise<boolean | Error>;
}

interface Reader<T extends Document, IDKEY extends string, IDTYPE extends object> {
    find(item: Partial<T>): Promise<ModelWithId<T, IDKEY, IDTYPE> | null>;
    findAll(item: Partial<T>): Promise<ModelWithId<T, IDKEY, IDTYPE>[]>;
}

type BaseRepository<T extends Document, IDKEY extends string, IDTYPE extends object> = Writer<T, IDKEY, IDTYPE> & Reader<T, IDKEY, IDTYPE>;

export class MongoRepository<T extends Document> implements BaseRepository<T, '_id', InferIdType<T>> {
    private db: Db;
    protected collection: string;

    constructor (mongoDatabase: Mongo, table: string) {
        this.db = mongoDatabase.db;
        this.collection = table;
    }

    create (item: T): Promise<ModelWithId<T, '_id', InferIdType<T>>> {
        const collection = this.db.collection<T>(this.collection);
        const fields: T = { created_at: new Date(), updated_at: null, ...item };

        return collection.insertOne(fields as any)
            .then((result: InsertOneResult<T>) =>
                ({ ...{ _id: result.insertedId }, ...fields } as ModelWithId<T, '_id', InferIdType<T>>));
    }

    updateById (id: string, item: Partial<T>): Promise<boolean | Error> {
        const collection = this.db.collection<T>(this.collection);
        const filter = { _id: new ObjectId(id) } as Filter<T>;

        return collection.updateOne(filter, { $set: { updated_at: new Date(), ...item } })
            .then(result => {
                if (result.matchedCount === 0) {
                    return Promise.reject(new Error('Document not found'));
                }
                return true;
            })
            .catch(error => (new Error(error.message || 'Update failed')));
    }

    deleteById (id: string): Promise<boolean | Error> {
        const collection = this.db.collection<T>(this.collection);
        const filter = { _id: new ObjectId(id) } as Filter<T>;

        return collection.deleteOne(filter)
            .then(result => {
                if (result.deletedCount === 0) {
                    return Promise.reject(new Error('Document not found'));
                }
                return true;
            })
            .catch(error => (new Error(error.message || 'Delete failed')));
    }

    find (item: Partial<T>): Promise<ModelWithId<T, '_id', InferIdType<T>> | null> {
        const collection = this.db.collection<T>(this.collection);
        return collection.findOne(item as any);
    }

    findAll (item: Partial<T>): Promise<ModelWithId<T, '_id', InferIdType<T>>[]> {
        const collection = this.db.collection<T>(this.collection);
        return collection.find(item as any).toArray();
    }
}
