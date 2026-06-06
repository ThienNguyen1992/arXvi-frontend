import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPaperById, addHistoryPaper } from '@/lib/api';
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

  // Track history when viewing paper
  useEffect(() => {
    if (id) {
      addHistoryPaper(id);
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
  
  // Custom logic to colorize badges based on typical status strings
  const getStatusColor = (s: string) => {
    const lower = s.toLowerCase();
    if (lower.includes('publish')) return 'bg-cabbage-50/20 text-cabbage-50 border-cabbage-50/40';
    if (lower.includes('review') || lower.includes('pending')) return 'bg-amber-500/20 text-amber-500 border-amber-500/40';
    if (lower.includes('withdraw') || lower.includes('reject')) return 'bg-ketchup-40/20 text-ketchup-40 border-ketchup-40/40';
    return 'bg-secondary/20 text-secondary border-secondary/40';
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 font-medium"
        >
          <ArrowLeft size={20} />
          <span>Back to Feed</span>
        </button>

        <div className="bg-card border border-border rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
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
      </div>
    </div>
  );
};

export default PaperDetailPage;
