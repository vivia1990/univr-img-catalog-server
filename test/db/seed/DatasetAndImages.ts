import MongoFactory from '../../../server/repositories/factory/mongo/MongoFactory.js';
import Mongo from '../../../server/db/drivers/Mongo.js';
import { createRandomUser } from '../../models/fake/User.js';
import DataSet from '../../../server/models/DataSet.js';
import { mkdir, opendir, readFile, writeFile } from 'fs/promises';
import osPath from 'path';
import Image from '../../../server/models/Image.js';
import { faker } from '@faker-js/faker';
import { createMultipleRandomRects } from '../../models/fake/Image.js';

export async function loadImages (directory: string) {
    const files = [];
    const dir = await opendir(directory);

    for await (const dirent of dir) {
        if (!dirent.isFile()) {
            continue;
        }

        const path = osPath.join(dirent.path, dirent.name);
        files.push(new Promise<File>(resolve => {
            readFile(path)
                .then(content => resolve(new File([new Blob([content])], dirent.name)));
        }));
    }

    return await Promise.all(files);
}

function getPath (relative: string) {
    return new URL(relative, import.meta.url).pathname;
}

export async function seedDb (connection: Mongo, imgStoragePath: string) {
    const factory = new MongoFactory(connection);
    const userRepo = factory.createUserRepo();
    const dsRepo = factory.createDataSetRepo(false);
    const imgRepo = factory.createImageRepo(false);

    const files = await loadImages(getPath('data/images'));
    if (!files.length) {
        throw new Error('no images in data/images');
    }

    const user = await userRepo.insert(createRandomUser(1));

    const dsTags: DataSet['tags'] = ['dog', 'ball', 'car', 'bike', 'red-bench', 'stairs', 'chair', 'meat'].map(name => ({ name }));

    const ds = await dsRepo.insert(
        new DataSet('test-lea', { count: 36, validated: 0 }, [user._id], dsTags)
    );

    const errors: string[] = [];
    for (const file of files) {
        const dsId = ds._id;
        const rects = createMultipleRandomRects(
            faker.number.int({ max: 6, min: 0 }),
            ds.tags.map(({ name }) => name)
        );

        const img = new Image(
            file.name,
            Image.getStoragePath(imgStoragePath, osPath.join(dsId.toString(), file.name)),
            rects || [],
            dsId
        );

        await imgRepo.insert(img)
            .catch(() => { console.info(`${img.name} non salvata in ${img.path}`); errors.push(img.name); });
    }

    if (errors.length) {
        throw errors;
    }

    const relative = new URL(imgStoragePath + '/', 'file://' + process.cwd() + '/');
    const storePath = new URL(ds._id.toString(), relative);

    await mkdir(storePath, { recursive: true }).catch(error => { console.error(error); throw error; });
    await Promise.all(files.map(
        async file => writeFile(storePath.pathname + osPath.sep + file.name, Buffer.from(await file.arrayBuffer())))
    ).then(() => console.log('file copied'));
}
