import { MongoClient } from 'mongodb'

if (!process.env.MONGODB_URI) {
    throw new Error('Invalid environment variable: "MONGODB_URI"');
}

const URI = process.env.MONGODB_URI;
const options = {};

const client = new MongoClient(URI, options).connect();
let clientPromise: Promise<MongoClient> = client;

export default clientPromise;