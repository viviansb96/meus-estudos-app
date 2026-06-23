import mongoose, { Schema, Document } from 'mongoose';

export interface IStudySession extends Document {
  userId: string;
  contentId: mongoose.Types.ObjectId; // Vincula a sessão ao conteúdo (ex: ZTDE)
  durationInSeconds: number;          // Tempo exato que o timer rodou
  createdAt: Date;                    // O timestamps vai registrar o dia exato do estudo
}

const StudySessionSchema: Schema = new Schema(
  {
    userId: { type: String, required: true },
    contentId: { type: Schema.Types.ObjectId, ref: 'Content', required: true },
    durationInSeconds: { type: Number, required: true },
  },
  { timestamps: true } // Controlará o calendário e gráficos usando o campo 'createdAt'
);

export default mongoose.models.StudySession || mongoose.model<IStudySession>('StudySession', StudySessionSchema);