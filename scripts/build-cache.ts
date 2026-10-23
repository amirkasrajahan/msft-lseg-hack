import './_env';

/**
 * Offline builder for data/ethics/{ticker}.json (EthicsRecord).
 * TODO(orchestration): for each company in data/universe.json x CAUSES,
 * fetch news (Google News RSS / GDELT), extract Incident[] + positives with
 * generateStructured, write the file. Must be resumable and concurrency-limited (~4).
 */
console.log('build-cache is not implemented yet');
