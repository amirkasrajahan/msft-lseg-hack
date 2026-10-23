import './_env';
import { generateText } from 'ai';
import { chatModel, embedTexts } from '../src/lib/llm';

/** Smoke test for the Azure portal credentials: one chat call and one embedding call. */
async function main() {
  const { text } = await generateText({ model: chatModel(), prompt: 'Reply with the single word: ok' });
  console.log('chat:', text.trim());
  const [vec] = await embedTexts(['climate change']);
  console.log('embedding length:', vec.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
