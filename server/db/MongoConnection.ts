import Mongo from './drivers/Mongo.js';

type ConnectionObj = {
    name: string,
    address: string,
    user: string,
    passw: string,
    port: string | number,
};

export default class MongoConnection {
    private static connectionString: string;
    private static params: ConnectionObj;
    private static connection: Mongo | null = null;

    private constructor () {
    }

    private static parseParams (params: ConnectionObj) {
        return `mongodb://${params.user}:${params.passw}@${params.address}:${params.port}/`;
    }

    static setConnectionParams (params: ConnectionObj) {
        MongoConnection.params = { ...params };
        MongoConnection.connectionString = MongoConnection.parseParams(MongoConnection.params);
    }

    static async initConnection () {
        const connection = await Promise.race([
            new Mongo(MongoConnection.connectionString, MongoConnection.params.name)
                .connect(),
            new Promise<Mongo>((resolve, reject) => setTimeout(() => reject(new Error('connection timeout')), 10000))
        ]).catch(error => { throw error; });

        MongoConnection.connection = connection;
    }

    static async getConnection (): Promise<Mongo> {
        if (MongoConnection.connection === null) {
            await MongoConnection.initConnection();
        }

        return MongoConnection.connection as Mongo;
    }

    static async closeConnection () {
        await MongoConnection.connection?.getConnection().close();
        MongoConnection.connection = null;
    }

    toString () :string {
        return MongoConnection.connectionString;
    }
}
