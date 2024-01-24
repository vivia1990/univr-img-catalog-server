import DataSet from '../../models/DataSet.js';
import User from '../../models/User.js';
import Mongo from '../drivers/Mongo.js';

export async function UserCollection (connection: Mongo) {
    await connection.db.collection<User>(User.tableName).createIndex({ email: 1 }, { unique: true });
}

export async function DataSetCollection (connection: Mongo) {
    await connection.db.collection<DataSet>(DataSet.tableName)
        .createIndex({ name: 1, owners: 1 }, { unique: true });
}
