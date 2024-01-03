import { User } from '../../../server/models/User.js';
import { faker } from '@faker-js/faker';

export function createRandomUser (): User {
    return new User(
        faker.internet.userName(),
        faker.internet.email(),
        faker.internet.password()
    );
}

export function createMultipleRandomUser (count: number): User[] {
    return faker.helpers.multiple(createRandomUser, { count });
}
