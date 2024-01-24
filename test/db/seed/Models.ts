import MongoFactory from '../../../server/repositories/factory/mongo/MongoFactory.js';
import MongoConnection from '../../../server/db/MongoConnection.js';
import { createMultipleRandomDataSet } from '../../models/fake/DataSet.js';
import { createMultipleRandomUser } from '../../models/fake/User.js';

export async function seedDataSet () {
    const factory = new MongoFactory(await MongoConnection.getConnection());
    const dsRepo = factory.createDataSetRepo();

    await dsRepo.insertMany(createMultipleRandomDataSet(500))
        .then(result => console.log(`Inseriti ${result.inserted.length} Dataset`));
}

export async function seedUser () {
    const factory = new MongoFactory(await MongoConnection.getConnection());
    const userRepo = factory.createUserRepo();

    await userRepo.insertMany(createMultipleRandomUser(500))
        .then(result => console.log(`Inseriti ${result.inserted.length} User`));
}
