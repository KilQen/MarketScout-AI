import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { Calendar, DollarSign, Activity, ThumbsUp, ThumbsDown, BarChart2, List } from './Icons';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  ScatterChart, Scatter, ZAxis, CartesianGrid, ReferenceLine, Label
} from 'recharts';

interface ProductListProps {
  brandName: string;
  products: Product[];
}

export const ProductList: React.FC<ProductListProps> = ({ brandName, products }) => {
  const [viewMode, setViewMode] = useState<'list' | 'charts'>('list');
  const [selectedSpec, setSelectedSpec] = useState<string>('');

  // Extract all unique spec keys available across products
  const availableSpecs = useMemo(() => {
    const keys = new Set<string>();
    products.forEach(p => {
      if (p.specs) {
        Object.keys(p.specs).forEach(k => keys.add(k));
      }
    });
    return Array.from(keys);
  }, [products]);

  // Set default selected spec
  React.useEffect(() => {
    if (availableSpecs.length > 0 && !selectedSpec) {
      setSelectedSpec(availableSpecs[0]);
    }
  }, [availableSpecs, selectedSpec]);

  // Calculate averages for Quadrants
  const stats = useMemo(() => {
    if (products.length === 0) return { avgPrice: 0, avgScore: 0, maxPrice: 0, minPrice: 0 };
    const totalScore = products.reduce((sum, p) => sum + p.sentiment_score, 0);
    const totalPrice = products.reduce((sum, p) => sum + p.price_val, 0);
    const prices = products.map(p => p.price_val);
    
    return {
      avgPrice: Math.round(totalPrice / products.length),
      avgScore: Number((totalScore / products.length).toFixed(1)),
      maxPrice: Math.max(...prices),
      minPrice: Math.min(...prices)
    };
  }, [products]);

  // Prepare data for charts
  const chartData = products.map(p => ({
    name: p.model_name.length > 10 ? p.model_name.substring(0, 10) + '...' : p.model_name,
    full_name: p.model_name,
    score: p.sentiment_score,
    price: p.price_val,
    priceDisplay: p.price_range,
    release: p.release_date,
    positioning: p.positioning,
    specValue: p.specs && selectedSpec ? p.specs[selectedSpec] : 0,
  }));

  // Helper to determine if a spec value is numeric for bar chart
  const isNumericSpec = (specKey: string) => {
    return products.some(p => {
      const val = p.specs?.[specKey];
      return typeof val === 'number' || (typeof val === 'string' && !isNaN(parseFloat(val)));
    });
  };

  const parseSpecValue = (val: string | number | undefined) => {
    if (val === undefined) return 0;
    if (typeof val === 'number') return val;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      
      {/* View Toggle & Controls */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white">产品阵容详情</h3>
        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'list' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <List size={16} />
            列表视图
          </button>
          <button
            onClick={() => setViewMode('charts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              viewMode === 'charts' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart2 size={16} />
            数据可视化对比
          </button>
        </div>
      </div>

      {/* VISUALIZATION MODULE */}
      {viewMode === 'charts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          
          {/* Chart 1: Price vs Sentiment Scatter (QUADRANT ANALYSIS) */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 col-span-1 lg:col-span-2 relative overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6">
              <div>
                <h4 className="text-lg font-semibold text-white mb-1">市场定位矩阵分析</h4>
                <p className="text-sm text-slate-400">基于价格与评分生成的四象限图，助您快速判断产品价值属性。</p>
              </div>
              <div className="flex gap-4 text-xs mt-2 md:mt-0">
                 <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400"></div>高性价比</div>
                 <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-400"></div>极致体验</div>
                 <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400"></div>中规中矩</div>
                 <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-400"></div>溢价较高</div>
              </div>
            </div>

            <div className="h-[450px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    type="number" 
                    dataKey="price" 
                    name="价格" 
                    domain={['auto', 'auto']} 
                    stroke="#94a3b8" 
                    label={{ value: '价格 (RMB)', position: 'bottom', fill: '#94a3b8', offset: 0 }}
                    tickFormatter={(val) => `¥${val}`}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="score" 
                    name="评分" 
                    domain={[dataMin => Math.floor(dataMin - 1), 10]} 
                    stroke="#94a3b8"
                    label={{ value: '推荐评分 (1-10)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                  />
                  <ZAxis type="number" range={[80, 80]} /> 
                  
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900/95 border border-slate-600 p-3 rounded-lg shadow-2xl text-xs backdrop-blur-sm z-50">
                            <p className="font-bold text-base text-white mb-1">{data.full_name}</p>
                            <p className="text-slate-300 mb-2">{data.release} 发布 | {data.positioning}</p>
                            <div className="flex gap-4 border-t border-slate-700 pt-2">
                                <div>
                                    <span className="text-slate-500 block">价格</span>
                                    <span className="text-indigo-400 font-mono text-sm">{data.priceDisplay}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500 block">评分</span>
                                    <span className={`font-mono text-sm ${data.score >= 8 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                        {data.score}/10
                                    </span>
                                </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  
                  {/* Quadrant Reference Lines */}
                  <ReferenceLine x={stats.avgPrice} stroke="#475569" strokeDasharray="5 5">
                    <Label value="平均价格" position="insideTopLeft" offset={10} fill="#64748b" fontSize={10} />
                  </ReferenceLine>
                  <ReferenceLine y={stats.avgScore} stroke="#475569" strokeDasharray="5 5">
                    <Label value="平均评分" position="insideBottomRight" offset={10} fill="#64748b" fontSize={10} />
                  </ReferenceLine>

                  {/* Quadrant Labels (Background Text) */}
                  {/* Top Left: Low Price, High Score */}
                  <ReferenceLine x={stats.minPrice} y={10} stroke="none">
                     <Label value="高性价比区" position="insideBottomRight" fill="#10b981" opacity={0.07} fontSize={32} fontWeight="bold" />
                  </ReferenceLine>
                  {/* Top Right: High Price, High Score */}
                  <ReferenceLine x={stats.maxPrice} y={10} stroke="none">
                     <Label value="旗舰体验区" position="insideBottomLeft" fill="#6366f1" opacity={0.07} fontSize={32} fontWeight="bold" />
                  </ReferenceLine>
                   {/* Bottom Right: High Price, Low Score */}
                   <ReferenceLine x={stats.maxPrice} y={stats.avgScore - 0.5} stroke="none">
                     <Label value="溢价较高区" position="insideTopLeft" fill="#f43f5e" opacity={0.07} fontSize={32} fontWeight="bold" />
                  </ReferenceLine>


                  <Scatter name="Products" data={chartData}>
                    {chartData.map((entry, index) => {
                        // Determine color based on quadrant logic roughly
                        let color = '#fbbf24'; // Default Amber (Mid)
                        if (entry.score >= stats.avgScore && entry.price <= stats.avgPrice) color = '#34d399'; // High Value (Emerald)
                        else if (entry.score >= stats.avgScore && entry.price > stats.avgPrice) color = '#818cf8'; // Premium (Indigo)
                        else if (entry.score < stats.avgScore && entry.price > stats.avgPrice) color = '#fb7185'; // Overpriced (Rose)
                        
                        return <Cell key={`cell-${index}`} fill={color} stroke="#fff" strokeWidth={1} />;
                    })}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Dynamic Spec Comparison */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 col-span-1 lg:col-span-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h4 className="text-lg font-semibold text-white">参数对比横评</h4>
                <p className="text-sm text-slate-400">切换下方选项以直观对比不同参数</p>
              </div>
              <select 
                value={selectedSpec} 
                onChange={(e) => setSelectedSpec(e.target.value)}
                className="bg-slate-900 border border-slate-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 min-w-[150px]"
              >
                {availableSpecs.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            <div className="h-[450px] w-full flex flex-col">
              {isNumericSpec(selectedSpec) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.map(d => ({...d, val: parseSpecValue(d.specValue)}))} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#94a3b8" 
                      fontSize={12} 
                      interval={0} 
                      angle={-30} 
                      textAnchor="end" 
                      height={60}
                    />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip 
                      cursor={{fill: '#334155', opacity: 0.2}}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9', borderRadius: '8px' }}
                      formatter={(value: any) => [value, selectedSpec]}
                      labelFormatter={(label) => chartData.find(i => i.name === label)?.full_name || label}
                    />
                    <Bar dataKey="val" fill="#6366f1" radius={[4, 4, 0, 0]} animationDuration={1000}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${240 + (index * 15)}, 70%, 60%)`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex-1 overflow-hidden rounded-lg border border-slate-700/50 bg-slate-900/30">
                  <div className="h-full overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-900/90 sticky top-0 z-10 shadow-sm backdrop-blur-sm">
                        <tr>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/3 border-b border-slate-700">
                            产品型号
                          </th>
                          <th className="px-6 py-4 text-xs font-bold text-indigo-400 uppercase tracking-wider w-2/3 border-b border-slate-700">
                            {selectedSpec}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {chartData.map((item, idx) => (
                          <tr 
                            key={idx} 
                            className="group transition-colors hover:bg-slate-800/60"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 opacity-50 group-hover:opacity-100 transition-opacity"></span>
                                <span className="font-medium text-slate-200 group-hover:text-white transition-colors">
                                  {item.full_name}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-400 group-hover:text-slate-300 leading-relaxed">
                              {item.specValue || <span className="text-slate-600">-</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* LIST VIEW */}
      <div className={viewMode === 'list' ? 'block' : 'hidden'}>
        <div className="grid grid-cols-1 gap-6">
          {products.map((product, idx) => (
            <div key={idx} className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-colors group">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">{product.model_name}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-medium border border-indigo-500/20">
                      {product.positioning}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-400 mt-2">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>{product.release_date}</span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-400 font-medium">
                      <DollarSign size={14} />
                      <span>{product.price_range}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700">
                  <Activity size={16} className={product.sentiment_score >= 8 ? "text-emerald-500" : "text-amber-500"} />
                  <span className="text-sm font-bold text-white">{product.sentiment_score}/10</span>
                  <span className="text-xs text-slate-500">推荐指数</span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  {/* Core Specs Grid */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">核心参数</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {product.specs && Object.entries(product.specs).slice(0, 4).map(([key, value], i) => (
                        <div key={i} className="bg-slate-900/50 p-2 rounded border border-slate-700/30 flex flex-col">
                          <span className="text-[10px] text-slate-500 uppercase">{key}</span>
                          <span className="text-sm text-slate-200 font-medium truncate">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">用户评价总结</h4>
                    <p className="text-slate-300 text-sm italic border-l-2 border-slate-600 pl-3">"{product.user_sentiment}"</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2 items-start">
                    <ThumbsUp size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                    <div className="flex flex-wrap gap-2">
                      {product.pros.map((pro, i) => (
                        <span key={i} className="text-xs bg-emerald-500/10 text-emerald-300 px-2 py-1 rounded border border-emerald-500/20">
                          {pro}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 items-start mt-3">
                    <ThumbsDown size={16} className="text-rose-500 mt-0.5 shrink-0" />
                    <div className="flex flex-wrap gap-2">
                      {product.cons.map((con, i) => (
                        <span key={i} className="text-xs bg-rose-500/10 text-rose-300 px-2 py-1 rounded border border-rose-500/20">
                          {con}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};