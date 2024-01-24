import { Filter, ObjectId } from 'mongodb';
import Mongo from '../../db/drivers/Mongo.js';
import User from '../../models/User.js';
import { PaginationResult, QueryFilter } from '../interfaces/BaseRepository.js';
import MongoRepository from './MongoRepository.js';
import DataSet from '../../models/DataSet.js';
import { IDataSetRepository } from '../interfaces/DataSetRepository.js';
import UserRepository from './UserRepository.js';

export default class DataSetRepository extends MongoRepository<DataSet> implements IDataSetRepository<'_id', ObjectId> {
    private userRepo: UserRepository | null;

    constructor (mongoDatabase: Mongo, userRepo: UserRepository | null = null) {
        super(mongoDatabase, DataSet.tableName);
        this.userRepo = userRepo;
    }

    users (idDataset: ObjectId, query: QueryFilter<User> = {}): Promise<PaginationResult<User, '_id', ObjectId>> {
        if (!this.userRepo) {
            return Promise.reject(new Error('Istanziato senza relazioni'));
        }

        const filter: Filter<User> = { datasets: { $in: [new ObjectId(idDataset)] } };

        return this.userRepo.findAllPaginated({ ...filter, ...query.filter || {} }, query.page || 1);
    }
}
