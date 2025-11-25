import mongoose, { Schema, Document, Model } from 'mongoose';

export interface HoldingDocument extends Document {
    email: string;
    uniqueid: number;
    quantity: any;
    price: any;
    actiontype: string;
    symbol: string;
}

const HoldingSchema: Schema<HoldingDocument> = new Schema({
    email: { type: String, required: true },
    uniqueid: { type: Number, required: true },
    quantity: { type: Schema.Types.Decimal128, required: true },
    price: { type: Schema.Types.Decimal128, required: true },
    actiontype: { type: String, required: true },
    symbol: { type: String, required: true },
});


export const HoldingModel: Model<HoldingDocument> = mongoose.models.Holding || mongoose.model<HoldingDocument>('Holding', HoldingSchema);
