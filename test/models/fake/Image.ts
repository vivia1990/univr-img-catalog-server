import { ObjectId } from 'mongodb';
import Image from '../../../server/models/Image.js';
import { faker } from '@faker-js/faker';
import { env } from '../../../server/env.js';
import { sep } from 'path';

export function createRandomImage (rectsCount: number = 5, idDataset: ObjectId | undefined = undefined): Image {
    const fName = faker.system.fileName();
    const idDs = idDataset || new ObjectId(faker.number.int());
    return new Image(
        fName,
        Image.getStoragePath(env.IMG_STORAGE, idDs.toString() + sep + fName),
        faker.helpers.multiple(() => ({
            endX: faker.number.int(),
            endY: faker.number.int(),
            startY: faker.number.int(),
            startX: faker.number.int(),
            description: faker.commerce.productDescription(),
            tags: faker.helpers.multiple(() =>
                ({ name: faker.internet.domainWord() }), { count: faker.number.int({ max: 15, min: 0 }) })

        }), { count: rectsCount }),
        idDs
    );
}

export function createMultipleRandomImage (count: number): Image[] {
    return faker.helpers.multiple(createRandomImage, { count });
}
