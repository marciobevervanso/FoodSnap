import { GoogleGenAI } from "@google/genai";

const SYSTEM_PROMPT = `
Você é o FoodSnap.ai, um nutricionista comportamental e científico.
Analise a imagem enviada e retorne um JSON puro (sem markdown) seguindo estritamente este schema:

{
  "items": [
    {
      "name": "Nome do alimento",
      "portion": "Quantidade estimada (ex: 150g, 1 unidade)",
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fat": 0,
      "fiber": 0,
      "sugar": 0,
      "sodium_mg": 0,
      "flags": ["fritura", "processado", "saudavel", "alto_acucar"]
    }
  ],
  "total": {
    "calories": 0,
    "protein": 0,
    "carbs": 0,
    "fat": 0,
    "fiber": 0,
    "sugar": 0,
    "sodium_mg": 0
  },
  "category": "Café da Manhã" | "Almoço" | "Jantar" | "Lanche" | "Pré-Treino" | "Pós-Treino",
  "health_score": 0, 
  "confidence": "alta" | "media" | "baixa",
  "tip": {
    "title": "Titulo curto",
    "text": "Dica prática e motivadora de até 2 frases sobre a refeição.",
    "reason": "Explicação científica curta"
  }
}

Regras:
1. Health Score de 0 a 100. Considere densidade nutritiva, não apenas calorias.
2. Se não identificar comida, retorne lista de itens vazia e confidence "baixa".
`;

export interface AnalysisResult {
  items: {
    name: string;
    portion: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium_mg: number;
    flags: string[];
  }[];
  total: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium_mg: number;
    flags: string[];
  };
  category: string;
  health_score: number;
  confidence: 'alta' | 'media' | 'baixa';
  tip: {
    title: string;
    text: string;
    reason: string;
  };
}

export const analyzeImage = async (base64Image: string, mimeType: string = 'image/jpeg'): Promise<AnalysisResult> => {
  // Safe Access to process.env for browser environments
  const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : (window as any).process?.env?.API_KEY;

  if (!apiKey) {
      console.error("API KEY Missing");
      throw new Error("API Key not configured");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          },
          {
            text: SYSTEM_PROMPT
          }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    });

    if (response.text) {
      // Limpa blocos de código markdown se presentes (ex: ```json ... ```)
      const cleanText = response.text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanText) as AnalysisResult;
    }
    
    throw new Error("Resposta vazia da IA");
  } catch (error) {
    console.error("Erro na análise Gemini:", error);
    throw error;
  }
};