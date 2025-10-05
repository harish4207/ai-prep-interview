const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const multer = require('multer');
const pdfParse = require('pdf-parse');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
console.log('Gemini API Key:', GEMINI_API_KEY ? '[set]' : '[NOT SET]');
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Multer setup for PDF upload (increase file size limit to 10MB)
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Upload resume and extract text
router.post('/upload-resume', upload.single('resume'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const data = await pdfParse(req.file.buffer);
    res.json({ text: data.text });
  } catch (err) {
    console.error('PDF parse error:', err); // Add detailed logging
    res.status(500).json({ error: 'Failed to parse PDF' });
  }
});

// Randomly select context for question
function pickContext({ resumeText, topic, previousAnswers }) {
  const options = [];
  if (resumeText) options.push('resume');
  if (topic) options.push('topic');
  if (previousAnswers && previousAnswers.length > 0) options.push('previous');
  if (options.length === 0) return 'topic';
  return options[Math.floor(Math.random() * options.length)];
}

// IMPORTANT: Make sure @google/generative-ai is up to date for Gemini 1.5 support
// npm install @google/generative-ai@latest
router.post('/question', async (req, res) => {
  const { topic, previousAnswers, resumeText } = req.body;
  const contextType = pickContext({ resumeText, topic, previousAnswers });
  let prompt = '';
  if (contextType === 'resume') {
    prompt = `
      You are a highly experienced technical interviewer for a ${topic} position.
      The candidate's resume is below:
      -----
      ${resumeText}
      -----
      Ask a challenging, relevant, and non-generic interview question that tests their real knowledge or experience, based on their resume.
      Do NOT ask about things not present in the resume.
      Only output the question, nothing else.
    `;
  } else if (contextType === 'previous') {
    prompt = `
      You are a highly experienced technical interviewer for a ${topic} position.
      The candidate previously answered: "${previousAnswers[previousAnswers.length - 1]}".
      Based on their answer, ask a deeper or follow-up question to test their understanding.
      Only output the question, nothing else.
    `;
  } else {
    prompt = `
      You are a highly experienced technical interviewer for a ${topic} position.
      Ask a challenging, relevant, and non-generic interview question for this role.
      Only output the question, nothing else.
    `;
  }
  console.log('Gemini prompt:', prompt);
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const question = result.response.text();
    console.log('Gemini question generated');
    res.json({ question });
  } catch (err) {
    console.error('Gemini API error:', err?.message || err);
    res.status(500).json({ error: 'Failed to generate question.', details: err.message });
  }
});

// Generate interview performance report
router.post('/report', async (req, res) => {
  const { topic, qaPairs, engagementAnalysis } = req.body;
  let qaText = qaPairs.map((qa, i) => `Q${i+1}: ${qa.question}\nA${i+1}: ${qa.answer}`).join('\n');
  
  // Process engagement data
  let engagementSummary = '';
  if (engagementAnalysis) {
    const emotions = engagementAnalysis.engagementLog.map(log => log.emotion);
    const attentionStates = engagementAnalysis.engagementLog.map(log => log.attention);
    const dominantEmotion = mode(emotions);
    const attentionPercentage = (attentionStates.filter(state => state === 'focused').length / attentionStates.length) * 100;
    
    engagementSummary = `
    \nEngagement Analysis:
    - Dominant Emotion: ${dominantEmotion || 'Neutral'}
    - Attention Level: ${attentionPercentage.toFixed(1)}% focused during interview
    - Eye Contact: ${attentionPercentage > 80 ? 'Excellent' : attentionPercentage > 60 ? 'Good' : 'Needs Improvement'}`;
  }

  const prompt = `
    You are a senior technical interviewer. Here are 10 interview questions and the candidate's answers for a ${topic} position:
    ${qaText}
    
    Additional Behavioral Analysis:${engagementSummary}

    Please provide a detailed, constructive report on the candidate's performance, including:
    1. Technical assessment based on their answers
    2. Communication and behavioral analysis based on the engagement data
    3. Specific strengths and weaknesses
    4. Areas for improvement
    5. Clear recommendation

    Be specific, professional, and constructive. Only output the report, nothing else.
  `;
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const report = result.response.text();
    console.log('Gemini report generated');
    res.json({ report });
  } catch (err) {
    console.error('Gemini API error (report):', err?.message || err);
    res.status(500).json({ error: 'Failed to generate report.', details: err.message });
  }
});

// Helper function to find the most frequent value in an array
function mode(array) {
  if (array.length === 0) return null;
  return array.sort((a,b) =>
    array.filter(v => v === a).length - array.filter(v => v === b).length
  ).pop();
}

module.exports = router;