/**
 * mongodb connection
 */

import mongoose from 'mongoose';
const mongo_url = process.env.MONGO_URL || 'mongodb://localhost:27017/shopify_app'
const dbConnect = async() => {
    return mongoose.connect(mongo_url, {
        keepAlive: 1,
        useNewUrlParser: true,
        useUnifiedTopology: true
    },(err) => {
        if (!err) {
            console.log('MongoDB Connection Succeeded.')
        } else {
            console.log('Error in DB connection: ' + err)
        }
    });
}

export default dbConnect;

