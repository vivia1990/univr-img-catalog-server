export class User {
    private static readonly tableName = 'user';
    constructor (
        public name: string,
        public email: string,
        public password: string) {}

    getTableName (): string {
        return User.tableName;
    }
};
