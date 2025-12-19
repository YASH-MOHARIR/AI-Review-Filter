import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CATEGORY_COLORS } from './constants';
import { ReviewData, ReviewCategory, Sentiment } from './types';
import { analyzeReviewWithGemini } from './services/geminiService';
import { Sparkles, Loader2, X, RotateCw } from 'lucide-react';

// --- GOOGLE MAPS SPECIFIC SELECTORS ---
const SELECTORS = {
  REVIEW_CONTAINER: '.jftiEf', 
  TEXT: '.wiI7pd',
  AUTHOR: '.d4r55',
  DATE: '.rsqaWe'
};

// Helper for inline badge styles
const getBadgeStyle = (category: ReviewCategory | string, type: 'category' | 'sentiment') => {
    if (type === 'sentiment') {
        if (category === Sentiment.POSITIVE) return { backgroundColor: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0' };
        if (category === Sentiment.NEGATIVE) return { backgroundColor: '#fef2f2', color: '#b91c1c', borderColor: '#fecaca' };
        return { backgroundColor: '#f9fafb', color: '#4b5563', borderColor: '#e5e7eb' };
    }
    // Categories
    switch(category) {
        case ReviewCategory.FOOD: return { backgroundColor: '#ffedd5', color: '#9a3412', borderColor: '#fed7aa' };
        case ReviewCategory.DELIVERY: return { backgroundColor: '#dbeafe', color: '#1e40af', borderColor: '#bfdbfe' };
        case ReviewCategory.AMBIENCE: return { backgroundColor: '#f3e8ff', color: '#6b21a8', borderColor: '#e9d5ff' };
        case ReviewCategory.SERVICE: return { backgroundColor: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' };
        case ReviewCategory.PRICE: return { backgroundColor: '#f3f4f6', color: '#1f2937', borderColor: '#e5e7eb' };
        default: return { backgroundColor: '#f3f4f6', color: '#374151', borderColor: '#e5e7eb' };
    }
};

// Robust hash function to generate IDs from text (safe for Emojis/Unicode)
const generateReviewId = (text: string): string => {
  let hash = 0;
  if (text.length === 0) return '0';
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};

const ReviewBadges: React.FC<{ review: ReviewData }> = ({ review }) => {
  if (review.tags.length === 0) return null;
  return (
    <div className="sr-badge-row">
      {review.tags.map(tag => (
        <span key={tag} className="sr-badge" style={getBadgeStyle(tag, 'category')}>
          {tag}
        </span>
      ))}
      {review.sentiment && (
        <span className="sr-badge" style={getBadgeStyle(review.sentiment, 'sentiment')}>
          {review.sentiment}
        </span>
      )}
    </div>
  );
};

const ExtensionControlPanel: React.FC<{
  reviews: ReviewData[];
  selectedFilters: ReviewCategory[];
  toggleFilter: (c: ReviewCategory) => void;
  clearFilters: () => void;
  isProcessing: boolean;
  progress: number;
  onRescan: () => void;
}> = ({ reviews, selectedFilters, toggleFilter, clearFilters, isProcessing, progress, onRescan }) => {
  
  const getMatchCount = (category: ReviewCategory) => {
    const potentialFilters = selectedFilters.includes(category) 
        ? selectedFilters 
        : [...selectedFilters, category];
    
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
    <div className="sr-panel">
      <div className="sr-header">
        <div className="sr-title-group">
            <div className="sr-icon-box">
               <Sparkles size={16} color="white" />
            </div>
            <div>
                <h3 className="sr-title">Smart Review AI</h3>
            </div>
        </div>
        <button 
            onClick={onRescan}
            disabled={isProcessing}
            className="sr-btn-icon" 
            title="Rescan for new reviews"
        >
            <RotateCw size={16} color="#4b5563" className={isProcessing ? 'animate-spin' : ''} />
        </button>
      </div>

      {isProcessing && (
         <div style={{ marginBottom: '12px' }}>
            <div className="sr-progress-bar">
                <div className="sr-progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <p style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center' }}>Analyzing visible reviews... {progress}%</p>
         </div>
      )}

      {/* Stats */}
      <div className="sr-stats-grid">
          <div className="sr-stat-card">
             <div className="sr-stat-label">Visible</div>
             <div className="sr-stat-value">
                 {visibleReviews.length} <span style={{ fontSize: '12px', fontWeight: '400', color: '#9ca3af' }}>/ {reviews.length}</span>
             </div>
         </div>
         <div className="sr-stat-card">
             <div className="sr-stat-label">Avg Rating</div>
             <div className="sr-stat-value">
                 {visibleReviews.length > 0 
                    ? (visibleReviews.reduce((acc, r) => acc + r.rating, 0) / visibleReviews.length).toFixed(1) 
                    : '-'
                 } 
                 <span style={{ color: '#eab308', fontSize: '14px' }}>★</span>
             </div>
         </div>
      </div>

      <div className="sr-filters-section">
         <div className="sr-filters-header">
            <span className="sr-filter-label">Topics</span>
            {selectedFilters.length > 0 && (
                <button onClick={clearFilters} className="sr-clear-btn">
                    Clear <X size={10}/>
                </button>
            )}
         </div>
         <div className="sr-chips-container">
            {Object.values(ReviewCategory).map(cat => {
                const isActive = selectedFilters.includes(cat);
                const count = getMatchCount(cat);
                const disabled = count === 0 && !isActive;

                return (
                    <button
                        key={cat}
                        onClick={() => toggleFilter(cat)}
                        disabled={disabled}
                        className={`sr-chip ${isActive ? 'active' : ''}`}
                    >
                        {cat}
                        <span className="sr-chip-count">
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


const App: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<ReviewCategory[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const processedIdsRef = useRef<Set<string>>(new Set());

  const scanAndAnalyze = async () => {
    setIsProcessing(true);
    setProgress(0);

    const reviewElements = document.querySelectorAll(SELECTORS.REVIEW_CONTAINER);
    const newReviews: ReviewData[] = [];
    const elementsArray = Array.from(reviewElements);
    let count = 0;
    const BATCH_LIMIT = 5; 
    let apiCalls = 0;

    for (const el of elementsArray) {
        const htmlEl = el as HTMLElement;
        const textEl = htmlEl.querySelector(SELECTORS.TEXT);
        if (!textEl || !textEl.textContent) continue;

        const text = textEl.textContent;
        
        // FIX: Use safe hash instead of btoa
        const id = generateReviewId(text + htmlEl.querySelector(SELECTORS.AUTHOR)?.textContent);

        if (processedIdsRef.current.has(id)) {
            const existing = reviews.find(r => r.id === id);
            if (existing) {
               // Update DOM reference just in case re-render detached it
               existing.domElement = htmlEl;
               newReviews.push(existing);
            }
            continue;
        }

        if (apiCalls >= BATCH_LIMIT) continue; 

        let injectionPoint = htmlEl.querySelector('.smart-review-injection') as HTMLElement;
        if (!injectionPoint) {
            injectionPoint = document.createElement('div');
            injectionPoint.className = 'smart-review-injection';
            textEl.parentElement?.appendChild(injectionPoint);
        }

        apiCalls++;
        let analysis;
        try {
            analysis = await analyzeReviewWithGemini(text);
        } catch (e) {
            console.error("Analysis failed", e);
            continue;
        }

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

        const ratingEl = htmlEl.querySelector('span[role="img"]');
        let rating = 0;
        if (ratingEl) {
             const label = ratingEl.getAttribute('aria-label') || '';
             rating = parseInt(label) || 0;
        }

        const reviewData: ReviewData = {
            id,
            author: htmlEl.querySelector(SELECTORS.AUTHOR)?.textContent || 'Unknown',
            date: htmlEl.querySelector(SELECTORS.DATE)?.textContent || '',
            rating, 
            text,
            tags,
            sentiment,
            highlight: analysis.shortSummary,
            domElement: htmlEl,
            injectionPoint
        };

        processedIdsRef.current.add(id);
        newReviews.push(reviewData);

        count++;
        setProgress(Math.round((count / BATCH_LIMIT) * 100));
    }

    setReviews(prev => [...prev, ...newReviews]);
    setIsProcessing(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        scanAndAnalyze();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    reviews.forEach(review => {
        const isMatch = selectedFilters.length === 0 || selectedFilters.every(f => review.tags.includes(f));
        if (review.domElement) {
             if (isMatch) {
                review.domElement.style.display = ''; 
                review.domElement.style.opacity = '1';
            } else {
                review.domElement.style.display = 'none';
            }
        }
    });
  }, [selectedFilters, reviews]);

  const toggleFilter = (cat: ReviewCategory) => {
    setSelectedFilters(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  return (
    <>
      <ExtensionControlPanel 
         reviews={reviews} 
         selectedFilters={selectedFilters}
         toggleFilter={toggleFilter}
         clearFilters={() => setSelectedFilters([])}
         isProcessing={isProcessing}
         progress={progress}
         onRescan={scanAndAnalyze}
      />

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