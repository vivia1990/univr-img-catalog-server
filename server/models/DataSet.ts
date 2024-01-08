import { z } from 'zod';
import { Model } from '../repositories/factory/ModelRepository.js';
import { tagSchema } from './Tag.js';

const dsSchema = z.object({
    name: z.string().max(50),
    images: z.object({
        count: z.number().min(0).default(0),
        validated: z.number().min(0).default(0)
    }),
    owner: z.string(),
    tags: z.array(tagSchema)
});

type DsSchema = z.infer<typeof dsSchema>

export default class DataSet implements Model {
    static readonly tableName: string = 'dataset';

    constructor (
        public readonly name: DsSchema['name'],
        public readonly owner: DsSchema['owner'],
        public readonly images: DsSchema['images'] = { count: 0, validated: 0 },
        public readonly tags: DsSchema['tags'] = []) {}

    getTableName (): string {
        return DataSet.tableName;
    }

    validate () {
        return dsSchema.safeParse(this);
    }
}
