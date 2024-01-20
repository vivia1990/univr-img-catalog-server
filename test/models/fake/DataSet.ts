import { ObjectId } from 'mongodb';
import DataSet from '../../../server/models/DataSet.js';
import { faker } from '@faker-js/faker';

export function createRandomDataSet (nDatasets: number = 0): DataSet {
    return new DataSet(
        faker.internet.userName(),
        { count: faker.number.int(1000), validated: faker.number.int(1000) },
        Array.from({ length: nDatasets }, () => new ObjectId(faker.number.int())),
        Array.from({ length: 15 }, () => ({ name: faker.internet.domainWord(), img_tagged: 0 }))
    );
}

export function createMultipleRandomDataSet (count: number): DataSet[] {
    return faker.helpers.multiple(createRandomDataSet, { count });
}
