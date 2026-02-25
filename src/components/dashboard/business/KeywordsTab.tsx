import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Hash, Loader2, PlusIcon, Sparkles, XIcon } from "lucide-react";
import { Business } from "@/lib/types";
import { Dispatch, SetStateAction } from "react";

interface KeywordsTabProps {
  business: Business | null;
  newKeyword: string;
  setNewKeyword: (value: string) => void;
  handleAddKeyword: () => void;
  handleRemoveKeyword: (keyword: string) => void;
  handleUpdateBusiness: (updates: Partial<Business>) => void;
  suggestedKeywords: string[];
  suggestionsLimit: number;
  setSuggestionsLimit: Dispatch<SetStateAction<number>>;
  displayedSuggestions: string[];
  onAISuggest?: () => void;
  isLoadingAISuggestions?: boolean;
}

export function KeywordsTab({
  business,
  newKeyword,
  setNewKeyword,
  handleAddKeyword,
  handleRemoveKeyword,
  handleUpdateBusiness,
  suggestedKeywords,
  suggestionsLimit,
  setSuggestionsLimit,
  displayedSuggestions,
  onAISuggest,
  isLoadingAISuggestions = false,
}: KeywordsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hash className="h-5 w-5" />
          SEO Keywords
        </CardTitle>
        <CardDescription>
          Add keywords to boost your business page SEO and improve search visibility
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {business?.keywords && business.keywords.length > 0 ? (
            <div className="space-y-3">
              <Label>Current Keywords ({business.keywords.length})</Label>
              <div className="flex flex-wrap gap-2">
                {business.keywords.map((keyword, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-2 px-3 py-1.5 text-sm"
                  >
                    <Hash className="h-3 w-3" />
                    {keyword}
                    <button
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                      aria-label={`Remove ${keyword}`}
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Hash className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No keywords added yet</p>
              <p className="text-sm mt-2">Add keywords to improve your SEO</p>
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="Enter a keyword (e.g., coffee shop, restaurant, best cafe)"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddKeyword();
                }
              }}
              className="flex-1"
            />
            <Button onClick={handleAddKeyword} disabled={!newKeyword.trim()}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Keyword
            </Button>
          </div>

          {/* Suggested Keywords */}
          {suggestedKeywords.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Suggested Keywords</Label>
                <div className="flex items-center gap-2">
                  {onAISuggest && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onAISuggest}
                      disabled={isLoadingAISuggestions}
                      className="h-7 text-xs"
                    >
                      {isLoadingAISuggestions ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 mr-1" />
                      )}
                      AI Suggest
                    </Button>
                  )}
                  {suggestedKeywords.length > suggestionsLimit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSuggestionsLimit((prev) => prev + 12)}
                      className="text-xs text-primary hover:text-primary/80"
                    >
                      Suggest more
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {displayedSuggestions.map((keyword, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors px-3 py-1.5"
                    onClick={async () => {
                      setNewKeyword(keyword);
                      // Auto-add on click
                      const trimmedKeyword = keyword.trim();
                      if (business) {
                        const currentKeywords = business.keywords || [];
                        if (!currentKeywords.some((k) => k.toLowerCase() === trimmedKeyword.toLowerCase())) {
                          const updatedKeywords = [...currentKeywords, trimmedKeyword];
                          handleUpdateBusiness({
                            keywords: updatedKeywords,
                          });
                        }
                      }
                    }}
                  >
                    <Hash className="h-3 w-3 mr-1" />
                    {keyword}
                    <PlusIcon className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Click on any suggested keyword to add it instantly
              </p>
            </div>
          )}
        </div>

      </CardContent>
    </Card>
  );
}
