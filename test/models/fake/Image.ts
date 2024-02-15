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

export function createRandomRect (dataSetTags?: string[]): Image['rects'][number] {
    let tags;
    if (!dataSetTags?.length) {
        tags = faker.helpers.multiple(() => ({ name: faker.internet.domainWord() }),
            { count: faker.number.int({ max: 15, min: 0 }) });
    } else {
        const { length } = dataSetTags;
        tags = dataSetTags.slice(faker.number.int({ max: length, min: 0 }))
            .map(name => ({ name }));
    }

    return {
        endX: faker.number.int({ max: 600, min: 0 }),
        endY: faker.number.int({ max: 600, min: 0 }),
        startY: faker.number.int({ max: 600, min: 0 }),
        startX: faker.number.int({ max: 600, min: 0 }),
        description: faker.commerce.productDescription(),
        tags
    };
}

export function createMultipleRandomRects (count: number, dataSetTags?: string[]) {
    return faker.helpers.multiple(createRandomRect.bind(null, dataSetTags), { count });
}

export function createMultipleRandomImage (count: number): Image[] {
    return faker.helpers.multiple(createRandomImage, { count });
}
