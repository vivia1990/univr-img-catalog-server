import { ObjectId } from 'mongodb';
import { Model } from '../repositories/interfaces/BaseRepository.js';
import { z } from 'zod';

const userSchema = z.object({
    name: z.string().max(50),
    email: z.string().email(),
    password: z.string().min(8).max(16),
    datasets: z.array(z.object({}).refine(value => value instanceof ObjectId))
});

type UserSchema = z.infer<typeof userSchema>;

export default class User implements Model {
    public static readonly tableName = 'user';
    constructor (
        public readonly name: UserSchema['name'],
        public readonly email: UserSchema['email'],
        public readonly password: UserSchema['password'],
        public readonly datasets: ObjectId[] = []) {}

    getTableName (): string {
        return User.tableName;
    }

    validate () {
        return userSchema.safeParse(this);
    }
}
