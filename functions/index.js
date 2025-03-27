const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch'); 

admin.initializeApp();

// Helper function to call the external RAG-based API.
async function generateRoadmapWithRAG(learningGoals, interests, currentLevel) {
  const payload = { learningGoals, interests, currentLevel };
  // Replace this URL with your actual RAG API endpoint.
  const response = await fetch("https://your-rag-api-endpoint.com/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    throw new Error(`RAG API error: ${response.statusText}`);
  }
  return response.json();
}

exports.generateRoadmap = functions.https.onRequest(async (req, res) => {
  try {
    const { learningGoals, interests, currentLevel } = req.body;
    
    // Input validation
    if (!learningGoals || !interests || !currentLevel) {
      res.status(400).json({ error: "Missing required fields: learningGoals, interests, or currentLevel" });
      return;
    }
    
    let roadmap;
    try {
      // Attempt to generate a personalized roadmap using the RAG-based LLM
      roadmap = await generateRoadmapWithRAG(learningGoals, interests, currentLevel);
    } catch (ragError) {
      console.error("Error in RAG generation:", ragError);
      // Fallback logic if the RAG API call fails.
      roadmap = {
        title: "Personalized Learning Roadmap (Fallback)",
        description: "This roadmap was generated using fallback logic.",
        steps: [
          "Step 1: Overview of the subject",
          "Step 2: Intermediate learning materials",
          "Step 3: Advanced topics overview"
        ]
      };
    }
    
    // Enrich the roadmap with user input details for traceability.
    roadmap.userInput = { learningGoals, interests, currentLevel };

    // Optionally, add timestamps or other metadata here.
    roadmap.createdAt = admin.firestore.FieldValue.serverTimestamp();

    // Save the generated roadmap to Firestore under the 'roadmaps' collection.
    const docRef = await admin.firestore().collection('roadmaps').add(roadmap);
    roadmap.id = docRef.id;

    res.status(200).json(roadmap);
  } catch (error) {
    console.error('Error generating roadmap:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
