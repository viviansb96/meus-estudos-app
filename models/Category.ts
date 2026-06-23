import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  userId: string; // ID do Clerk
}

const CategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    userId: { type: String, required: true },
  },
  { timestamps: true } // Cria campos de data de criação e atualização automaticamente
);

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);