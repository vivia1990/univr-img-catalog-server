import { BaseRepository } from './BaseRepository.js';
import { IDataSetRepository } from './DataSetRepository.js';
import { IUserRepository } from './UserRepository.js';
import { IImageRepository } from './ImageRepository.js';

interface Record {
    [key: string]: unknown;
}

export interface IDBFactory<IDKEY extends string, IDTYPE extends object> {
    createUserRepo(withRelations: boolean): IUserRepository<IDKEY, IDTYPE>;
    createDataSetRepo(withRelations: boolean): IDataSetRepository<IDKEY, IDTYPE>;
    createImageRepo(withRelations: boolean): IImageRepository<IDKEY, IDTYPE>;
    createModelRepo<T extends Record>(table: string): BaseRepository<T, IDKEY, IDTYPE>;
}
