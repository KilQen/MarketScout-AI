
import React from 'react';
import { Brand } from '../types';
import { ArrowRight } from './Icons';

interface BrandCardProps {
  brand: Brand;
  onClick: (brand: Brand) => void;
}

export const BrandCard: React.FC<BrandCardProps> = ({ brand, onClick }) => {
  return (
    <div 
      onClick={() => onClick(brand)}
      className="group relative bg-slate-800 border border-slate-700 rounded-xl p-6 cursor-pointer hover:border-indigo-500 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 overflow-hidden"
    >
      {/* Accent Line */}
      <div 
        className="absolute top-0 left-0 w-full h-1 transition-all group-hover:h-1.5" 
        style={{ backgroundColor: brand.brand_color || '#6366f1' }}
      />
      
      <div className="flex justify-between items-start mb-4 mt-2">
        <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
          {brand.name}
        </h3>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          brand.market_tier === '奢侈' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
          brand.market_tier === '高端' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
          brand.market_tier === '专业' ? 'bg-slate-500/20 text-slate-300 border border-slate-500/30' :
          brand.market_tier === '中端' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
          'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
        }`}>
          {brand.market_tier}
        </span>
      </div>
      
      <p className="text-indigo-200 font-semibold text-sm mb-2">{brand.positioning}</p>
      <p className="text-slate-400 text-sm leading-relaxed mb-4 line-clamp-3">
        {brand.description}
      </p>

      <div className="flex items-center justify-between mt-auto">
        <span className="text-xs text-slate-500 uppercase tracking-wider font-medium truncate max-w-[70%]">
          受众: {brand.audience}
        </span>
        <div className="bg-slate-700 p-2 rounded-full group-hover:bg-indigo-600 transition-colors">
          <ArrowRight size={16} className="text-white" />
        </div>
      </div>
    </div>
  );
};
