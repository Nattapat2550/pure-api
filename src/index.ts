import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

app.listen(env.port, '0.0.0.0', () => {
  console.log(`pure-api listening on port ${env.port}`);
});
