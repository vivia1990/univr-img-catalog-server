import { IPaginator, PaginationMetaData } from './Paginator.js';

export type ModelWithId<T, ID extends string, TYPE extends object> = Omit<T, ID> & { [key in ID]: TYPE };

export type PropertiesOnly<T> = Pick<T, { [K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? never : K }[keyof T]>;

declare global {

    type GetReturnType<Type> = Type extends (...args: never[]) => infer Return
        ? Return : never;

}

export type QueryFilter<T> = {
    fields?: {[K in keyof Partial<T>]: 1 | 0};
    filter?: Partial<T>;
    page?: number;
};
/**
 * Ritorna i record inseriti, e gli eventuali record non inseriti nella chiave failed
 */
export type InsertedMany<T, IDKEY extends string, IDTYPE extends object> = {
    inserted: ModelWithId<T, IDKEY, IDTYPE>[];
    failed: T[];
};

export type PaginationResult<T, IDKEY extends string, IDTYPE extends object> = {
    data: ModelWithId<T, IDKEY, IDTYPE>[],
    pagination: PaginationMetaData
}

export interface Writer<T, IDKEY extends string, IDTYPE extends object> {
    insert(item: T): Promise<ModelWithId<T, IDKEY, IDTYPE>>;
    insertMany(items: T[]): Promise<InsertedMany<T, IDKEY, IDTYPE>>;
    updateById(id: string, item: Partial<T>): Promise<boolean>;
    deleteById(id: string): Promise<boolean | Error>;
    deleteMany(item: unknown): Promise<number | Error>
}

export interface Reader<T, IDKEY extends string, IDTYPE extends object> {
    find<Fields extends keyof T = keyof T>(item: unknown, fields?: Fields[]): Promise<ModelWithId<Pick<T, Fields>, IDKEY, IDTYPE> | null>;
    findById<Fields extends keyof T = keyof T>(id: string, fields?: Fields[]): Promise<ModelWithId<Pick<T, Fields>, IDKEY, IDTYPE> | null>;
    findAll<Fields extends keyof T = keyof T>(item: unknown, fields?: Fields[]): Promise<ModelWithId<Pick<T, Fields>, IDKEY, IDTYPE>[]>;
    findAllPaginated<Fields extends keyof T = keyof T>(item: unknown, page: number, fields?: Fields[]): Promise<PaginationResult<T, IDKEY, IDTYPE>>
    setPaginator(paginator: IPaginator): void;
    getPaginator(): IPaginator;
}

export type BaseRepository<T, IDKEY extends string, IDTYPE extends object> = Writer<T, IDKEY, IDTYPE> & Reader<T, IDKEY, IDTYPE>;

export interface Model {
    getTableName(): string;
    validate(): unknown
}
