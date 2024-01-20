import MongoFactory from '../../../server/repositories/factory/mongo/MongoFactory.js';
import MongoConnection from '../../../server/db/MongoConnection.js';
import { createMultipleRandomDataSet } from '../../models/fake/DataSet.js';
import { env } from '../../../server/env.js';

MongoConnection.setConnectionParams({
    name: env.DB_NAME,
    address: env.DB_ADDRESS,
    passw: env.DB_PASSW,
    port: env.DB_PORT,
    user: env.DB_USER
});

const factory = new MongoFactory(await MongoConnection.getConnection());
const dsRepo = factory.createDataSetRepo();

dsRepo.insertMany(createMultipleRandomDataSet(500));

await MongoConnection.closeConnection();
