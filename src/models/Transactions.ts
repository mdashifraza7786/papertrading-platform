import mongoose, { Schema, Document, Model } from 'mongoose';

export interface TransactionsDocument extends Document {
    email: string;
    uniqueid: number;
    quantity: any;
    price: any;
    actiontype: string;
    symbol: string;
    sellat: any;
}

const TransactionSchema: Schema<TransactionsDocument> = new Schema({
    email: { type: String, required: true },
    uniqueid: { type: Number, required: true },
    quantity: { type: Schema.Types.Decimal128, required: true },
    price: { type: Schema.Types.Decimal128, required: true },
    actiontype: { type: String, required: true },
    symbol: { type: String, required: true },
    sellat: { type: Schema.Types.Decimal128, required:true, default:0 }, 
});

export const TransactionModel: Model<TransactionsDocument> = mongoose.models.Transaction || mongoose.model<TransactionsDocument>('Transaction', TransactionSchema);
