console.log("staing the server")
require('dotenv').config();
console.log("jwt token" + process.env.JWT_SECRET)
const express = require('express')
const app = express();

const cors = require("cors")
const path = require("path")

const connectDB = require('./configures/database');
console.log('fool');

console.log('idiot')

// connectDB()
console.log("moron")
const authRoutes = require("./routes/authRoutes")
const sessionRoutes = require("./routes/sessionRoutes")
const questionRoutes = require("./routes/questionRoutes")
const interviewRoutes = require("./routes/interviewRoutes");
const {generateInterviewQuestions , generateConceptExplanation} = require("./controllers/aiController")
const { protect } =  require('./middlewares/authMiddleware');
// middlewares to handle cors 
app.use(
    cors({
        origin : "*",
        methods : ["GET" , "POST" , "PUT" , "DELETE"],
        allowedHeaders : ["Content-Type" , "Authorization"],
    })
);

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));


// routes 
app.use("/api/auth" , authRoutes);
app.use("/api/Sessions" , sessionRoutes)
app.use("/api/questions" , questionRoutes)
app.use("/api/interview", interviewRoutes);

app.post("/api/ai/generate-questions" , protect,generateInterviewQuestions)
app.use("/api/ai/generate-explanation" , protect,generateConceptExplanation)

// server uploads folder

app.use("/uploads",express.static(path.join(__dirname,"uploads"),{}))
connectDB();

const PORT = process.env.PORT || 5000
// app.listen(PORT,()=> console.log(`Server running on port ${PORT}`))

  // await connectDB();


  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));



