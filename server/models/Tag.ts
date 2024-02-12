// import { Model } from '../repositories/factory/ModelRepository.js';
import { z } from 'zod';

export const tagSchema = z.object({
    name: z.string().max(50)
});

type TagSchema = z.infer<typeof tagSchema>;

export default class Tag {
    constructor (
        public readonly name: TagSchema['name']
    ) {}
}
