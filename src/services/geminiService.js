const { GoogleGenAI } = require("@google/genai");

/**
 * Service to interface with Google Gemini API for code semantic renaming operations.
 */
class GeminiService {
  /**
   * @param {string} apiKey - Google Gemini API Key
   */
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY environment variable is required but missing from setup.");
    }

    // Initialize modern @google/genai client
    this.ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  /**
   * Renames Lua/Luau variables semantically using the gemini-3.5-flash model.
   * @param {string} rawCode - Raw Lua/Luau source code
   * @returns {Promise<string>} Promising the renamed Lua code
   */
  async renameLuaCode(rawCode) {
    const systemInstruction = 
      "You are an advanced Lua/Luau semantic renaming engine.\n\n" +
      "Rules:\n" +
      "* Preserve functionality exactly.\n" +
      "* Rename variables only.\n" +
      "* Keep all logic unchanged.\n" +
      "* Rename all references consistently.\n" +
      "* Use meaningful Roblox-style names.\n" +
      "* Infer names from context.\n" +
      "* Return ONLY the final Lua code.\n" +
      "* No markdown.\n" +
      "* No explanations.\n" +
      "* No comments.";

    const prompt = `Please semantically rename variables inside this Lua code and output the formatted result:\n\n${rawCode}`;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.2, // Lower value guarantees structure and variable stability
        },
      });

      let renamedCode = response.text || "";

      // Post-process to remove clean Markdown wrapper if the model generates it
      if (renamedCode.includes("```")) {
        renamedCode = renamedCode.replace(/^```[a-zA-Z]*\n/gm, "");
        renamedCode = renamedCode.replace(/```$/gm, "");
      }

      return renamedCode.trim();
    } catch (error) {
      console.error("[GeminiService] Error renaming Lua code:", error);
      throw error;
    }
  }
}

module.exports = GeminiService;
