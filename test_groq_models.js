const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: 'process.env.GROQ_API_KEY' });
groq.models.list().then(res => console.log(res.data.map(m => m.id))).catch(console.error);
