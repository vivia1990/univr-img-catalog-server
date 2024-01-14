import { ObjectId } from 'mongodb';
import Image from '../../../server/models/Image.js';
import { faker } from '@faker-js/faker';

export function createRandomImage (): Image {
    return new Image(
        faker.system.fileName(),
        faker.system.filePath(),
        [],
        new ObjectId(faker.number.int())
    );
}

export function createMultipleRandomImage (count: number): Image[] {
    return faker.helpers.multiple(createRandomImage, { count });
}
