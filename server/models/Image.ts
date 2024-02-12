import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { Model } from '../repositories/interfaces/BaseRepository.js';
import { tagSchema } from './Tag.js';
import path from 'path';

export const imgSchema = z.object({
    name: z.string().max(50),
    path: z.string().max(255),
    dataset: z.object({}).refine(value => value instanceof ObjectId),
    rects: z.array(
        z.object({
            tags: z.array(tagSchema),
            description: z.string().optional(),
            startX: z.number(),
            startY: z.number(),
            endX: z.number(),
            endY: z.number()
        })).default([])
});

type ImgSchema = z.infer<typeof imgSchema>;

const ds = path.sep;

export default class Image implements Model {
    public static readonly tableName = 'image';
    constructor (
        public readonly name: ImgSchema['name'],
        public readonly path: ImgSchema['path'],
        public rects: ImgSchema['rects'],
        public dataset: ObjectId) {}

    getTableName (): string {
        return Image.tableName;
    }

    static getStoragePath (baseUrl: string, fileName: string, rootDir: string = 'public') {
        const str = baseUrl.split(ds)
            .filter((el): el is string => el !== '.' && el !== '..' && el !== rootDir);
        return path.join(...str, fileName);
    }

    validate () {
        return imgSchema.safeParse(this);
    }
}
