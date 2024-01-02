export type ModelWithId<T, ID extends string, TYPE extends object> = Omit<T, ID> & { [key in ID]: TYPE };

export interface Writer<T, IDKEY extends string, IDTYPE extends object> {
    create(item: T): Promise<ModelWithId<T, IDKEY, IDTYPE>>;
    updateById(id: string, item: Partial<T>): Promise<boolean | Error>;
    deleteById(id: string): Promise<boolean | Error>;
}

export interface Reader<T, IDKEY extends string, IDTYPE extends object> {
    find(item: Partial<T>): Promise<ModelWithId<T, IDKEY, IDTYPE> | null>;
    findAll(item: Partial<T>): Promise<ModelWithId<T, IDKEY, IDTYPE>[]>;
}

export type BaseRepository<T, IDKEY extends string, IDTYPE extends object> = Writer<T, IDKEY, IDTYPE> & Reader<T, IDKEY, IDTYPE>;

export interface Model {
    getTableName(): string;
}

export default abstract class ModelRepository<IDKEY extends string> {
    abstract createModelRepo<T extends Model>(model: Model): BaseRepository<T, IDKEY, object>;
}
