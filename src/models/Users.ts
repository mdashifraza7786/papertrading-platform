import mongoose from 'mongoose';

// Define the user schema
const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
});

// Create the user model based on the schema
export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);




export const getUserByEmail = async (email: string): Promise<any | null> => {
    try {
        return await UserModel.findOne({ email }).exec();
    } catch (error) {
        console.error('Error fetching user by email:', error);
        return null;
    }
};
