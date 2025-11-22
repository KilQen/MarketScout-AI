
import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { Calendar, DollarSign, Activity, ThumbsUp, ThumbsDown, BarChart2, List } from './Icons';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  ScatterChart, Scatter, ZAxis, CartesianGrid, Legend 
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

  // Prepare data for charts
  const chartData = products.map(p => ({
    name: p.model_name.length > 10 ? p.model_name.substring(0, 10) + '...' : p.model_name,
    full_name: p.model_name,
    score: p.sentiment_score,
    price: p.price_val,
    priceDisplay: p.price_range,
    specValue: p.specs && selectedSpec ? p.specs[selectedSpec] : 0,
    rawSpecs: p.specs
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
          
          {/* Chart 1: Price vs Sentiment Scatter */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 col-span-1 lg:col-span-2">
            <h4 className="text-lg font-semibold text-white mb-2">性价比分析 (价格 vs 评分)</h4>
            <p className="text-sm text-slate-400 mb-6">气泡位置越靠右上角，代表价格越高且评分越高。右下角通常代表高性价比。</p>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    type="number" 
                    dataKey="price" 
                    name="价格" 
                    unit="" 
                    stroke="#94a3b8" 
                    label={{ value: '价格 (估值)', position: 'bottom', fill: '#94a3b8', offset: 0 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="score" 
                    name="评分" 
                    domain={[0, 10]} 
                    stroke="#94a3b8"
                    label={{ value: '评分 (1-10)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                  />
                  <ZAxis type="number" range={[100, 400]} />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl text-xs">
                            <p className="font-bold text-white mb-1">{data.full_name}</p>
                            <p className="text-emerald-400">评分: {data.score}/10</p>
                            <p className="text-indigo-400">价格: {data.priceDisplay}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter name="Products" data={chartData} fill="#8884d8">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.score >= 8 ? '#10b981' : entry.score >= 6 ? '#fbbf24' : '#ef4444'} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Dynamic Spec Comparison */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 col-span-1 lg:col-span-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h4 className="text-lg font-semibold text-white">参数横向对比</h4>
                <p className="text-sm text-slate-400">选择不同参数进行直观对比</p>
              </div>
              <select 
                value={selectedSpec} 
                onChange={(e) => setSelectedSpec(e.target.value)}
                className="bg-slate-900 border border-slate-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
              >
                {availableSpecs.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            <div className="h-80 w-full">
              {isNumericSpec(selectedSpec) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.map(d => ({...d, val: parseSpecValue(d.specValue)}))} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} interval={0} angle={-15} textAnchor="end" />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                      formatter={(value: any) => [value, selectedSpec]}
                      labelFormatter={(label) => chartData.find(i => i.name === label)?.full_name || label}
                    />
                    <Bar dataKey="val" fill="#6366f1" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${240 + (index * 20)}, 70%, 60%)`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full overflow-y-auto">
                  <table className="w-full text-sm text-left text-slate-400">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-900/50">
                      <tr>
                        <th className="px-4 py-3">型号</th>
                        <th className="px-4 py-3 text-indigo-400">{selectedSpec}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-700 hover:bg-slate-700/50">
                          <td className="px-4 py-3 font-medium text-white">{item.full_name}</td>
                          <td className="px-4 py-3">{item.specValue || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
