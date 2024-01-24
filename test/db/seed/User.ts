import MongoFactory from '../../../server/repositories/factory/mongo/MongoFactory.js';
import MongoConnection from '../../../server/db/MongoConnection.js';
import { createMultipleRandomUser } from '../../models/fake/User.js';
import { env } from '../../../server/env.js';

MongoConnection.setConnectionParams({
    name: env.DB_NAME,
    address: env.DB_ADDRESS,
    passw: env.DB_PASSW,
    port: env.DB_PORT,
    user: env.DB_USER
});

const factory = new MongoFactory(await MongoConnection.getConnection());
const userRepo = factory.createUserRepo();

await userRepo.insertMany(createMultipleRandomUser(500));

await MongoConnection.closeConnection();
