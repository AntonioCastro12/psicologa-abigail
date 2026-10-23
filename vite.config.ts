import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function scheduleApiPlugin(): Plugin {
  return {
    name: 'schedule-api-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const isNetlifyFunction = req.url?.startsWith('/.netlify/functions/schedule');
        const isLegacyApi = req.url === '/api/save-schedule';

        if (isNetlifyFunction && req.method === 'GET') {
          try {
            const publicTarget = path.resolve(__dirname, 'public/schedule.json');
            const data = fs.readFileSync(publicTarget, 'utf-8');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(data);
          } catch {
            const srcTarget = path.resolve(__dirname, 'src/data/scheduleData.json');
            const data = fs.readFileSync(srcTarget, 'utf-8');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(data);
          }
          return;
        }

        if ((isNetlifyFunction || isLegacyApi) && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              const data = parsed.schedule || parsed;
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
                  schedule: data,
                  message: '¡Horarios actualizados en la nube y sincronizados!',
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
