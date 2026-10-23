// Scripts run outside Next, so load .env ourselves (Node 20.12+).
try {
  process.loadEnvFile('.env');
} catch {
  // no .env: fine for scripts that need no credentials
}
