import { ObjectId } from 'mongodb';
import Image from '../../../server/models/Image.js';
import { faker } from '@faker-js/faker';
import { env } from '../../../server/env.js';
import { sep } from 'path';

export function createRandomImage (tagCount: number = 5, idDataset: ObjectId | undefined = undefined): Image {
    const fName = faker.system.fileName();
    const idDs = idDataset || new ObjectId(faker.number.int());
    return new Image(
        fName,
        Image.getStoragePath(env.IMG_STORAGE, idDs.toString() + sep + fName),
        faker.helpers.multiple(() =>
            ({ description: faker.commerce.productDescription(), name: faker.internet.domainWord() }), { count: tagCount }),
        idDs
    );
}

export function createMultipleRandomImage (count: number): Image[] {
    return faker.helpers.multiple(createRandomImage, { count });
}
