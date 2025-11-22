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
    扮演一位资深数码/消费品分析师。
    分析品牌 "${brand}" 在品类 "${category}" 中的**最新**产品阵容。
    
    **重要指令：**
    1. **必须优先获取 2024年 和 2025年 发布的最新型号**。如果该品牌近期无新品，才选择 2023 年的热门款。
    2. 忽略已停产或过时的旧型号，确保数据反映当前的在售主力阵容。
    3. 识别 5 到 8 个最具代表性的型号（覆盖旗舰、中端和入门）。

    对于每个产品，请提供以下信息（所有文本必须使用简体中文）：
    1. model_name: 完整且具体的产品型号名称（例如 "iPhone 16 Pro Max" 而不是 "iPhone"）。
    2. release_date: 具体的发布年月（格式：YYYY-MM）。
    3. price_range: 当前中国市场的参考价格字符串（例如 "¥6999"）。
    4. price_val: 用于图表的纯数字价格（人民币），**不要包含符号**。确保数值准确反映当前市场均价。
    5. positioning: 该产品在产品线中的定位（例如“年度旗舰”、“高性价比”、“入门首选”）。
    6. core_specs: 列出3个核心配置（如芯片/材质/功率）。
    7. specs: 一个 JSON 对象，包含 4 个可用于横向对比的**关键数值型参数**。
       - 必须包含具体的数字以便生成图表（例如 "电池(mAh)": 5000, "重量(g)": 200）。
       - 键名请保持统一。
    8. user_sentiment: 基于网络评测的用户评价总结（褒贬）。
    9. sentiment_score: 综合评分（1-10，10为完美）。请根据配置价格比、用户口碑客观打分。
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