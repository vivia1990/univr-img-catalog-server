import DataSet from '../../models/DataSet.js';
import Image from '../../models/Image.js';
import { BaseRepository, ModelWithId } from './BaseRepository.js';

export type ImageFk = Image & {
    dataset?: Partial<DataSet>[]
};

export interface IImageRepository<IDKEY extends string, IDTYPE extends object>
extends BaseRepository<Image, IDKEY, IDTYPE> {
    dataset(idDataset: string): Promise<ModelWithId<Partial<PropertiesOnly<DataSet>>, IDKEY, IDTYPE>>
    checkTag(tagName: string, image: Image): Promise<boolean>
}
