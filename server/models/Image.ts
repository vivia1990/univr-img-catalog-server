import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { Model } from '../repositories/interfaces/BaseRepository.js';

const imgSchema = z.object({
    name: z.string().max(50),
    path: z.string().max(255),
    dataset: z.object({}).refine(value => value instanceof ObjectId),
    tags: z.array(z.object({
        name: z.string().max(20),
        description: z.string().max(250).default('')
    }))
});

type ImgSchema = z.infer<typeof imgSchema>;

export default class Image implements Model {
    public static readonly tableName = 'image';
    constructor (
        public readonly name: ImgSchema['name'],
        public readonly path: ImgSchema['path'],
        public tags: ImgSchema['tags'],
        public dataset: ImgSchema['dataset']) {}

    getTableName (): string {
        return Image.tableName;
    }

    validate () {
        return imgSchema.safeParse(this);
    }
}
