import { ObjectId } from 'mongodb';
import User from '../../../server/models/User.js';
import { faker } from '@faker-js/faker';

export function createRandomUser (nDatasets: number = 0, values: Partial<User> = {}): User {
    return new User(
        values.name ?? faker.internet.userName(),
        values.email ?? faker.internet.email(),
        values.password ?? faker.internet.password(),
        values.datasets ?? Array.from({ length: nDatasets }, () => new ObjectId(faker.number.int()))
    );
}

export function createMultipleRandomUser (count: number): User[] {
    return faker.helpers.multiple(createRandomUser, { count });
}
