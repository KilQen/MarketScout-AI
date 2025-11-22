
import { GoogleGenAI } from "@google/genai";
import { Brand, Product, SourceLink } from '../types';

const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

// Helper to clean Markdown JSON
const cleanAndParseJSON = (text: string): any => {
  try {
    // Remove markdown code blocks if present
    let cleanText = text.replace(/```json/g, '').replace(/```/g, '');
    // Attempt to find the array brackets if there is extra text
    const startIndex = cleanText.indexOf('[');
    const endIndex = cleanText.lastIndexOf(']');
    if (startIndex !== -1 && endIndex !== -1) {
      cleanText = cleanText.substring(startIndex, endIndex + 1);
    }
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
      model: 'gemini-2.5-pro',
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
  // Dynamic Date Calculation
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDateStr = `${currentYear}年${currentMonth}月`;
  
  // One year ago (Start of search window)
  const oneYearAgoDate = new Date();
  oneYearAgoDate.setFullYear(now.getFullYear() - 1);
  const oneYearAgoStr = `${oneYearAgoDate.getFullYear()}年${oneYearAgoDate.getMonth() + 1}月`;

  // Two months ago (Cutoff for "New" tag)
  const twoMonthsAgoDate = new Date();
  twoMonthsAgoDate.setMonth(now.getMonth() - 2);
  // Format YYYY-MM for prompt comparison
  const newArrivalCutoff = `${twoMonthsAgoDate.getFullYear()}-${String(twoMonthsAgoDate.getMonth() + 1).padStart(2, '0')}`;

  const prompt = `
    你是一位专注于追踪最新数码与消费品市场动态的资深分析师。
    你的核心任务是为用户提供品牌 "${brand}" 在品类 "${category}" 下的**最新**购买指南。

    **当前时间参考：**
    - 今天是：${currentDateStr}
    - 核心搜索范围：${oneYearAgoStr} 至 ${currentDateStr}
    - 新品判定线：${newArrivalCutoff} 之后发布的产品

    **非常重要的搜索与筛选指令（Strict Instructions）：**
    1. **极度优先关注新品**：请务必调用 Google Search 搜索该品牌在 **最近一年**（${oneYearAgoStr} 至今）发布的最新型号。
    2. **强制标注新品**：对于在 **${newArrivalCutoff}** 之后（即最近两个月内）发布的产品，**必须**在其 \`positioning\` 字段值的开头加上 "【新品】" 标记（例如 "【新品】2025旗舰"）。
    3. **时效性第一**：优先收录最近 1-6 个月内上市的新品。即使新品的用户评价数量不如旧款多，也要因为其“技术新”而优先收录。
    4. **对抗旧数据权重**：不要仅仅因为旧款（如 2 年前的产品）在训练数据中权重高或网评多而将其列入。列表必须反映**当前**的在售主力阵容。
    5. **代际严格控制**：
       - **核心列表**：80% 的产品必须是**最新一代**（Current Gen）。
       - **补充**：最多允许 1-2 款上一代（Last Gen）的“性价比老旗舰”。
       - **剔除**：坚决剔除两代以前的古董机型。
    6. **包含近期发布**：包含刚刚发布但即将上市的重磅产品，并在定位中标注“即将上市”。
    7. **数量目标**：请提供 8 到 12 款产品，确保覆盖旗舰、中端、入门全价位段。

    对于每个产品，请提供以下 JSON 字段（确保值为简体中文）：
    1. model_name: 完整且准确的型号名称（精确到 Pro/Max/Ultra/SE 等后缀）。
    2. release_date: 发布年月 (格式: YYYY-MM)。**请务必搜索确认准确日期**。
    3. price_range: 当前中国市场参考价 (如 "¥4999")。
    4. price_val: 纯数字价格 (Int)，用于图表分析。
    5. positioning: 市场定位。**重要：符合新品判定线的产品必须以"【新品】"开头**。
    6. core_specs: 核心配置简述 (如 "M4芯片 / OLED双层屏")。
    7. specs: JSON 对象，包含 5-6 个关键数值参数。**注意：键名必须在所有产品中保持统一**，以便在图表中横向对比。
    8. radar: 一个包含6个维度的评估数组。格式: [{ "name": "维度名(如性能)", "value": 1-10的数值 }]. **重要：维度名称必须根据品类"${category}"自动调整**（例如手机可以是：性能/屏幕/影像/续航/手感/性价比；跑鞋可以是：缓震/透气/耐磨/重量/支撑/颜值）。
    9. user_sentiment: 简短的市场反响。对于新品，引用媒体评测观点。
    10. sentiment_score: 1-10 分 (新品基于配置预期和早期口碑打分)。
    11. pros: [优点数组]。
    12. cons: [缺点数组]。

    仅返回 JSON 数组。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
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
