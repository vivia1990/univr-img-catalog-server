import { BaseRepository } from './BaseRepository.js';
import { IDataSetRepository } from './DataSetRepository.js';
import { IUserRepository } from './UserRepository.js';
import { IImageRepository } from './ImageRepository.js';

interface Record {
    [key: string]: unknown;
}

export interface IDBFactory<IDKEY extends string, IDTYPE extends object> {
    createUserRepo(): IUserRepository<IDKEY, IDTYPE>;
    createDataSetRepo(): IDataSetRepository<IDKEY, IDTYPE>;
    createImageRepo(): IImageRepository<IDKEY, IDTYPE>;
    createModelRepo<T extends Record>(table: string): BaseRepository<T, IDKEY, IDTYPE>;
}
