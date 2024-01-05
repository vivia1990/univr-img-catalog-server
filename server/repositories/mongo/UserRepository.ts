import Mongo from '../../db/Mongo.js';
import { User } from '../../models/User.js';
import MongoRepository from './MongoRepository.js';

export default class UserRepository extends MongoRepository<User> {
    constructor (mongoDatabase: Mongo) {
        super(mongoDatabase, User.tableName);
    }
}
