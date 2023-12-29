import { Db, MongoClient } from 'mongodb';

export default class Mongo {
    protected connection: MongoClient;
    public db: Db;
    protected readonly uri: string;
    constructor (uri: string, dbName: string) {
        this.uri = uri;
        this.connection = new MongoClient(this.uri);
        this.db = this.connection.db(dbName);
    }

    connect (): Promise<Mongo> {
        return this.connection.connect()
            .catch(error => {
                console.error(error);
                return new Error(`Errore connessione db${this.uri}`);
            }).then(() => this);
    }

    getConnection (): MongoClient {
        return this.connection;
    }
}
