import mongoose, { Schema, Document } from 'mongoose';

export interface IContent extends Document {
  name: string;
  categoryId: mongoose.Types.ObjectId;
  userId: string;
  startDate: Date;
  endDate?: Date;          // Pode ser vazio se estiver em andamento
  certificationDate?: Date; // Data em que passou na prova
  expirationDate?: Date;    // Data de validade da certificação
  investment?: number;      // Valor investido em Reais (R$)
  manualHours?: number;     // Horas inseridas manualmente
  status?: string; // <--- ADICIONE ESTA LINHA AQUI
}

const ContentSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    userId: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    certificationDate: { type: Date },
    expirationDate: { type: Date },
    investment: { type: Number, default: 0 },
    manualHours: { type: Number, default: 0 }, // Novo campo unificado
    status: { type: String, default: 'Em Andamento' }, // <--- ADICIONE ESTA LINHA AQUI
    },
  { timestamps: true }
);

export default mongoose.models.Content || mongoose.model<IContent>('Content', ContentSchema);