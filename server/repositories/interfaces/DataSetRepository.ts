import DataSet from '../../models/DataSet.js';
import Image from '../../models/Image.js';
import UserSchema from '../../models/User.js';
import { BaseRepository, PaginationResult, QueryFilter } from './BaseRepository.js';

type User = PropertiesOnly<UserSchema>;

export type DataSetFk = DataSet & {
    users?: Partial<User>[]
};

export interface IDataSetRepository<IDKEY extends string, IDTYPE extends object>
extends BaseRepository<PropertiesOnly<DataSet>, IDKEY, IDTYPE> {
    users<Fields extends keyof User = keyof User>(idDataset: IDTYPE, query?: QueryFilter<User>):
    Promise<PaginationResult<User, Fields, IDKEY, IDTYPE>>
    images<Fields extends keyof Image = keyof Image>(idDataset: IDTYPE, query?: QueryFilter<Image>):
    Promise<PaginationResult<Image, Fields, IDKEY, IDTYPE>>
}
