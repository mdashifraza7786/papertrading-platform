import mongoose from 'mongoose';

const WalletSchema = new mongoose.Schema({
    email: String,
    balance: String,
});

// Export the model
export const UserWallet = mongoose.models.Wallet || mongoose.model('Wallet', WalletSchema);

export const getWalletByEmail = async (email: string): Promise<any | null> => {
    try {
        return await UserWallet.findOne({ email }).exec();
    } catch (error) {
        console.error('Error fetching wallet by email:', error);
        return null;
    }
};

