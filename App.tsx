
import React, { useState, useRef } from 'react';
import { Search, Loader2, ChevronLeft, Tag } from './components/Icons';
import { Brand, Product, AnalysisState, SourceLink } from './types';
import { fetchBrandsForCategory, fetchProductsForBrand } from './services/geminiService';
import { BrandCard } from './components/BrandCard';
import { ProductList } from './components/ProductList';

function App() {
  const [categoryInput, setCategoryInput] = useState('');
  const [appState, setAppState] = useState<AnalysisState>({ status: 'idle' });
  
  const [selectedCategory, setSelectedCategory] = useState('');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sources, setSources] = useState<SourceLink[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryInput.trim()) return;

    setAppState({ status: 'loading_brands' });
    setBrands([]);
    setSelectedBrand(null);
    setProducts([]);
    setSources([]);
    setSelectedCategory(categoryInput);

    try {
      const result = await fetchBrandsForCategory(categoryInput);
      setBrands(result.brands);
      setSources(result.sources);
      setAppState({ status: 'selecting_brand' });
    } catch (error) {
      setAppState({ status: 'error', error: '分析失败，请稍后重试。' });
    }
  };

  const handleBrandSelect = async (brand: Brand) => {
    setSelectedBrand(brand);
    setAppState({ status: 'loading_products' });
    setSources([]); 

    try {
      const result = await fetchProductsForBrand(brand.name, selectedCategory);
      setProducts(result.products);
      setSources(result.sources); 
      setAppState({ status: 'viewing_products' });
    } catch (error) {
      setAppState({ status: 'error', error: `无法获取 ${brand.name} 的产品数据。` });
    }
  };

  const handleBackToBrands = () => {
    setAppState({ status: 'selecting_brand' });
    setSelectedBrand(null);
    setProducts([]);
    setSources([]); 
  };

  const handleReset = () => {
    setAppState({ status: 'idle' });
    setCategoryInput('');
    setBrands([]);
    setSelectedBrand(null);
    setProducts([]);
    setSources([]);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleReset}>
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Tag className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              MarketScout AI
            </span>
          </div>
          
          {appState.status !== 'idle' && (
            <button 
              onClick={handleReset}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              新搜索
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Idle State - Search Hero */}
        {appState.status === 'idle' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-fade-in">
            <div className="space-y-4 max-w-2xl">
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white">
                洞察 <span className="text-indigo-500">产品市场</span> 的每一处细节
              </h1>
              <p className="text-lg text-slate-400">
                基于 AI 实时搜索，一键分析品牌定位、产品参数与市场风评。
              </p>
            </div>

            <form onSubmit={handleSearch} className="w-full max-w-lg relative group">
              <input
                ref={inputRef}
                type="text"
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                placeholder="输入品类 (例如: 降噪耳机, 电动SUV, 机械键盘)"
                className="w-full px-6 py-4 bg-slate-900 border border-slate-700 rounded-full text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-2xl shadow-black/50"
              />
              <button 
                type="submit"
                className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full px-6 transition-colors flex items-center justify-center"
              >
                <Search size={20} />
              </button>
            </form>

            <div className="flex gap-3 text-sm text-slate-500">
              <span>尝试搜索:</span>
              {['智能手表', '游戏笔记本', '跑鞋', '扫地机器人'].map((suggestion) => (
                <button 
                  key={suggestion}
                  onClick={() => {
                    setCategoryInput(suggestion);
                  }}
                  className="hover:text-indigo-400 underline decoration-slate-700 underline-offset-4 hover:decoration-indigo-500 transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading States */}
        {(appState.status === 'loading_brands' || appState.status === 'loading_products') && (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
            <h2 className="text-2xl font-semibold text-white animate-pulse">
              {appState.status === 'loading_brands' ? '正在分析市场格局...' : '正在深度调研产品阵容...'}
            </h2>
            <p className="text-slate-400 mt-2">正在从全网聚合最新数据...</p>
          </div>
        )}

        {/* Error State */}
        {appState.status === 'error' && (
          <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
            <div className="text-rose-500 text-5xl font-bold">!</div>
            <p className="text-xl text-white">{appState.error}</p>
            <button 
              onClick={handleReset}
              className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors"
            >
              重试
            </button>
          </div>
        )}

        {/* Brand Selection Grid */}
        {appState.status === 'selecting_brand' && brands.length > 0 && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-end border-b border-slate-800 pb-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">市场分析: <span className="text-indigo-400">{selectedCategory}</span></h2>
                <p className="text-slate-400">选择一个品牌以查看其详细产品线和参数对比。</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {brands.map((brand, index) => (
                <BrandCard key={index} brand={brand} onClick={handleBrandSelect} />
              ))}
            </div>

            {sources.length > 0 && (
              <div className="mt-12 pt-6 border-t border-slate-800">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">信息来源</h4>
                <div className="flex flex-wrap gap-3">
                  {sources.map((source, idx) => (
                    <a 
                      key={idx} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-400 hover:text-indigo-300 truncate max-w-xs bg-slate-900 px-3 py-1 rounded border border-slate-800 hover:border-slate-700 transition-all"
                    >
                      {source.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Product View */}
        {appState.status === 'viewing_products' && selectedBrand && (
          <div className="space-y-8">
            <button 
              onClick={handleBackToBrands}
              className="flex items-center text-slate-400 hover:text-white transition-colors group"
            >
              <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
              返回品牌列表
            </button>

            <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-slate-800 pb-8">
              <div>
                <h2 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                  {selectedBrand.name}
                  <span className="text-sm px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-normal">
                    {selectedBrand.market_tier}
                  </span>
                </h2>
                <p className="text-slate-400 max-w-2xl">{selectedBrand.description}</p>
              </div>
            </div>

            <ProductList brandName={selectedBrand.name} products={products} />

            {sources.length > 0 && (
              <div className="mt-12 pt-6 border-t border-slate-800">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">信息来源</h4>
                <div className="flex flex-wrap gap-3">
                  {sources.map((source, idx) => (
                    <a 
                      key={idx} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-400 hover:text-indigo-300 truncate max-w-xs bg-slate-900 px-3 py-1 rounded border border-slate-800 hover:border-slate-700 transition-all"
                    >
                      {source.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
