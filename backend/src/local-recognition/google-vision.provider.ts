// backend/src/localRecognition/google-vision.provider.ts
import { Provider } from '@nestjs/common';
import * as vision from '@google-cloud/vision';
import { existsSync } from 'fs';
import { join } from 'path';

// Este token se usará para inyectar el cliente
export const GOOGLE_VISION_CLIENT = 'GOOGLE_VISION_CLIENT';

export const googleVisionProvider: Provider = {
  provide: GOOGLE_VISION_CLIENT,
  useFactory: () => {
    // Preferimos credenciales explícitas para evitar el intento de consulta
    // al servidor de metadatos de GCP (que genera "MetadataLookupWarning" en local).
    // 1) Si el usuario define GOOGLE_APPLICATION_CREDENTIALS o GOOGLE_APPLICATION_CREDENTIALS_PATH, usarlo.
    // 2) Si no, intentar con el archivo local del proyecto: backend/google-vision-credentials.json

    const envPath =
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS_PATH;

    // Resolver una ruta por defecto robusta según el cwd.
    // Normalmente "npm run start:dev" se ejecuta desde /backend, así que el archivo está en cwd/google-vision-credentials.json
    const defaultPathCandidates = [
      join(process.cwd(), 'google-vision-credentials.json'),
      join(process.cwd(), 'backend', 'google-vision-credentials.json'),
    ];

    const resolvedPath = (() => {
      if (envPath && existsSync(envPath)) return envPath;
      for (const p of defaultPathCandidates) {
        if (existsSync(p)) return p;
      }
      // Si no encontramos credenciales, devolvemos el cliente sin keyFilename.
      // Esto puede funcionar si el entorno ya está autenticado; de lo contrario,
      // el primer uso devolverá un error más claro.
      return undefined;
    })();

    return resolvedPath
      ? new vision.ImageAnnotatorClient({ keyFilename: resolvedPath })
      : new vision.ImageAnnotatorClient();
  },
};
