import DataSet from '../../models/DataSet.js';
import { User } from '../../models/User.js';
import { BaseRepository, ModelWithId } from './BaseRepository.js';

export type DataSetFk = DataSet & {
    users?: Partial<User>[]
};

export interface IDataSetRepository<IDKEY extends string, IDTYPE extends object>
extends BaseRepository<DataSet, IDKEY, IDTYPE> {
    users(): Promise<ModelWithId<Partial<User>, IDKEY, IDTYPE>[]>
}
