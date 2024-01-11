import { ObjectId } from 'mongodb';
import { User } from '../../../server/models/User.js';
import { faker } from '@faker-js/faker';

export function createRandomUser (nDatasets: number = 0): User {
    return new User(
        faker.internet.userName(),
        faker.internet.email(),
        faker.internet.password(),
        Array.from({ length: nDatasets }, () => new ObjectId(faker.number.int()))
    );
}

export function createMultipleRandomUser (count: number): User[] {
    return faker.helpers.multiple(createRandomUser, { count });
}
