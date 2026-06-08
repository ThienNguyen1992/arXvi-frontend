import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPaperById, addHistoryPaper, getCategories, getRecommendedPapers } from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, ExternalLink } from 'lucide-react';

const PaperDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: paper, isLoading, error } = useQuery({
    queryKey: ['paper', id],
    queryFn: () => getPaperById(id!),
    enabled: !!id,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { data: recommendedData, isLoading: isRecommendedLoading } = useQuery({
    queryKey: ['recommendedPapers', id],
    queryFn: () => getRecommendedPapers(id!),
    enabled: !!id,
  });

  const hasRecordedHistory = React.useRef(false);

  useEffect(() => {
    if (paper?.title) {
      document.title = `${paper.title} | arXvi`;
    } else {
      document.title = "Paper Detail | arXvi";
    }
    return () => {
      document.title = "arXvi"; // Reset title when leaving
    };
  }, [paper?.title]);

  // Track history when viewing paper
  useEffect(() => {
    if (id && !hasRecordedHistory.current) {
      addHistoryPaper(id);
      hasRecordedHistory.current = true;
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Spinner size={48} className="text-primary" />
      </div>
    );
  }

  if (error || !paper) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background text-center px-4">
        <p className="text-destructive font-medium mb-4">Failed to load paper details. It might not exist.</p>
        <Button onClick={() => navigate(-1)} className="font-semibold px-8 py-2 rounded-xl">Go Back</Button>
      </div>
    );
  }

  const title = paper.title || paper.name || 'Untitled Paper';
  const abstract = paper.abstract || paper.summary || paper.description || 'No abstract available.';
  const status = paper.status || 'Published';
  
  // Metadata fields
  const formattedDate = paper.published_at || paper.created_at || paper.date 
    ? new Date(paper.published_at || paper.created_at || paper.date).toISOString().split('T')[0]
    : 'Unknown Date';

  const categoriesList = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.data || []);
  const paperCategories = Array.isArray(paper.categories) ? paper.categories : (paper.topics || paper.tags || []);
  
  const categoryNames = paperCategories.map((catCode: any) => {
    if (typeof catCode === 'object') return { category: catCode.title || catCode.code, topic: null, code: catCode.code };
    
    for (const cat of categoriesList) {
      if (cat.code === catCode) {
         return { category: cat.title, topic: null, code: catCode };
      }
      if (cat.topics) {
         const foundTopic = cat.topics.find((t: any) => t.code === catCode);
         if (foundTopic) {
            return { category: cat.title, topic: foundTopic.title, code: catCode };
         }
      }
    }
    
    const parts = catCode.split('.');
    if (parts.length > 1) {
       return { category: parts[0], topic: parts[1], code: catCode };
    }
    return { category: catCode, topic: null, code: catCode };
  });

  const getReadableCategory = (catCode: string) => {
    if (!catCode) return '';
    for (const cat of categoriesList) {
      if (cat.code === catCode) return cat.title;
      if (cat.topics) {
        const foundTopic = cat.topics.find((t: any) => t.code === catCode);
        if (foundTopic) return foundTopic.title;
      }
    }
    const parts = catCode.split('.');
    return parts.length > 1 ? parts[1] : catCode;
  };

  // Custom logic to colorize badges based on typical status strings
  const getStatusColor = (s: string) => {
    const lower = s.toLowerCase();
    if (lower.includes('publish') || lower.includes('accept')) return 'bg-green-500/10 text-green-500 border-green-500/40';
    if (lower.includes('review') || lower.includes('pending') || lower.includes('submit')) return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/40';
    if (lower.includes('withdraw') || lower.includes('reject') || lower.includes('fail')) return 'bg-red-500/10 text-red-500 border-red-500/40';
    if (lower.includes('draft') || lower.includes('new')) return 'bg-blue-500/10 text-blue-500 border-blue-500/40';
    return 'bg-primary/10 text-primary border-primary/40';
  };

  const recommendedPapers = Array.isArray(recommendedData) ? recommendedData : (recommendedData?.data || []);

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button
          onClick={() => navigate('/home')}
          className="group flex w-fit items-center gap-2 rounded-full border-2 border-primary/50 bg-primary/5 px-5 py-2 text-sm font-bold text-primary shadow-sm transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary hover:shadow-md hover:shadow-primary/30 mb-8 cursor-pointer"
        >
          <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
          <span>Back to Feed</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Content Column */}
          <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          {/* Header */}
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground leading-tight flex-1">
              {title}
            </h1>
            <span className={`px-4 py-1.5 rounded-full border text-sm font-bold uppercase tracking-wider shrink-0 ${getStatusColor(status)}`}>
              {status}
            </span>
          </div>

          {/* Authors */}
          {paper.authors && (
            <div className="mb-8">
              <h3 className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-widest">Authors</h3>
              <p className="text-foreground font-medium text-lg">
                {Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors}
              </p>
            </div>
          )}

          {/* Abstract */}
          <div className="mb-10">
            <h3 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">Abstract</h3>
            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-foreground/90 leading-relaxed font-serif">
              <p className="whitespace-pre-wrap">{abstract}</p>
            </div>
          </div>

          {/* Categories & Topics */}
          {categoryNames.length > 0 && (
            <div className="mb-10">
              <h3 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">Categories & Topics</h3>
              <div className="flex flex-wrap gap-3">
                {categoryNames.map((item: any, idx: number) => (
                  <div key={idx} className="flex flex-col bg-card border border-border px-3 py-2 rounded-xl shadow-sm">
                    <span className="text-xs font-bold text-primary mb-0.5">{item.category}</span>
                    {item.topic && <span className="text-sm font-medium text-foreground">{item.topic}</span>}
                    {!item.topic && <span className="text-sm font-medium text-foreground">{item.code}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata Section */}
          <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/30 p-6 rounded-2xl border border-border/50">
            <div>
              <h3 className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-widest">Published At</h3>
              <p className="text-foreground font-medium">{formattedDate}</p>
            </div>
            {paper.current_version && (
              <div>
                <h3 className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-widest">Version</h3>
                <p className="text-foreground font-medium">{paper.current_version}</p>
              </div>
            )}
            {paper.license && (
              <div className="md:col-span-2">
                <h3 className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-widest">License</h3>
                <p className="text-foreground font-medium text-sm break-all">{paper.license}</p>
              </div>
            )}
            {(paper.score !== undefined || paper._score !== undefined) && (
              <div className="flex flex-col items-start">
                <h3 className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-widest">Relevance Score</h3>
                {(() => {
                  const val = Number(paper.score || paper._score);
                  // Determine max scale (10 or 100)
                  const isBase10 = val <= 10;
                  const max = isBase10 ? 10 : 100;
                  const ratio = val / max;
                  
                  let colorClass = "bg-red-500/10 text-red-500 border-red-500/20";
                  if (ratio >= 0.85) colorClass = "bg-green-500/10 text-green-500 border-green-500/20";
                  else if (ratio >= 0.6) colorClass = "bg-blue-500/10 text-blue-500 border-blue-500/20";
                  else if (ratio >= 0.4) colorClass = "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";

                  return (
                    <div className={`flex items-center justify-center px-4 py-2 rounded-xl border-2 font-black text-xl shadow-sm ${colorClass}`}>
                      {val.toFixed(2)}
                      <span className="text-xs font-bold opacity-60 ml-1">/ {max}</span>
                    </div>
                  );
                })()}
              </div>
            )}
            {paper.comments && (
              <div className="md:col-span-2">
                <h3 className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-widest">Comments</h3>
                <p className="text-foreground font-medium text-sm">{paper.comments}</p>
              </div>
            )}
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-4 pt-8 border-t border-border/50">
            {paper.pdf_url && (
              <a
                href={paper.pdf_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                <FileText size={20} />
                View PDF
              </a>
            )}
            
            {paper.doi && (
              <a
                href={paper.doi.startsWith('http') ? paper.doi : `https://doi.org/${paper.doi}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-card text-foreground font-bold hover:bg-accent hover:text-accent-foreground transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
              >
                <ExternalLink size={20} />
                DOI Link
              </a>
            )}
          </div>
        </div>
        
        {/* Sidebar Column */}
        <div className="lg:col-span-1 sticky top-6 h-fit max-h-[calc(100vh-3rem)] overflow-y-auto pr-2 custom-scrollbar">
          <div className="bg-muted/20 border border-border/50 rounded-3xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6">You Might Also Like</h2>
            
            {isRecommendedLoading ? (
              <div className="flex justify-center py-10">
                <Spinner size={32} className="text-primary" />
              </div>
            ) : recommendedPapers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recommendations available.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {recommendedPapers.map((rec: any, idx: number) => {
                  // extract fields
                  const arxivId = rec.arxiv_id || rec.id || rec.paper?.arxiv_id;
                  const recTitle = rec.title || rec.paper?.title || "Untitled";
                  const recAuthors = rec.authors || rec.paper?.authors;
                  const recCats = rec.categories || rec.paper?.categories || rec.topics || [];
                  const recDate = rec.published_at || rec.created_at || rec.date || rec.paper?.published_at;
                  
                  return (
                    <div 
                      key={idx}
                      onClick={() => {
                        if (arxivId) navigate(`/paper/${arxivId}`);
                      }}
                      className="group flex flex-col bg-card border border-border hover:border-primary/50 rounded-2xl cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 overflow-hidden"
                    >
                      <div className="h-28 w-full bg-muted/50 overflow-hidden relative border-b border-border/50">
                        <img 
                          src={`https://picsum.photos/seed/${arxivId || idx}/400/200`} 
                          alt="Cover Placeholder" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100" 
                        />
                        {recCats && recCats.length > 0 && (
                          <span className="absolute bottom-2 right-2 bg-background/90 backdrop-blur-md text-[10px] text-foreground font-bold px-2.5 py-0.5 rounded-full border border-border shadow-sm truncate max-w-[90%]">
                            {getReadableCategory(recCats[0])}
                          </span>
                        )}
                      </div>
                      
                      <div className="p-4 flex flex-col gap-1.5">
                        <h3 className="font-bold text-foreground text-xs line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                          {recTitle}
                        </h3>
                        {recAuthors && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {Array.isArray(recAuthors) ? recAuthors.join(', ') : recAuthors}
                          </p>
                        )}
                        {recDate && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 font-bold uppercase tracking-widest opacity-70">
                            {new Date(recDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default PaperDetailPage;
