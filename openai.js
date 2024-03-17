require( "dotenv/config");
const OpenAI = require( "openai")
const openai = new OpenAI({});

exports.openai = openai;