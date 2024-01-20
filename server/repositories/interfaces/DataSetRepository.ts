import DataSet from '../../models/DataSet.js';
import UserSchema from '../../models/User.js';
import { BaseRepository, ModelWithId, PropertiesOnly, QueryFilter } from './BaseRepository.js';
import { IDBFactory } from './DBFactory.js';

type User = PropertiesOnly<UserSchema>;

export type DataSetFk = DataSet & {
    users?: Partial<User>[]
};

export interface IDataSetRepository<IDKEY extends string, IDTYPE extends object>
extends BaseRepository<PropertiesOnly<DataSet>, IDKEY, IDTYPE> {
    users(dsRepo: IDBFactory<IDKEY, IDTYPE>, idDataset: IDTYPE, query?: Partial<QueryFilter<User>>):
        Promise<ModelWithId<Partial<User>, IDKEY, IDTYPE>[]>
}
