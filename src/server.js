require('dotenv').config();
const app = require('./app');
const seed = require('./data/seed');

const PORT = process.env.PORT || 4000;

async function start() {
  if (process.env.SEED_ON_BOOT !== 'false') {
    await seed();
  }
  app.listen(PORT, () => {
    console.log(`Kirana Marketplace API listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
