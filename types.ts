
export interface Brand {
  name: string;
  positioning: string;
  market_tier: '入门' | '中端' | '高端' | '奢侈' | '专业'; // Localized values
  audience: string;
  brand_color: string; // Hex code suggestion
  description: string;
}

export interface Product {
  model_name: string;
  release_date: string;
  price_range: string; // Display string e.g. "¥3999"
  price_val: number; // Numeric value for graphing
  positioning: string;
  core_specs: string;
  specs: Record<string, string | number>; // Structured specs for comparison
  radar: { name: string; value: number }[]; // New field for radar chart
  user_sentiment: string;
  sentiment_score: number; // 1-10 estimated score
  pros: string[];
  cons: string[];
}

export interface AnalysisState {
  status: 'idle' | 'loading_brands' | 'selecting_brand' | 'loading_products' | 'viewing_products' | 'error';
  error?: string;
}

export interface SourceLink {
  title: string;
  uri: string;
}
