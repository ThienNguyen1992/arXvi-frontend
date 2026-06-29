import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, updateUserTopics } from '@/lib/api';
import { CURRENT_USER_QUERY_KEY } from '@/hooks/useCurrentUser';
import { useCategoryStore, type Category } from '@/store/useCategoryStore';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { formatDocumentTitle } from '@/lib/document-title';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CheckCircle2, Circle, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from '@/store/useToastStore';
import { useNavigate } from 'react-router-dom';

export default function TourPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    document.title = formatDocumentTitle("Welcome Tour");
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
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, (current) =>
        current && typeof current === "object"
          ? { ...current, isFirstLogged: false, is_first_logged: false }
          : current
      );
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
      navigate('/home');
    },
    onError: (error: any) => {
      setSubmitError(error.message || 'Failed to update topics');
    },
  });

  const handleSubmit = () => {
    setSubmitError(null);

    if (selectedTopicCodes.length === 0) {
      return;
    }

    if (selectedTopicCodes.length < 3) {
      const remaining = 3 - selectedTopicCodes.length;
      toast.error(
        `Please select at least 3 topics (${remaining} more needed)`
      );
      return;
    }

    mutation.mutate(selectedTopicCodes);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-auth">
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
    <div className="relative min-h-screen bg-gradient-main text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <ThemeToggle className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6" />
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

            <div className="mt-10 sticky bottom-0 z-10 -mx-4 border-t border-border/80 bg-background/90 px-4 pb-6 pt-5 backdrop-blur-md sm:-mx-6 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-center text-sm text-muted-foreground sm:text-left">
                  {selectedCategoryIds.length > 0 ? (
                    <>
                      <span className="font-semibold text-primary">{selectedCategoryIds.length}</span>
                      {' '}categor{selectedCategoryIds.length === 1 ? 'y' : 'ies'} selected
                    </>
                  ) : (
                    'Pick at least one category to continue'
                  )}
                </p>
                <Button
                  size="lg"
                  onClick={() => setStep(2)}
                  disabled={selectedCategoryIds.length === 0}
                  className="group h-12 w-full rounded-2xl px-8 text-base font-bold shadow-glow transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 hover:shadow-lg active:translate-y-0 disabled:hover:translate-y-0 disabled:hover:brightness-100 sm:w-auto sm:min-w-[12.5rem]"
                >
                  Next
                  <ArrowRight className="size-5 transition-transform duration-200 group-hover:translate-x-1 group-disabled:translate-x-0" />
                </Button>
              </div>
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
                disabled={selectedTopicCodes.length === 0 || mutation.isPending}
                loading={mutation.isPending}
                className="h-10 w-full min-w-[9rem] px-8 text-base font-bold rounded-xl sm:w-auto sm:min-w-[11rem]"
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
