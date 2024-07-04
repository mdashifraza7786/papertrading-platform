import mongoose, { Schema, Document, Model } from 'mongoose';

// Define the interface for User document
export interface UserDocument extends Document {
    name: string;
    email: string;
    password: string;
    balance: number;
}

// Define the schema for the User model
const UserSchema: Schema<UserDocument> = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 10000 }
});

// Create the User model based on the schema
export const UserModel: Model<UserDocument> = mongoose.models.User || mongoose.model<UserDocument>('User', UserSchema);


export const getUserByEmail = async (email: string): Promise<any | null> => {
    try {
        return await UserModel.findOne({ email }).exec();
    } catch (error) {
        console.error('Error fetching user by email:', error);
        return null;
    }
};
