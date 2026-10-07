const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: 'process.env.GROQ_API_KEY' });
const prompt = 'Respond ONLY with a valid JSON object matching exactly this schema: { \"direction\": \"UP\", \"confidence\": 90, \"reason\": \"Test\" }';
async function test() {
  const start = Date.now();
  try {
    await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai/gpt-oss-120b',
      response_format: { type: 'json_object' }
    });
    console.log('120b took', Date.now() - start, 'ms');
  } catch(e) { console.error('120b failed:', e.message); }
  
  const start2 = Date.now();
  try {
    await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'qwen/qwen3.8-27b',
      response_format: { type: 'json_object' }
    });
    console.log('27b took', Date.now() - start2, 'ms');
  } catch(e) { console.error('27b failed:', e.message); }
}
test();
