
import { GoogleGenAI, GenerateContentResponse, Tool, VertexAISearch } from "@google/genai";
import { GeminiAnswer, ProcessedGroundingSource, GroundingChunk, GroundingMetadata } from '../types';

const GEMINI_MODEL = 'gemini-2.5-flash-preview-04-17';
const DATASTORE_ID = 'pickleball-rules-datastore_1749867119733'; // User provided Data Store ID

export const askPickleballGuru = async (
  question: string, 
  apiKey: string, 
  projectId: string
): Promise<GeminiAnswer> => {
  if (!apiKey) {
    throw new Error("Gemini API key is not provided.");
  }
  
  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = "You are a friendly and helpful Pickleball Rules Expert. Answer questions clearly and concisely, based on the information retrieved from the knowledge base. If the answer is not in the knowledge base, state that you don't have information on that specific topic related to pickleball rules.";

  const datastoreLocation = process.env.DATASTORE_LOCATION || "global";
  const datastoreCollectionId = process.env.DATASTORE_COLLECTION_ID || "default_collection";
  
  // Construct the full datastore path. User must ensure projectId is correctly set.
  const fullDatastorePath = `projects/${projectId}/locations/${datastoreLocation}/collections/${datastoreCollectionId}/dataStores/${DATASTORE_ID}`;

  const tools: Tool[] = [];
  // Only add Vertex AI Search tool if projectId is not the placeholder and is configured
  if (projectId && projectId !== "YOUR_GOOGLE_CLOUD_PROJECT_ID_OR_NUMBER") {
    const vertexAiSearchConfig: VertexAISearch = {
        datastore: fullDatastorePath,
    };
    // Corrected structure: vertexAiSearchConfig is nested under 'retrieval'
    const vertexTool: Tool = {
        retrieval: {
            vertexAiSearch: vertexAiSearchConfig
        }
    };
    tools.push(vertexTool);
  } else {
    console.warn(`Project ID is '${projectId}'. Vertex AI Search tool for datastore '${DATASTORE_ID}' will not be used. Answers may not be grounded to your specific ruleset.`);
    // Optionally, could add googleSearch tool as a fallback if desired, but user specifically requested their datastore.
    // tools.push({ googleSearch: {} }); 
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: question,
      config: {
        systemInstruction: systemInstruction,
        // Do not use thinkingConfig: { thinkingBudget: 0 } for Q&A to ensure quality.
        tools: tools.length > 0 ? tools : undefined, // Only pass tools if configured
      },
    });

    const text = response.text;
    const groundingSources: ProcessedGroundingSource[] = [];

    // Extract grounding metadata if available
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata as GroundingMetadata | undefined;

    if (groundingMetadata?.groundingChunks && groundingMetadata.groundingChunks.length > 0) {
      groundingMetadata.groundingChunks.forEach((chunk: GroundingChunk) => {
        if (chunk.web) {
          groundingSources.push({ type: 'web', uri: chunk.web.uri, title: chunk.web.title });
        } else if (chunk.retrievedContext && chunk.retrievedContext.uri) {
          // For datastore sources, the URI might be an internal resource locator.
          // Title might be more relevant if available.
          groundingSources.push({ type: 'retrievedContext', uri: chunk.retrievedContext.uri, title: chunk.retrievedContext.title || chunk.retrievedContext.uri });
        }
      });
    } else if (groundingMetadata?.webSearchQueries && groundingMetadata.webSearchQueries.length > 0) {
        // Fallback or additional info: if only webSearchQueries are present
        // This part might be more relevant for `googleSearch` tool
        console.log("Grounding metadata contains web search queries:", groundingMetadata.webSearchQueries);
    }

    return { text, groundingSources };

  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    if (error.message && error.message.includes("API key not valid")) {
        throw new Error("Invalid Gemini API key. Please check your API_KEY environment variable.");
    }
    if (error.message && (error.message.includes("Vertex AI Search datastore") || error.message.includes("Permission denied on resource") || error.message.includes("INVALID_ARGUMENT") && error.message.includes("datastore"))) {
        throw new Error(`Error with Vertex AI Search datastore configuration or access: ${error.message}. Ensure Project ID ('${projectId}'), location ('${datastoreLocation}'), and datastore ID ('${DATASTORE_ID}') are correct, the datastore exists, and the API key has permissions.`);
    }
    throw new Error(`Failed to communicate with the Pickleball Guru (Gemini API): ${error.message || 'Unknown error'}`);
  }
};
