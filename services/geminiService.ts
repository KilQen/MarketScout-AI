
import { GoogleGenAI } from "@google/genai";
import { Brand, Product, SourceLink } from '../types';

const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

// Helper to clean Markdown JSON
const cleanAndParseJSON = (text: string): any => {
  try {
    // Remove markdown code blocks if present
    let cleanText = text.replace(/```json/g, '').replace(/```/g, '');
    // Trim whitespace
    cleanText = cleanText.trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("JSON Parse Error:", e, text);
    throw new Error("无法解析 AI 响应，请重试。");
  }
};

export const fetchBrandsForCategory = async (category: string): Promise<{ brands: Brand[], sources: SourceLink[] }> => {
  const prompt = `
    扮演一位专业的市场研究员。
    分析产品品类："${category}"。
    识别 6 到 9 个在该市场具有全球或区域重要影响力的主要品牌。
    
    对于每个品牌，请提供以下信息（所有文本必须使用简体中文）：
    1. name: 品牌名称。
    2. positioning: 简短描述其市场定位（例如“技术创新者”、“性价比之选”、“高端生活方式”）。
    3. market_tier: 必须是以下之一 ["入门", "中端", "高端", "奢侈", "专业"]。
    4. audience: 目标受众描述。
    5. brand_color: 代表品牌形象的十六进制颜色代码（如果未知则推测）。
    6. description: 一句话总结该品牌在此品类中的相关性。

    仅返回一个有效的 JSON 对象数组。不要包含任何其他文本。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "[]";
    const brands = cleanAndParseJSON(text);
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web)
      .filter((web: any) => web) || [];

    return { brands, sources };
  } catch (error) {
    console.error("Gemini Brand Fetch Error:", error);
    throw error;
  }
};

export const fetchProductsForBrand = async (brand: string, category: string): Promise<{ products: Product[], sources: SourceLink[] }> => {
  const prompt = `
    扮演一位技术产品分析师。
    分析品牌 "${brand}" 在品类 "${category}" 中的表现。
    识别 5 到 8 个独特且当前相关的产品型号（包括最新发布和畅销款）。

    对于每个产品，请提供以下信息（所有文本必须使用简体中文）：
    1. model_name: 完整且具体的产品型号名称。
    2. release_date: 大致发布日期（格式：年-月）。
    3. price_range: 当前大约市场价格字符串（例如 "¥3999" 或 "$500"）。
    4. price_val: 用于图表的纯数字价格估值（单位统一，优先人民币，纯数字，不要带符号）。
    5. positioning: 该产品在产品线中的定位（例如“旗舰”、“入门款”）。
    6. core_specs: 列出3个关键技术规格的简洁字符串。
    7. specs: 一个 JSON 对象，包含 3-4 个可用于横向对比的关键技术参数。
       - 键名(key)应简短统一（例如 "续航(h)", "重量(g)", "屏幕尺寸(英寸)", "内存(GB)"）。
       - 值(value)如果是数字则尽量用数字，否则用简短字符串。
    8. user_sentiment: 用户普遍评价的简短总结。
    9. sentiment_score: 代表整体好评度的整数（1-10）。
    10. pros: 字符串数组（2-3 个主要优点）。
    11. cons: 字符串数组（2-3 个主要缺点）。

    仅返回一个有效的 JSON 对象数组。不要包含任何其他文本。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "[]";
    const products = cleanAndParseJSON(text);

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web)
      .filter((web: any) => web) || [];

    return { products, sources };
  } catch (error) {
    console.error("Gemini Product Fetch Error:", error);
    throw error;
  }
};
