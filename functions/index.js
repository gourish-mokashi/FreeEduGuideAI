const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

admin.initializeApp();

const GEMINI_API_KEY = functions.config().gemini.api_key;
const GEMINI_API_URL = "https://api.gemini.example.com/generate";

async function generateRoadmapWithGemini(learningGoals, interests, currentLevel) {
  const payload = {learningGoals, interests, currentLevel};
  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GEMINI_API_KEY}`
    },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }
  return response.json();
}

exports.generateRoadmap = functions.https.onRequest(async (req, res) => {
  try {
    const {learningGoals, interests, currentLevel} = req.body;
    
    if (!learningGoals || !interests || !currentLevel) {
      res.status(400).json({error: "Missing required fields: learningGoals, interests, or currentLevel"});
      return;
    }
    
    let roadmap;
    try {
      roadmap = await generateRoadmapWithGemini(learningGoals, interests, currentLevel);
    } catch (geminiError) {
      console.error("Error in Gemini API generation:", geminiError);
      roadmap = {
        title: "Personalized Learning Roadmap (Fallback)",
        description: "This roadmap was generated using fallback logic.",
        steps: [
          "Step 1: Overview of the subject",
          "Step 2: Intermediate learning materials",
          "Step 3: Advanced topics overview",
        ],
      };
    }
    
    roadmap.userInput = {learningGoals, interests, currentLevel};
    roadmap.createdAt = admin.firestore.FieldValue.serverTimestamp();
    
    const docRef = await admin.firestore().collection("roadmaps").add(roadmap);
    roadmap.id = docRef.id;
    
    res.status(200).json(roadmap);
  } catch (error) {
    console.error("Error generating roadmap:", error);
    res.status(500).json({error: "Internal server error"});
  }
});
