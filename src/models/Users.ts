import mongoose, { Schema, Document, Model } from 'mongoose';

export interface UserDocument extends Document {
    name: string;
    email: string;
    password: string;
    balance: number;
}

const UserSchema: Schema<UserDocument> = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 100000 }
});

export const UserModel: Model<UserDocument> = mongoose.models.User || mongoose.model<UserDocument>('User', UserSchema);


export const getUserByEmail = async (email: string): Promise<any | null> => {
    try {
        return await UserModel.findOne({ email }).exec();
    } catch (error) {
        console.error('Error fetching user by email:', error);
        return null;
    }
};

export const getBalanceByEmail = async (email: string): Promise<any | null> => {
    try {
        return await UserModel.findOne({ email }).exec();
    } catch (error) {
        console.error('Error fetching user by email:', error);
        return null;
    }
};

export const updateWalletBalance = async (email: string, tominus: number): Promise<boolean> => {
    try {
        
        const user = await UserModel.findOne({ email }).exec();
        if (!user) {
            throw new Error(`User not found with email: ${email}`);
        }

        
        if (user.balance >= tominus) {
            user.balance -= tominus;
            await user.save();
            return true; 
        } else {
            throw new Error('Insufficient balance');
        }
    } catch (error) {
        console.error('Error updating balance:', error);
        return false; 
    }
};