import { z } from 'zod';
import { Model } from '../repositories/interfaces/BaseRepository.js';
import { tagSchema } from './Tag.js';
import { ObjectId } from 'mongodb';

const dsSchema = z.object({
    name: z.string().max(50),
    images: z.object({
        count: z.number().min(0).default(0),
        validated: z.number().min(0).default(0)
    }),
    owners: z.array(z.object({}).refine(value => value instanceof ObjectId)),
    tags: z.array(tagSchema)
});

type DsSchema = z.infer<typeof dsSchema>;

export default class DataSet implements Model {
    static readonly tableName: string = 'dataset';

    constructor (
        public readonly name: DsSchema['name'],
        public readonly images: DsSchema['images'] = { count: 0, validated: 0 },
        public readonly owners: ObjectId[],
        public readonly tags: DsSchema['tags'] = []) {}

    getTableName (): string {
        return DataSet.tableName;
    }

    validate () {
        return dsSchema.safeParse(this);
    }
}
