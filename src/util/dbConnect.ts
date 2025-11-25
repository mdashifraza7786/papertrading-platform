import mongoose from 'mongoose';

const MONGODBURI = process.env.MONGODB_URI;

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