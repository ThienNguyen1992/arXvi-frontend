import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getCategories, updateUserTopics } from '@/lib/api';
import { useCategoryStore, type Category } from '@/store/useCategoryStore';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircle2, Circle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TourPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Welcome Tour | arXvi";
  }, []);

  const { data: categories, isLoading, error } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const {
    selectedCategoryIds,
    selectedTopicCodes,
    toggleCategory,
    toggleTopic,
  } = useCategoryStore();

  const mutation = useMutation({
    mutationFn: (topicCodes: string[]) => updateUserTopics(topicCodes),
    onSuccess: () => {
      navigate('/home');
    },
    onError: (error: any) => {
      setSubmitError(error.message || 'Failed to update topics');
    },
  });

  const handleSubmit = () => {
    setSubmitError(null);
    mutation.mutate(selectedTopicCodes);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Spinner size={40} className="text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center text-destructive">
        Failed to load categories
      </div>
    );
  }

  const safeCategories = Array.isArray(categories) ? categories : [];
  const selectedCategories = safeCategories.filter((cat) =>
    selectedCategoryIds.includes(cat.id)
  );

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">

        {/* ── Step 1: Choose Categories ── */}
        {step === 1 && (
          <>
            <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
                What are you interested in?
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Choose the categories you'd like to follow.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 animate-in fade-in slide-in-from-bottom-6 duration-700">
              {safeCategories.map((category) => {
                const isSelected = selectedCategoryIds.includes(category.id);
                return (
                  <div
                    key={category.id}
                    onClick={() => toggleCategory(category.id)}
                    className={`relative flex cursor-pointer rounded-2xl border p-6 shadow-sm transition-all duration-200 ${
                      isSelected
                        ? 'border-primary bg-primary/10 ring-1 ring-primary'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-foreground text-base">
                          {category.title}
                        </span>
                        <span className="shrink-0 rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                          {category.code}
                        </span>
                      </div>
                      <div className="shrink-0">
                        {isSelected ? (
                          <CheckCircle2 className="h-6 w-6 text-primary no-icon-style" />
                        ) : (
                          <Circle className="h-6 w-6 text-primary no-icon-style" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 flex justify-end border-t border-border pt-6 sticky bottom-0 bg-background/80 backdrop-blur-sm pb-6 z-10">
              <Button
                onClick={() => setStep(2)}
                disabled={selectedCategoryIds.length === 0}
                className="w-full sm:w-auto text-base font-bold px-10 py-6 h-auto rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Next
              </Button>
            </div>
          </>
        )}

        {/* ── Step 2: Choose Topics within selected categories ── */}
        {step === 2 && (
          <>
            <div className="flex items-center mb-10 animate-in fade-in slide-in-from-right-8 duration-500">
              <button
                onClick={() => setStep(1)}
                className="p-2 mr-4 rounded-full hover:bg-card text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">
                  Pick your topics
                </h1>
                <p className="mt-2 text-lg text-muted-foreground">
                  Select specific topics to personalize your feed.{' '}
                  <span className={selectedTopicCodes.length >= 3 ? 'text-primary font-semibold' : 'text-destructive font-semibold'}>
                    {selectedTopicCodes.length} selected
                  </span>
                  {selectedTopicCodes.length < 3 && (
                    <span className="text-destructive"> — {3 - selectedTopicCodes.length} more needed</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-8 duration-700">
              {selectedCategories.map((category) => {
                const topics = Array.isArray(category.topics) ? category.topics : [];
                if (topics.length === 0) return null;

                return (
                  <div
                    key={category.id}
                    className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden"
                  >
                    {/* Category header */}
                    <div className="px-6 py-4 border-b border-border flex items-center gap-3">
                      <h2 className="text-xl font-bold text-foreground">
                        {category.title}
                      </h2>
                      <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                        {category.code}
                      </span>
                    </div>

                    {/* Topics grid */}
                    <div className="p-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {topics.map((topic) => {
                        const isSelected = selectedTopicCodes.includes(topic.code);
                        return (
                          <div
                            key={topic.id || topic.code}
                            onClick={() => toggleTopic(topic.code)}
                            className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
                              isSelected
                                ? 'border-primary bg-primary/10 ring-1 ring-primary'
                                : 'border-border bg-background hover:border-primary/50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex flex-col min-w-0">
                                {/* Title */}
                                <span className="font-semibold text-foreground text-sm">
                                  {topic.title}
                                </span>
                                {/* Code badge */}
                                <span className="mt-1 inline-flex">
                                  <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                                    {topic.code}
                                  </span>
                                </span>
                                {/* Description */}
                                {topic.description && (
                                  <span className="mt-2 text-xs text-muted-foreground line-clamp-2">
                                    {topic.description}
                                  </span>
                                )}
                              </div>
                              <div className="shrink-0 mt-0.5">
                                {isSelected ? (
                                  <CheckCircle2 className="h-5 w-5 text-primary no-icon-style" />
                                ) : (
                                  <Circle className="h-5 w-5 text-primary no-icon-style" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {submitError && (
              <div className="mt-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center animate-in fade-in">
                {submitError}
              </div>
            )}

            <div className="mt-10 flex justify-end border-t border-border pt-6 sticky bottom-0 bg-background/80 backdrop-blur-sm pb-6 z-10">
              <Button
                onClick={handleSubmit}
                disabled={selectedTopicCodes.length < 3 || mutation.isPending}
                loading={mutation.isPending}
                className="w-full sm:w-auto text-base font-bold px-10 py-6 h-auto rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Finish &amp; Continue
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
