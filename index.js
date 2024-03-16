const express = require("express");
const fileUpload = require("express-fileupload");
const pdfParse = require("pdf-parse");
const  Anthropic = require('@anthropic-ai/sdk');
var bodyParser = require('body-parser')

require('dotenv').config()
const app = express();
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY, // defaults to process.env["ANTHROPIC_API_KEY"]
  });
  async function callClaude(text) {
    const prompt =  `Create 5 training modules, where each module should be at least 400 words from this text ${text}`
    const msg = await anthropic.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 2500,
        messages: [{ role: "user", content: "Hi" }],
      });
      console.log(msg);
      return msg;
  }
  async function callClaudeForJson(text) {
    const prompt = `Convert the given content into JSON format. As per the json format generate few mcq type questions related to content for each module. JSON format should be in the following structure:
    Just return JSON and don't send any other message.
    {
    machineName: "Name of the machine on which the content is based",
    modules:[
    {
    id:"module index",
    moduleName: "Name of the module, dont add Training module 1 or 2 at start",
    estimatedTime: "estimated time in minutes to complete the module",
    totalTopics: "total number of topics in the module",       
    shortModuleDescription: "short description of the module",       
    ModuleContent: [
    {
    id:"ModuleContent index",
    title: "Title of the topic",
    titleDescription: "One liner description of the topic"       
    image: "image url related to the topic",       
    content: "This is the content of the module broken down into smaller parts, must have minimum 200 words"
    }
    ],
    assessment: {
    estimatedTime: "estimated time in minutes to complete the assessment",
    questions: [
    {
    id: "questions index",
    question: "Question",
    difficulty: "easy/medium/hard",
    info: "additional information about the answer, will use this when user has selected the correct answer, this will be shown as a info",
    options: [
    { id: "unique id", option: "Option 1" },
    { id: "unique id", option: "Option 2" },
    { id: "unique id", option: "Option 3" },
    { id: "unique id", option: "Option 4" },
    ],
    answer: "Correct option id",
    },
    ];
    }
    }
    ]
    } 
    Here is the text to convert in JSON: ${text}`
    const msg = await anthropic.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 2500,
        messages: [{ role: "user", content: text }],
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

app.listen(3000);