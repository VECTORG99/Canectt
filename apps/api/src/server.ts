import { createApp } from './app';
import { env } from './env';

const app = createApp();

app.listen(env.API_PORT, () => {
  console.info(`Canectt API escuchando en http://localhost:${env.API_PORT}`);
});
