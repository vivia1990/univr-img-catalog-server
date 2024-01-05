import { Model } from '../repositories/factory/ModelRepository.js';
import { z } from 'zod';

const userSchema = z.object({
    name: z.string().max(50),
    email: z.string().email(),
    password: z.string().min(8).max(16)
});

type UserSchema = z.infer<typeof userSchema>;

export class User implements Model {
    public static readonly tableName = 'user';
    constructor (
        public readonly name: UserSchema['name'],
        public readonly email: UserSchema['email'],
        public readonly password: UserSchema['password']) {}

    getTableName (): string {
        return User.tableName;
    }

    validate () {
        return userSchema.safeParse(this);
    }
};
