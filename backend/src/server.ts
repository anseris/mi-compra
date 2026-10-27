import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/database.js';
import { crearCategoriasPorDefecto } from './services/datos-iniciales.service.js';

const port = Number(process.env['PORT'] ?? 3000);

/** Variables sin las que el backend no puede funcionar correctamente. */
const VARIABLES_OBLIGATORIAS = ['MONGODB_URI'] as const;

function validarVariablesEntorno(): void {
  const faltantes = VARIABLES_OBLIGATORIAS.filter((nombre) => !process.env[nombre]);

  if (faltantes.length > 0) {
    throw new Error(
      `Faltan variables de entorno obligatorias: ${faltantes.join(', ')}. ` +
        'Configúralas en backend/.env.',
    );
  }
}

async function startServer(): Promise<void> {
  validarVariablesEntorno();

  await connectDatabase();

  // La aplicación no tiene cuentas: las categorías iniciales se crean una sola vez.
  await crearCategoriasPorDefecto();

  app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor de Mi compra iniciado en http://localhost:${port}`);
  });
}

startServer().catch((error: unknown) => {
  console.error('Error al iniciar el servidor:', error);
  process.exit(1);
});
