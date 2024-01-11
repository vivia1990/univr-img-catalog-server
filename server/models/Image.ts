import { ObjectId } from 'mongodb';
import { Model } from '../repositories/interfaces/BaseRepository.js';
import { z } from 'zod';
import { tagSchema } from './Tag.js';

const imgSchema = z.object({
    name: z.string().max(50),
    path: z.string().max(255),
    dataset: z.object({}).refine(value => value instanceof ObjectId),
    tags: z.array(tagSchema)
});

type ImgSchema = z.infer<typeof imgSchema>;

export class Image implements Model {
    public static readonly tableName = 'image';
    constructor (
        public readonly name: ImgSchema['name'],
        public readonly path: ImgSchema['path'],
        public readonly tags: ImgSchema['tags'],
        public readonly datasets: ObjectId = new ObjectId()) {}

    getTableName (): string {
        return Image.tableName;
    }

    validate () {
        return imgSchema.safeParse(this);
    }
};
