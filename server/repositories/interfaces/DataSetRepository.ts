import DataSet from '../../models/DataSet.js';
import UserSchema from '../../models/User.js';
import { BaseRepository, PaginationResult, PropertiesOnly, QueryFilter } from './BaseRepository.js';

type User = PropertiesOnly<UserSchema>;

export type DataSetFk = DataSet & {
    users?: Partial<User>[]
};

export interface IDataSetRepository<IDKEY extends string, IDTYPE extends object>
extends BaseRepository<PropertiesOnly<DataSet>, IDKEY, IDTYPE> {
    users(idDataset: IDTYPE, query?: QueryFilter<User>):
    Promise<PaginationResult<User, IDKEY, IDTYPE>>
}
