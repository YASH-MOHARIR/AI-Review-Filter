import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { CATEGORY_COLORS } from './constants';
import { ReviewData, ReviewCategory, Sentiment } from './types';
import { analyzeReviewWithGemini } from './services/geminiService';
import { Filter, Sparkles, Loader2, X } from 'lucide-react';
import { StatsPanel } from './components/StatsPanel';

// --- COMPONENTS FOR INJECTION ---

// 1. The Badge Component we inject into each Google Review
const ReviewBadges: React.FC<{ review: ReviewData }> = ({ review }) => {
  if (review.tags.length === 0) return null;
  return (
    <>
      {review.tags.map(tag => (
        <span key={tag} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${CATEGORY_COLORS[tag]}`}>
          {tag}
        </span>
      ))}
      {review.sentiment && (
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
          review.sentiment === Sentiment.POSITIVE ? 'bg-green-50 text-green-700 border-green-200' :
          review.sentiment === Sentiment.NEGATIVE ? 'bg-red-50 text-red-700 border-red-200' :
          'bg-gray-50 text-gray-600 border-gray-200'
        }`}>
          {review.sentiment}
        </span>
      )}
    </>
  );
};

// 2. The Main Control Panel (The Extension UI)
const ExtensionControlPanel: React.FC<{
  reviews: ReviewData[];
  selectedFilters: ReviewCategory[];
  toggleFilter: (c: ReviewCategory) => void;
  clearFilters: () => void;
  isProcessing: boolean;
  progress: number;
}> = ({ reviews, selectedFilters, toggleFilter, clearFilters, isProcessing, progress }) => {
  
  // Calculate potential matches for each filter based on current active filters
  const getMatchCount = (category: ReviewCategory) => {
    // If we add this category to the existing filters...
    const potentialFilters = selectedFilters.includes(category) 
        ? selectedFilters // It's already there
        : [...selectedFilters, category];
    
    // How many reviews match ALL these filters?
    return reviews.filter(r => 
        potentialFilters.every(f => r.tags.includes(f))
    ).length;
  };

  const visibleReviews = useMemo(() => {
     if (selectedFilters.length === 0) return reviews;
     return reviews.filter(review => 
       selectedFilters.every(filter => review.tags.includes(filter))
     );
  }, [reviews, selectedFilters]);

  return (
    <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-md">
               <Sparkles className="text-white w-4 h-4" />
            </div>
            <div>
                <h3 className="font-bold text-gray-900 text-sm">Smart Review AI</h3>
                <p className="text-xs text-gray-500">Chrome Extension Mode</p>
            </div>
        </div>
        
        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium bg-indigo-50 px-3 py-1 rounded-full">
            <Loader2 className="w-3 h-3 animate-spin" />
            Analyzing Page ({progress}%)
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="mb-4 grid grid-cols-2 gap-2">
         <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
             <div className="text-xs text-gray-500 mb-1">Adjusted Rating</div>
             <div className="text-2xl font-bold text-gray-900">
                 {visibleReviews.length > 0 
                    ? (visibleReviews.reduce((acc, r) => acc + 4, 0) / visibleReviews.length + (Math.random() * 0.5)).toFixed(1) // Mocking rating math based on HTML scraping limitation
                    : 'N/A'
                 } 
                 <span className="text-yellow-500 text-base ml-1">★</span>
             </div>
         </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
             <div className="text-xs text-gray-500 mb-1">Visible Reviews</div>
             <div className="text-2xl font-bold text-gray-900">
                 {visibleReviews.length} <span className="text-gray-400 text-sm font-normal">/ {reviews.length}</span>
             </div>
         </div>
      </div>

      <div className="space-y-2">
         <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Filter by Topic</span>
            {selectedFilters.length > 0 && (
                <button onClick={clearFilters} className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                    Clear <X size={10}/>
                </button>
            )}
         </div>
         <div className="flex flex-wrap gap-2">
            {Object.values(ReviewCategory).map(cat => {
                const isActive = selectedFilters.includes(cat);
                const count = getMatchCount(cat);
                const disabled = count === 0 && !isActive;

                return (
                    <button
                        key={cat}
                        onClick={() => toggleFilter(cat)}
                        disabled={disabled}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-2 ${
                            isActive 
                            ? 'bg-gray-800 text-white border-gray-800 shadow-sm'
                            : disabled
                                ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                        }`}
                    >
                        {cat}
                        <span className={`text-[10px] px-1 rounded ${isActive ? 'bg-white/20' : 'bg-gray-100'}`}>
                            {count}
                        </span>
                    </button>
                )
            })}
         </div>
      </div>
    </div>
  );
};


// --- MAIN APP (CONTENT SCRIPT CONTROLLER) ---

const App: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<ReviewCategory[]>([]);
  const [isProcessing, setIsProcessing] = useState(true);
  const [progress, setProgress] = useState(0);

  // 1. "Content Script" Logic: Scrape the DOM on mount
  useEffect(() => {
    const init = async () => {
      // Find all elements that look like a google review (based on our index.html structure)
      const reviewElements = document.querySelectorAll('.g-review');
      const scrapedData: ReviewData[] = [];
      let processedCount = 0;

      for (const el of Array.from(reviewElements)) {
        const htmlEl = el as HTMLElement;
        const textEl = htmlEl.querySelector('.g-text');
        const authorEl = htmlEl.querySelector('.g-name');
        const injectionPoint = htmlEl.querySelector('.ai-badge-injection-point') as HTMLElement;
        
        if (textEl && authorEl) {
            const text = textEl.textContent || '';
            
            // ANALYZE WITH GEMINI
            // In a real extension, this would send a message to background.js
            let analysis;
            try {
                analysis = await analyzeReviewWithGemini(text);
            } catch (e) {
                console.error("Analysis failed", e);
                analysis = { categories: [], sentiment: Sentiment.NEUTRAL, shortSummary: '' };
            }

            // Map strings to Enums
            const tags: ReviewCategory[] = analysis.categories
                .map(c => {
                    const norm = c.charAt(0).toUpperCase() + c.slice(1).toLowerCase();
                    return Object.values(ReviewCategory).includes(norm as ReviewCategory) 
                        ? (norm as ReviewCategory) 
                        : null;
                })
                .filter((t): t is ReviewCategory => t !== null);
            
            let sentiment = Sentiment.NEUTRAL;
            if (analysis.sentiment.toLowerCase().includes('positive')) sentiment = Sentiment.POSITIVE;
            if (analysis.sentiment.toLowerCase().includes('negative')) sentiment = Sentiment.NEGATIVE;

            scrapedData.push({
                id: htmlEl.dataset.reviewId || Math.random().toString(),
                author: authorEl.textContent || 'Unknown',
                date: 'Recently',
                rating: 4, // Mock rating scraping
                text,
                tags,
                sentiment,
                highlight: analysis.shortSummary,
                domElement: htmlEl,
                injectionPoint: injectionPoint
            });
        }
        processedCount++;
        setProgress(Math.round((processedCount / reviewElements.length) * 100));
      }

      setReviews(scrapedData);
      setIsProcessing(false);
    };

    // Slight delay to simulate extension loading after page load
    setTimeout(init, 500);
  }, []);

  // 2. Filter Effect: Manipulate the Real DOM
  useEffect(() => {
    reviews.forEach(review => {
        // Strict AND logic
        const isMatch = selectedFilters.length === 0 || selectedFilters.every(f => review.tags.includes(f));
        
        if (isMatch) {
            review.domElement.style.display = 'block';
            review.domElement.style.opacity = '1';
        } else {
            review.domElement.style.display = 'none';
        }
    });
  }, [selectedFilters, reviews]);

  const toggleFilter = (cat: ReviewCategory) => {
    setSelectedFilters(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  return (
    <>
      {/* 1. Render the Control Panel at the top */}
      <ExtensionControlPanel 
         reviews={reviews} 
         selectedFilters={selectedFilters}
         toggleFilter={toggleFilter}
         clearFilters={() => setSelectedFilters([])}
         isProcessing={isProcessing}
         progress={progress}
      />

      {/* 2. Render Badges into the Reviews using Portals */}
      {reviews.map(review => {
          if (!review.injectionPoint) return null;
          return createPortal(
              <ReviewBadges review={review} />,
              review.injectionPoint
          );
      })}
    </>
  );
};

export default App;
