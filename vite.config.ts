import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function scheduleApiPlugin(): Plugin {
  return {
    name: 'schedule-api-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/save-schedule' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const srcTarget = path.resolve(__dirname, 'src/data/scheduleData.json');
              const publicTarget = path.resolve(__dirname, 'public/schedule.json');

              fs.mkdirSync(path.dirname(srcTarget), { recursive: true });
              fs.writeFileSync(srcTarget, JSON.stringify(data, null, 2), 'utf-8');

              fs.mkdirSync(path.dirname(publicTarget), { recursive: true });
              fs.writeFileSync(publicTarget, JSON.stringify(data, null, 2), 'utf-8');

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  success: true,
                  message:
                    'Horarios guardados directamente en el código de la aplicación (src/data/scheduleData.json)',
                }),
              );
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  success: false,
                  error: err.message || 'Error al guardar los horarios',
                }),
              );
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), scheduleApiPlugin()],
});
