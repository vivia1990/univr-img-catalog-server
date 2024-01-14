import DataSet from '../../models/DataSet.js';
import User from '../../models/User.js';
import { BaseRepository, ModelWithId } from './BaseRepository.js';

export interface IUserRepository<IDKEY extends string, IDTYPE extends object>
extends BaseRepository<User, IDKEY, IDTYPE> {
    datasets(): Promise<ModelWithId<DataSet, IDKEY, IDTYPE>[]>
}
