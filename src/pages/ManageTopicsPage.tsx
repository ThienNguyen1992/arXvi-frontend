import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, getUserTopics, updateUserTopics } from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { ArrowLeft, Save, Tag } from 'lucide-react';

const ManageTopicsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  
  React.useEffect(() => {
    document.title = "Manage Topics | arXvi";
  }, []);
  
  // 1. Fetch user's current topics to pre-select
  const { data: userTopicsData, isLoading: isLoadingUser } = useQuery({
    queryKey: ['userTopics'],
    queryFn: getUserTopics,
  });

  // 2. Fetch all categories and nested topics
  const { data: categoriesData, isLoading: isLoadingCats } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  // Initialize selected set
  useEffect(() => {
    if (!userTopicsData) return;
    
    const codes = new Set<string>();
    
    // userTopicsData might be an array of Categories (which contain topics array)
    // or an array of Topics, or a string array. We must handle all safely.
    let dataArray = Array.isArray(userTopicsData) ? userTopicsData : (userTopicsData.data || []);
    
    dataArray.forEach((item: any) => {
      if (typeof item === 'string') {
        codes.add(item);
      } else if (item.topics && Array.isArray(item.topics)) {
        // It's a category containing topics
        item.topics.forEach((nestedTopic: any) => {
          if (nestedTopic.code) codes.add(nestedTopic.code);
        });
      } else if (item.code) {
        // It's a topic object directly
        codes.add(item.code);
      }
    });
    
    setSelectedCodes(codes);
  }, [userTopicsData]);

  const toggleTopic = (code: string) => {
    const next = new Set(selectedCodes);
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    setSelectedCodes(next);
  };

  const toggleSelectAll = (allTopicCodes: string[]) => {
    const allSelected =
      allTopicCodes.length > 0 && allTopicCodes.every((code) => selectedCodes.has(code));

    if (allSelected) {
      setSelectedCodes(new Set());
      return;
    }

    setSelectedCodes(new Set(allTopicCodes));
  };

  const saveMutation = useMutation({
    mutationFn: (codes: string[]) => updateUserTopics(codes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userTopics'] });
      queryClient.invalidateQueries({ queryKey: ['papers', 'feed'] });
      toast('Topics saved successfully!', 'success');
      setTimeout(() => navigate('/home'), 1500);
    },
    onError: (error: Error) => {
      toast(error.message || 'Failed to save topics. Please try again.', 'error');
    },
  });

  const handleSave = () => {
    saveMutation.mutate(Array.from(selectedCodes));
  };

  if (isLoadingUser || isLoadingCats) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Spinner size={48} className="text-primary" />
      </div>
    );
  }

  const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.data || []);
  const allTopicCodes: string[] = categories.flatMap((category: { topics?: Array<{ code?: string }> }) =>
    (category.topics || []).map((topic) => topic.code).filter((code): code is string => !!code)
  );
  const allSelected =
    allTopicCodes.length > 0 && allTopicCodes.every((code: string) => selectedCodes.has(code));

  return (
    <div className="-mx-8 -mt-8 flex min-h-full flex-col text-foreground">
      <header className="sticky top-0 z-20 flex shrink-0 items-center justify-between border-b border-border bg-background/95 px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="cursor-pointer rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Back to home"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/20 p-1.5 text-primary">
              <Tag size={18} />
            </div>
            <h1 className="text-base font-bold sm:text-lg">Manage Your Topics</h1>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saveMutation.isPending || selectedCodes.size < 3}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:px-5 sm:py-2.5 sm:text-base"
        >
          {saveMutation.isPending ? (
            <Spinner size={18} className="text-primary-foreground" />
          ) : (
            <Save size={18} />
          )}
          Save Changes
        </button>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-6 md:px-8 md:py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8">
          <p className="text-muted-foreground text-lg">
            Customize your feed by selecting the topics that interest you. You have currently selected{' '}
            <strong className={selectedCodes.size >= 3 ? 'text-primary' : 'text-destructive'}>
              {selectedCodes.size}
            </strong>{' '}
            topics.
          </p>
          {selectedCodes.size < 3 && (
            <p className="mt-2 text-sm text-destructive flex items-center gap-1.5">
              <span>⚠</span> Please select at least <strong>3 topics</strong> to continue ({3 - selectedCodes.size} more needed).
            </p>
          )}

          <label className="mt-5 inline-flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm transition-colors hover:bg-accent/40">
            <input
              type="checkbox"
              className="size-4 shrink-0 cursor-pointer accent-primary"
              checked={allSelected}
              onChange={() => toggleSelectAll(allTopicCodes)}
            />
            <span className="text-sm font-semibold text-foreground">
              {allSelected ? 'Deselect all topics' : 'Select all topics'}
            </span>
          </label>
        </div>

        <div className="flex flex-col gap-10">
          {categories.map((category: any) => {
            const nestedTopics = category.topics || [];
            if (nestedTopics.length === 0) return null;

            return (
              <div key={category.id} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="mb-6 pb-4 border-b border-border/50">
                  <h2 className="text-2xl font-bold text-foreground">{category.title || category.name}</h2>
                  {category.description && (
                    <p className="text-muted-foreground mt-2">{category.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {nestedTopics.map((topic: any) => {
                    const isSelected = selectedCodes.has(topic.code);
                    
                    return (
                      <div
                        key={topic.id || topic.code}
                        onClick={() => toggleTopic(topic.code)}
                        className={`cursor-pointer border rounded-xl p-4 transition-all duration-200 select-none flex flex-col justify-center
                          ${isSelected 
                            ? 'bg-primary/10 border-primary text-primary shadow-sm shadow-primary/10 ring-1 ring-primary/20' 
                            : 'bg-background border-border hover:border-primary/50 hover:bg-accent/50 text-foreground'
                          }
                        `}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-bold leading-tight">
                            {topic.title || topic.name}
                          </h4>
                          {/* Checkbox indicator */}
                          <div className={`shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors
                            ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-background'}
                          `}>
                            {isSelected && (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md
                            ${isSelected ? 'bg-primary/20 text-primary' : 'bg-secondary/30 text-muted-foreground'}
                          `}>
                            #{topic.code}
                          </span>
                        </div>
                        
                        {topic.description && (
                          <p className={`text-xs mt-3 line-clamp-2 ${isSelected ? 'text-primary/80' : 'text-muted-foreground'}`}>
                            {topic.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  )
};

export default ManageTopicsPage;
