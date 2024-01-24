import { env } from '../../../server/env.js';
import MongoConnection from '../../../server/db/MongoConnection.js';
import { seedDataSet, seedUser } from './Models.js';

MongoConnection.setConnectionParams({
    name: env.DB_NAME,
    address: env.DB_ADDRESS,
    passw: env.DB_PASSW,
    port: env.DB_PORT,
    user: env.DB_USER
});

await Promise.all([
    seedDataSet(),
    seedUser()
]).then(() => console.log('db seeded'))
    .finally(async () => await MongoConnection.closeConnection());
