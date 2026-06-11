import { connect } from 'mongoose';

async function run() {
    const uri = "mongodb+srv://mdashifraza222jj:mraH6HF3gYJQ8t0f@papertradingcluster.rrxcgoy.mongodb.net/papertrading";
    const mongoose = await connect(uri);
    const db = mongoose.connection.db;
    
    const users = await db.collection('users').find({}).toArray();
    console.log("Users:", JSON.stringify(users, null, 2));
    
    const holdings = await db.collection('holdings').find({}).toArray();
    console.log("Holdings:", JSON.stringify(holdings, null, 2));

    process.exit(0);
}
run();
