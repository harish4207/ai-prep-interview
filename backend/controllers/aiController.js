
const { conceptExplainPrompt, questionAnswerPrompt } = require("../utils/prompts");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @desc    Generate interview questions and answers using Gemini
// @route   POST /api/ai/generate-questions
// @access  Private
const generateInterviewQuestions = async (req, res) => {
  try {
    const { role, experience, topicsToFocus, numberOfQuestions } = req.body;

    if (!role || !experience || !topicsToFocus || !numberOfQuestions) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const prompt = questionAnswerPrompt(role, experience, topicsToFocus, numberOfQuestions);

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text();
    // Optional: Clean the output if wrapped in ```json
    const cleanedText = rawText
      .replace(/^```json\s*/, "")
      .replace(/```$/, "")
      .trim();
     
//       data.forEach((item) => {
//   item.answer = item.answer
//     .replace(/\n{2,}/g, '\n')         // Remove double newlines
//     .replace(/\n/g, ' ')              // Replace all newlines with space
//     .replace(/\*\*/g, '')             // Remove markdown bold
//     .replace(/^\s*\*\s*/gm, '')       // Remove bullet point asterisks at the beginning of lines
//     .replace(/\s+/g, ' ')             // Normalize multiple spaces
//     .trim();
// });
//     Parse JSON safely
    const data = JSON.parse(cleanedText);






    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      message: "Failed to generate questions",
      error: error.message,
    });
  }
};
/**
 * @desc    Generate explains a interview question
 * @route   POST /api/ai/generate-explanation
 * @access  Private
 */
const generateConceptExplanation = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const prompt = conceptExplainPrompt(question);

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text();

    
    // Optional: Clean the output if wrapped in ```json
    const cleanedText = rawText
      .replace(/^```json\s*/, "")
      .replace(/```$/, "")
      .trim();

    // Parse JSON safely
    const data = JSON.parse(cleanedText);

// data.forEach((item) => {
//   item.answer = item.answer
//     .replace(/\n{2,}/g, '\n')         // Remove double newlines
//     .replace(/\n/g, ' ')              // Replace all newlines with space
//     .replace(/\*\*/g, '')             // Remove markdown bold
//     .replace(/^\s*\*\s*/gm, '')       // Remove bullet point asterisks at the beginning of lines
//     .replace(/\s+/g, ' ')             // Normalize multiple spaces
//     .trim();
// });


    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      message: "Failed to generate questions",
      error: error.message,
    });
  }
};


module.exports = { generateInterviewQuestions, generateConceptExplanation };
