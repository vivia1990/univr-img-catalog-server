import { Filter, ObjectId } from 'mongodb';
import Mongo from '../../db/drivers/Mongo.js';
import User from '../../models/User.js';
import { PaginationResult, QueryFilter } from '../interfaces/BaseRepository.js';
import MongoRepository from './MongoRepository.js';
import DataSet from '../../models/DataSet.js';
import { IDataSetRepository } from '../interfaces/DataSetRepository.js';
import UserRepository from './UserRepository.js';
import Image from '../../models/Image.js';
import ImageRepository from './ImageRepository.js';

type DsWithImages = PropertiesOnly<DataSet> & {
    images: PaginationResult<Image, keyof Image, '_id', ObjectId>;
}
type PaginatedDsWithImages = PaginationResult<DsWithImages, keyof DsWithImages, '_id', ObjectId>

export default class DataSetRepository extends MongoRepository<PropertiesOnly<DataSet>> implements IDataSetRepository<'_id', ObjectId> {
    private userRepo: UserRepository | null;
    private imgRepo: ImageRepository | null;

    constructor (mongoDatabase: Mongo, userRepo: UserRepository | null = null, imgRepo: ImageRepository | null = null) {
        super(mongoDatabase, DataSet.tableName);
        this.userRepo = userRepo;
        this.imgRepo = imgRepo;
    }

    images<Fields extends keyof Image = keyof Image> (idDataset: ObjectId, query: QueryFilter<Image> = {}): Promise<PaginationResult<Image, Fields, '_id', ObjectId>> {
        if (!this.imgRepo) {
            return Promise.reject(new Error('Istanziato senza relazioni'));
        }

        const filter: Filter<Image> = { dataset: idDataset };

        return this.imgRepo.findAllPaginated({ ...filter, ...query.filter || {} }, query.page || 1);
    }

    users (idDataset: ObjectId, query: QueryFilter<User> = {}): Promise<PaginationResult<User, keyof User, '_id', ObjectId>> {
        if (!this.userRepo) {
            return Promise.reject(new Error('Istanziato senza relazioni'));
        }

        const filter: Filter<User> = { datasets: { $in: [new ObjectId(idDataset)] } };

        return this.userRepo.findAllPaginated({ ...filter, ...query.filter || {} }, query.page || 1);
    }

    async findAllWithImages (filter: Filter<PropertiesOnly<DataSet>> = {}): Promise<PaginatedDsWithImages> {
        const aggrOpt = [
            {
                $lookup: {
                    from: 'image',
                    localField: '_id',
                    foreignField: 'dataset',
                    as: 'images',
                    pipeline: [
                        {
                            $facet: {
                                data: [{ $skip: 0 }, { $limit: 2000 }]
                            }
                        }
                    ]
                }
            },
            { $addFields: { images: { $arrayElemAt: ['$images', 0] } } }
        ];

        const [values] = await this.cursorPagination<DsWithImages>(filter, 1, aggrOpt)
            .toArray();

        return {
            data: values?.data || [],
            pagination: this.paginator.buildMetaData(1, values?.metadata[0]?.totalCount || 0)
        };
    }

    async findOneWithImages (id: ObjectId): Promise<DsWithImages | null> {
        const { data } = await this.findAllWithImages({ _id: id });
        if (data[0]) {
            return data[0];
        }

        return null;
    }
}
