import { BaseRepository } from './BaseRepository.js';
import { IDataSetRepository } from './DataSetRepository.js';
import { IUserRepository } from './UserRepository.js';

interface Record {
    [key: string]: unknown;
}

export interface DBFactory<IDKEY extends string, IDTYPE extends object> {
    createUserRepo(): IUserRepository<IDKEY, IDTYPE>;
    createDataSetRepo(): IDataSetRepository<IDKEY, IDTYPE>;
    createModelRepo<T extends Record>(table: string): BaseRepository<T, IDKEY, IDTYPE>;
}
