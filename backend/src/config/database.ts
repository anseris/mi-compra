import mongoose from 'mongoose';

/**
 * Abre la conexión con MongoDB.
 * La URI se configura en `.env` mediante `MONGODB_URI`.
 */
export async function connectDatabase(): Promise<void> {
  const uri = process.env['MONGODB_URI'];

  if (!uri) {
    throw new Error('Falta configurar MONGODB_URI en .env');
  }

  await mongoose.connect(uri);

  console.log('Conexión con MongoDB establecida');
}
