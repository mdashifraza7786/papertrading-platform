import mongoose from 'mongoose';

const MONGODBURI = "mongodb+srv://mdashifraza222jj:mraH6HF3gYJQ8t0f@papertradingcluster.rrxcgoy.mongodb.net/papertrading";

const connectDB = async (): Promise<void | any> => {
    if (mongoose.connections[0].readyState) {
        return true;
    }

    try {
        await mongoose.connect(MONGODBURI as string);
        console.log('MongoDB connected');
        return true;
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);

    }
};

export default connectDB;