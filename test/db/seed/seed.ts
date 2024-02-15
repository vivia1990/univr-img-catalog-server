import { env } from '../../../server/env.js';
import MongoConnection from '../../../server/db/MongoConnection.js';
import { seedDb } from './DatasetAndImages.js';

MongoConnection.setConnectionParams({
    name: env.DB_NAME,
    address: env.DB_ADDRESS,
    passw: env.DB_PASSW,
    port: env.DB_PORT,
    user: env.DB_USER
});

await Promise.all([seedDb(await MongoConnection.getConnection(), env.IMG_STORAGE)])
    .then(() => console.log('db seeded'))
    .catch(error => console.error(error))
    .finally(async () => await MongoConnection.closeConnection());
