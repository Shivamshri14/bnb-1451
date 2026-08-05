import mongoose, { Schema, Document, Model } from "mongoose";

export interface IExpense extends Document {
  title: string;
  amount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema: Schema<IExpense> = new Schema(
  {
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    createdBy: { type: String, required: true, trim: true, default: "Owner" },
  },
  { timestamps: true }
);

ExpenseSchema.index({ createdAt: -1 });

if (mongoose.models.Expense) {
  delete mongoose.models.Expense;
}

const Expense: Model<IExpense> = mongoose.model<IExpense>("Expense", ExpenseSchema);

export default Expense;
