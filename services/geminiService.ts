import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ItemAnalysis, NegotiationAdvice } from "../types";

// Using process.env.API_KEY is required for security and to use the correct quota source.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    item_name: {
      type: Type.STRING,
      description: "The identified name of the product (Brand + Model).",
    },
    estimated_condition: {
      type: Type.STRING,
      description: "One of: Mint, Good, Poor.",
      enum: ["Mint", "Good", "Poor"]
    },
    retail_price_new: {
      type: Type.STRING,
      description: "Estimated new retail price (e.g. €120.00).",
    },
    flea_market_fair_price: {
      type: Type.STRING,
      description: "Estimated fair target price (e.g. €40.00).",
    },
    price_range: {
      type: Type.STRING,
      description: "A realistic market price range (e.g. €35.00 - €50.00).",
    },
    suggested_offer_price: {
      type: Type.STRING,
      description: "The specific low-ball but serious starting price (e.g. €25.00).",
    },
    walk_away_price: {
      type: Type.STRING,
      description: "Maximum price to pay before walking away (e.g. €45.00).",
    },
    price_reasoning: {
        type: Type.STRING,
        description: "A short (1 sentence) explanation of why this price range is fair.",
    },
    deal_rating: {
      type: Type.STRING,
      enum: ["Green", "Yellow", "Red"],
      description: "Green for great potential deal, Yellow for average, Red for risky/bad deal.",
    },
    negotiation_arguments: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of 2 short arguments based on visible wear or market comparison.",
    },
    negotiation_scripts: {
      type: Type.OBJECT,
      description: "Step-by-step negotiation lines.",
      properties: {
        the_icebreaker: { type: Type.STRING, description: "Short, friendly question to start." },
        the_data_play: { type: Type.STRING, description: "Script using the fair price/condition as leverage." },
        the_closer: { type: Type.STRING, description: "Final 'cash-in-hand' or 'walk-away' offer." }
      },
      required: ["the_icebreaker", "the_data_play", "the_closer"]
    }
  },
  required: [
    "item_name",
    "estimated_condition",
    "retail_price_new",
    "flea_market_fair_price",
    "price_range",
    "suggested_offer_price",
    "walk_away_price",
    "price_reasoning",
    "deal_rating",
    "negotiation_arguments",
    "negotiation_scripts"
  ],
};

const coachingSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    seller_sentiment: {
      type: Type.STRING,
      description: "The detected tone of the seller (e.g., Firm, Hesitant, Annoyed, Open).",
    },
    seller_point: {
      type: Type.STRING,
      description: "A very brief summary of what the seller reasoned (e.g., 'Claims it's vintage', 'Says price is fixed').",
    },
    suggested_counter: {
      type: Type.STRING,
      description: "A short, witty, or firm sentence the buyer should say next.",
    },
    detected_price: {
      type: Type.STRING,
      description: "The price mentioned by the seller, if any (e.g. '€55.00').",
    },
    verdict: {
      type: Type.STRING,
      enum: ["Buy Now", "Negotiate", "Walk Away"],
      description: "Actionable advice based on the seller's price vs fair market value.",
    },
  },
  required: ["seller_sentiment", "seller_point", "suggested_counter", "verdict"],
};

// Retry helper function with exponential backoff
const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    const isRetryable = error?.status === 429 || error?.status === 503 || error?.code === 429;
    if (retries > 0 && isRetryable) {
      console.warn(`API Rate limit hit. Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryWithBackoff(operation, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const analyzeItemImage = async (base64Image: string): Promise<ItemAnalysis> => {
  return retryWithBackoff(async () => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image,
              },
            },
            {
              text: `Analyze this image for a flea market negotiation. Identify the item, estimate its condition, and provide pricing. Be street-smart and helpful.`,
            },
          ],
        },
        config: {
          systemInstruction: `Role: apprAIser AI. 
          You are an expert flea market appraiser and negotiation coach. 
          1. Identify brand, model, and condition.
          2. Estimate "New Retail Price" and "Target Flea Market Price" (30-60% of used market value).
          3. Calculate "Suggested Opening Offer" (below target) and "Walk Away Price" (above target).
          4. Negotiation Engine: Generate tactical scripts (Icebreaker, Data Play, Closer) based on flaws or market data.
          IMPORTANT: For all JSON numeric string fields (prices), use RAW NUMBERS (e.g. "1200.50" or "3000"). Do NOT use thousands separators like commas. Only use a dot for decimals if needed.
          Tone: Helpful, quick, and street-smart. Short sentences.`,
          responseMimeType: "application/json",
          responseSchema: analysisSchema,
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("No response text received from Gemini.");
      }

      return JSON.parse(text) as ItemAnalysis;
    } catch (error) {
      console.error("Gemini Analysis Error:", error);
      throw error;
    }
  });
};

export const getNegotiationCoaching = async (
  currentContext: ItemAnalysis,
  input: { type: 'audio' | 'text', data: string, mimeType?: string }
): Promise<NegotiationAdvice> => {
  return retryWithBackoff(async () => {
    try {
      const parts: any[] = [];
      
      if (input.type === 'audio') {
        parts.push({
          inlineData: {
            mimeType: input.mimeType || 'audio/webm',
            data: input.data,
          },
        });
        parts.push({
          text: `We are negotiating for a ${currentContext.item_name}. 
          My target: ${currentContext.flea_market_fair_price}. Max: ${currentContext.walk_away_price}.
          The seller replied in this audio. Analyze tone, detect price, and give verdict (Buy Now/Negotiate/Walk Away).`,
        });
      } else {
        parts.push({
          text: `We are negotiating for a ${currentContext.item_name}. 
          My target: ${currentContext.flea_market_fair_price}. Max: ${currentContext.walk_away_price}.
          The seller OFFERED this price: "${input.data}". 
          Analyze if this is a good deal. Give verdict (Buy Now/Negotiate/Walk Away) and a specific counter-script.`,
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-flash-lite-latest", 
        contents: { parts },
        config: {
          systemInstruction: `You are a real-time negotiation coach. 
          Compare seller's offer to our target (${currentContext.flea_market_fair_price}).
          If offer < fair price -> Verdict: Buy Now.
          If offer > walk away price -> Verdict: Walk Away (unless they seem soft).
          Otherwise -> Negotiate.
          IMPORTANT: Use RAW NUMBERS for prices (e.g. "3000" not "3,000" or "3.000").
          Provide a concise summary and a punchy counter-line.`,
          responseMimeType: "application/json",
          responseSchema: coachingSchema,
        },
      });

      const text = response.text;
      if (!text) throw new Error("No advice generated");

      return JSON.parse(text) as NegotiationAdvice;
    } catch (error) {
      console.error("Coaching Error:", error);
      throw error;
    }
  });
};