export type ModelWithId<T, ID extends string, TYPE extends object> = Omit<T, ID> & { [key in ID]: TYPE };

/**
 * Ritorna i record inseriti, e gli eventuali record non inseriti nella chiave failed
 */
export type InsertedMany<T, IDKEY extends string, IDTYPE extends object> = {
    inserted: ModelWithId<T, IDKEY, IDTYPE>[];
    failed: T[];
};

export interface Writer<T, IDKEY extends string, IDTYPE extends object> {
    insert(item: T): Promise<ModelWithId<T, IDKEY, IDTYPE>>;
    insertMany(items: T[]): Promise<InsertedMany<T, IDKEY, IDTYPE>>;
    updateById(id: string, item: Partial<T>): Promise<boolean | Error>;
    deleteById(id: string): Promise<boolean | Error>;
    deleteMany(item: unknown): Promise<number | Error>
}

export interface Reader<T, IDKEY extends string, IDTYPE extends object> {
    find(item: unknown): Promise<ModelWithId<T, IDKEY, IDTYPE> | null>;
    findAll(item: unknown): Promise<ModelWithId<T, IDKEY, IDTYPE>[]>;
}

export type BaseRepository<T, IDKEY extends string, IDTYPE extends object> = Writer<T, IDKEY, IDTYPE> & Reader<T, IDKEY, IDTYPE>;

export interface Model {
    getTableName(): string;
}

export default abstract class ModelRepository<IDKEY extends string> {
    abstract createModelRepo<T extends Model>(model: string): BaseRepository<T, IDKEY, object>;
}
