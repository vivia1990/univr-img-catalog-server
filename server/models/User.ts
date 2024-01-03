import { Model } from '../repositories/factory/ModelRepository.js';

export class User implements Model {
    public static readonly tableName = 'user';
    constructor (
        public name: string,
        public email: string,
        public password: string) {}

    getTableName (): string {
        return User.tableName;
    }
};
