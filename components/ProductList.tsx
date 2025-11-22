
import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { Calendar, DollarSign, Activity, ThumbsUp, ThumbsDown, BarChart2, List, LayoutGrid, Hexagon } from './Icons';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  ScatterChart, Scatter, ZAxis, CartesianGrid, ReferenceLine, Label, ReferenceArea,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

interface ProductListProps {
  brandName: string;
  products: Product[];
}

export const ProductList: React.FC<ProductListProps> = ({ brandName, products }) => {
  const [viewMode, setViewMode] = useState<'list' | 'map' | 'cards' | 'compare'>('map');
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

  // Calculate stats for quadrants
  const stats = useMemo(() => {
    if (products.length === 0) return { avgPrice: 0, avgScore: 0, maxPrice: 0, minPrice: 0, minScore: 0 };
    const totalScore = products.reduce((sum, p) => sum + p.sentiment_score, 0);
    const totalPrice = products.reduce((sum, p) => sum + p.price_val, 0);
    const prices = products.map(p => p.price_val);
    const scores = products.map(p => p.sentiment_score);
    
    return {
      avgPrice: Math.round(totalPrice / products.length),
      avgScore: Number((totalScore / products.length).toFixed(1)),
      maxPrice: Math.max(...prices) * 1.1, // Add buffer
      minPrice: Math.min(...prices) * 0.9, // Add buffer
      maxScore: 10,
      minScore: Math.min(...scores) - 1
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

  // Custom shape for scatter plot
  const CustomScatterShape = (props: any) => {
    const { cx, cy, payload } = props;
    const isHighValue = payload.score >= stats.avgScore && payload.price <= stats.avgPrice;
    const isPremium = payload.score >= stats.avgScore && payload.price > stats.avgPrice;
    
    const color = isHighValue ? '#10b981' : isPremium ? '#6366f1' : payload.score < stats.avgScore && payload.price > stats.avgPrice ? '#f43f5e' : '#fbbf24';
    
    return (
      <g className="cursor-pointer group">
        <circle cx={cx} cy={cy} r={8} fill={color} fillOpacity={0.6} stroke={color} strokeWidth={2} />
        <circle cx={cx} cy={cy} r={14} fill={color} fillOpacity={0.1} className="animate-pulse" />
      </g>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      
      {/* Navigation Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-2 bg-slate-900/50 p-2 rounded-xl border border-slate-800">
        <h3 className="text-lg font-bold text-white px-2 hidden sm:block">数据视界</h3>
        
        <div className="flex p-1 gap-1 bg-slate-800 rounded-lg w-full sm:w-auto overflow-x-auto">
           <button
            onClick={() => setViewMode('map')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              viewMode === 'map' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <LayoutGrid size={16} />
            决策矩阵
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              viewMode === 'cards' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Hexagon size={16} />
            全息雷达
          </button>
          <button
            onClick={() => setViewMode('compare')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              viewMode === 'compare' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <BarChart2 size={16} />
            参数对比
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              viewMode === 'list' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <List size={16} />
            详情列表
          </button>
        </div>
      </div>

      {/* VIEW: DECISION MAP (Enhanced Scatter) */}
      {viewMode === 'map' && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-1 overflow-hidden animate-fade-in">
          <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-900/30">
            <div>
              <h4 className="text-white font-bold flex items-center gap-2">
                <LayoutGrid size={18} className="text-indigo-400"/>
                市场决策矩阵
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                横轴代表价格，纵轴代表评分。背景颜色代表购买建议分区。
              </p>
            </div>
            {/* Legend */}
            <div className="hidden md:flex gap-3 text-[10px]">
              <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div> 黄金性价比
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div> 旗舰体验
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                <div className="w-2 h-2 rounded-full bg-rose-500"></div> 溢价过高
              </div>
            </div>
          </div>

          <div className="h-[500px] w-full relative bg-slate-900/20">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} horizontal={false} />
                <XAxis 
                  type="number" 
                  dataKey="price" 
                  name="价格" 
                  domain={[stats.minPrice, stats.maxPrice]} 
                  stroke="#64748b" 
                  tick={{fill: '#64748b', fontSize: 10}}
                  tickFormatter={(val) => `¥${val}`}
                >
                  <Label value="价格 (RMB) →" position="insideBottomRight" offset={-10} fill="#475569" fontSize={12} />
                </XAxis>
                <YAxis 
                  type="number" 
                  dataKey="score" 
                  name="评分" 
                  domain={[stats.minScore, 10]} 
                  stroke="#64748b"
                  tick={{fill: '#64748b', fontSize: 10}}
                >
                   <Label value="↑ 推荐评分" angle={-90} position="insideLeft" fill="#475569" fontSize={12} />
                </YAxis>
                <ZAxis type="number" range={[100, 100]} />
                
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3', stroke: '#94a3b8' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const isNew = data.positioning.includes('【新品】');
                      return (
                        <div className="bg-slate-950/90 border border-indigo-500/50 p-4 rounded-xl shadow-2xl backdrop-blur-md min-w-[200px]">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-white text-base flex items-center gap-2">
                              {data.full_name}
                              {isNew && <span className="text-[10px] bg-rose-500 text-white px-1 rounded animate-pulse">NEW</span>}
                            </span>
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                              data.score >= 8.5 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                            }`}>{data.score}分</span>
                          </div>
                          <div className="space-y-1 text-xs text-slate-300">
                             <div className="flex justify-between">
                               <span className="text-slate-500">价格:</span>
                               <span className="font-mono text-indigo-300">{data.priceDisplay}</span>
                             </div>
                             <div className="flex justify-between">
                               <span className="text-slate-500">发布:</span>
                               <span>{data.release}</span>
                             </div>
                             <div className="flex justify-between">
                               <span className="text-slate-500">定位:</span>
                               <span className="max-w-[120px] truncate text-right">{data.positioning.replace('【新品】', '')}</span>
                             </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                {/* --- Zoned Backgrounds --- */}
                <ReferenceArea 
                  x1={stats.minPrice} x2={stats.avgPrice} 
                  y1={stats.avgScore} y2={10} 
                  fill="#10b981" fillOpacity={0.05} 
                >
                   <Label value="黄金性价比" position="center" fill="#10b981" fillOpacity={0.3} fontSize={20} fontWeight="bold" />
                </ReferenceArea>

                <ReferenceArea 
                  x1={stats.avgPrice} x2={stats.maxPrice} 
                  y1={stats.avgScore} y2={10} 
                  fill="#6366f1" fillOpacity={0.05} 
                >
                  <Label value="旗舰体验" position="center" fill="#6366f1" fillOpacity={0.3} fontSize={20} fontWeight="bold" />
                </ReferenceArea>

                <ReferenceArea 
                  x1={stats.minPrice} x2={stats.avgPrice} 
                  y1={stats.minScore} y2={stats.avgScore} 
                  fill="#64748b" fillOpacity={0.05} 
                >
                   <Label value="入门/妥协" position="center" fill="#64748b" fillOpacity={0.2} fontSize={20} fontWeight="bold" />
                </ReferenceArea>

                 <ReferenceArea 
                  x1={stats.avgPrice} x2={stats.maxPrice} 
                  y1={stats.minScore} y2={stats.avgScore} 
                  fill="#f43f5e" fillOpacity={0.05} 
                >
                   <Label value="溢价较高" position="center" fill="#f43f5e" fillOpacity={0.2} fontSize={20} fontWeight="bold" />
                </ReferenceArea>

                <Scatter name="Products" data={chartData} shape={<CustomScatterShape />} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* VIEW: RADAR CARDS (New) */}
      {viewMode === 'cards' && (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {products.map((product, idx) => {
               const isNew = product.positioning.includes('【新品】');
               const displayPositioning = product.positioning.replace('【新品】', '').replace('【', '').replace('】', '').trim();
               
               // Fallback Radar Data if AI doesn't return it (prevent crash)
               const radarData = product.radar && product.radar.length > 0 ? product.radar : [
                 { name: '性能', value: 8 }, { name: '价格', value: 7 }, 
                 { name: '外观', value: 8 }, { name: '续航', value: 6 },
                 { name: '功能', value: 8 }, { name: '推荐', value: product.sentiment_score }
               ];

               return (
                 <div key={idx} className="bg-slate-800/40 border border-slate-700 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all hover:shadow-lg hover:shadow-indigo-500/10 flex flex-col relative group backdrop-blur-sm">
                    
                    {/* Header */}
                    <div className="p-5 border-b border-slate-700/50 bg-gradient-to-b from-slate-800/50 to-transparent">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors leading-tight pr-2">
                          {product.model_name}
                        </h3>
                        {isNew && (
                           <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white animate-pulse shadow shadow-rose-500/20">NEW</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-indigo-300 font-mono font-bold">{product.price_range}</span>
                         <span className="text-xs text-slate-500 bg-slate-900/50 px-2 py-1 rounded border border-slate-800">{displayPositioning}</span>
                      </div>
                    </div>

                    {/* Radar Chart Area */}
                    <div className="h-64 w-full relative -mt-2">
                       <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                            <PolarGrid gridType="polygon" stroke="#334155" />
                            <PolarAngleAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                            <Radar
                              name={product.model_name}
                              dataKey="value"
                              stroke="#818cf8"
                              strokeWidth={2}
                              fill="#6366f1"
                              fillOpacity={0.3}
                            />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9', fontSize: '12px', borderRadius: '8px' }}
                              itemStyle={{ color: '#818cf8' }}
                            />
                          </RadarChart>
                       </ResponsiveContainer>
                       
                       {/* Score Badge Overlay */}
                       <div className="absolute top-2 right-4 flex flex-col items-end">
                          <div className="flex items-center gap-1 text-slate-400 text-[10px] uppercase tracking-wider">综合评分</div>
                          <div className={`text-2xl font-bold ${product.sentiment_score >= 9 ? 'text-emerald-400' : product.sentiment_score >= 7.5 ? 'text-indigo-400' : 'text-amber-400'}`}>
                            {product.sentiment_score}
                          </div>
                       </div>
                    </div>

                    {/* Footer Info */}
                    <div className="p-4 pt-0 mt-auto">
                       <p className="text-xs text-slate-400 line-clamp-2 bg-slate-900/30 p-2 rounded border border-slate-800/50 italic">
                         "{product.user_sentiment}"
                       </p>
                    </div>
                 </div>
               )
            })}
         </div>
      )}

      {/* VIEW: SPEC COMPARISON (Refined Bar Chart & Table) */}
      {viewMode === 'compare' && (
         <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                    <BarChart2 size={20} className="text-indigo-400"/> 参数横评
                </h4>
                <p className="text-sm text-slate-400">选择不同参数进行横向对比</p>
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
      )}

      {/* VIEW: LIST DETAILS */}
      <div className={viewMode === 'list' ? 'block' : 'hidden'}>
        <div className="grid grid-cols-1 gap-6">
          {products.map((product, idx) => {
             const isNew = product.positioning.includes('【新品】');
             const displayPositioning = product.positioning.replace('【新品】', '').replace('【', '').replace('】', '').trim();

             return (
            <div key={idx} className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-colors group">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">{product.model_name}</h3>
                    {isNew && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30 animate-pulse">
                        NEW
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-medium border border-indigo-500/20">
                      {displayPositioning}
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
          )})}
        </div>
      </div>
    </div>
  );
};
