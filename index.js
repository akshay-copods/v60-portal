const express = require("express");
const fileUpload = require("express-fileupload");
const pdfParse = require("pdf-parse");
const  Anthropic = require('@anthropic-ai/sdk');
var bodyParser = require('body-parser')

require('dotenv').config()
const app = express();
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
const CLAUDE_MODEL ="claude-3-haiku-20240307"
const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY, // defaults to process.env["ANTHROPIC_API_KEY"]
  });
  async function callClaude(text) {
    const prompt =  `Create 2 training modules, where each module should be at max 50 words from this text ${text}`
    const msg = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      });
      console.log(msg);
      return msg;
  }
  const MODULE_JSON = `
  {
    "machineName": "Name of the machine on which the content is based",
    "modules": [
      {
        "id": "module index",
        "moduleName": "Name of the module",
        "estimatedTime": "estimated time in minutes to complete the module",
        "totalTopics": "total number of topics in the module",
        "shortModuleDescription": "short description of the module",
        "ModuleContent": [
          {
            "id": "ModuleContent index",
            "title": "Title of the topic",
            "titleDescription": "One liner description of the topic",
            "image": "image url related to the topic",
            "content": "This is the content of the module broken down into smaller parts, must have minimum 200 words"
          }
        ],
        
      }
    ]
  }
  `
  const ASSESSMENT_JSON =`{ 
  "assessment": {
    "moduleName": "module name",
    "estimatedTime": "estimated time in minutes to complete the assessment",
    "questions": [
      {
        "id": "questions index",
        "question": "Question",
        "difficulty": "easy/medium/hard",
        "info": "additional information about the answer, will use this when user has selected the correct answer, this will be shown as a info",
        "options": [
          { "id": "unique id", "option": "Option 1" },
          { "id": "unique id", "option": "Option 2" },
          { "id": "unique id", "option": "Option 3" },
          { "id": "unique id", "option": "Option 4" }
        ],
        "answer": "Correct option id"
      }
    ]
  }
}`
 
  async function callClaudeForJson(text) {
    const prompt = `Convert the given content into JSON format. JSON format should be in the following structure: ${MODULE_JSON}
    Just return JSON and don't send any other message.
     
    Here is the text to convert in JSON: ${text}`
    const msg = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      });
      console.log(msg);
      return msg;
  }
  async function callClaudeForAssessment(text) {
    const prompt = `Create an mcq assessment for each module in the given content. JSON format should be in the following structure: ${ASSESSMENT_JSON}
    Just return JSON and don't send any other message.
    Here is the text to convert in JSON: ${text}`
    const msg = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      });
      console.log(msg);
      return msg;
  }
app.use("/", express.static("public"));
app.use(fileUpload());
app.post("/extract-text", (req, res) => {
    if (!req.files && !req.files.pdfFile) {
        res.status(400);
        res.end();
    }

    pdfParse(req.files.pdfFile).then(result => {
        callClaude(result.text).then((msg) => {
        res.send(msg.content[0].text);});
    });
});
app.post("/extract-json", (req, res) => {
  
const text = req.body.extractedText;
        callClaudeForJson(text).then((msg) => {
        res.send(JSON.parse(msg.content[0].text))
    });
});

app.post("/extract-assessment", (req, res) => {
     console.log("0000000",req.body); 
     const text = req.body.extractedModule;

                callClaudeForAssessment(text).then((msg) => {
                res.send(JSON.parse(msg.content[0].text))
          });
     }
);

app.listen(3000);