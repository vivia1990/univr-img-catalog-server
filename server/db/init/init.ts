import MongoConnection from '../MongoConnection.js';
import { env } from '../../env.js';
import { DataSetCollection, UserCollection } from './Constraints.js';

MongoConnection.setConnectionParams({
    name: env.DB_NAME,
    address: env.DB_ADDRESS,
    passw: env.DB_PASSW,
    port: env.DB_PORT,
    user: env.DB_USER
});
const connection = await MongoConnection.getConnection();

Promise.all([
    UserCollection(connection),
    DataSetCollection(connection)
])
    .then(() => console.info(`Init ==> ${env.DB_NAME} Done!`))
    .catch(error => { throw error; })
    .finally(() => MongoConnection.closeConnection());
