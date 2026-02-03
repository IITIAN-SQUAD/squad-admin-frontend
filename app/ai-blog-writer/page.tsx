"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Sparkles, Eye, Edit, ExternalLink, Trash2 } from "lucide-react";
import PageWrapper from "@/src/components/page/page-wrapper";
import PageHeader from "@/src/components/page/page-header";
import PageTitle from "@/src/components/page/page-title";
import { aiBlogGeneratorService, GeneratedBlogWithMetadata } from "@/src/services/ai-blog-generator.service";
import { LLMProvider } from "@/src/services/llm.service";

export default function AIBlogWriterPage() {
  // Form state
  const [provider, setProvider] = useState<LLMProvider>("openai");
  const [model, setModel] = useState("gpt-4o-mini");
  const [topic, setTopic] = useState("");
  const [numberOfBlogs, setNumberOfBlogs] = useState(1);
  const [tone, setTone] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [keywords, setKeywords] = useState("");
  const [useCurrentContext, setUseCurrentContext] = useState(true);
  const [checkPlagiarism, setCheckPlagiarism] = useState(true);
  const [plagiarismThreshold, setPlagiarismThreshold] = useState(30);
  const [autoRewrite, setAutoRewrite] = useState(true);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBlogs, setGeneratedBlogs] = useState<GeneratedBlogWithMetadata[]>([]);
  const [selectedBlogIndex, setSelectedBlogIndex] = useState<number | null>(null);

  // Available models
  const availableModels = aiBlogGeneratorService.getAvailableModels();

  const handleProviderChange = (newProvider: LLMProvider) => {
    setProvider(newProvider);
    setModel(availableModels[newProvider][0]);
  };

  const handleGenerateBlogs = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    if (numberOfBlogs < 1 || numberOfBlogs > 10) {
      toast.error("Number of blogs must be between 1 and 10");
      return;
    }

    try {
      setIsGenerating(true);
      setGeneratedBlogs([]);
      setSelectedBlogIndex(null);

      const keywordArray = keywords
        .split(",")
        .map(k => k.trim())
        .filter(k => k.length > 0);

      const blogs = await aiBlogGeneratorService.generateBlogs({
        provider,
        model,
        topic,
        numberOfBlogs,
        tone: tone || undefined,
        targetAudience: targetAudience || undefined,
        keywords: keywordArray.length > 0 ? keywordArray : undefined,
        useCurrentContext,
        checkPlagiarism,
        plagiarismThreshold,
        autoRewrite,
      });

      setGeneratedBlogs(blogs);
      
      if (blogs.length > 0) {
        toast.success(`Successfully generated ${blogs.length} blog(s)!`);
        setSelectedBlogIndex(0);
      } else {
        toast.warning("No blogs were generated. Please try again.");
      }
    } catch (error: any) {
      console.error("Blog generation failed:", error);
      toast.error(error.message || "Failed to generate blogs");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditBlog = (index: number) => {
    const blog = generatedBlogs[index];
    
    // Store blog data in sessionStorage instead of URL to avoid URI length limits
    const blogId = `ai-blog-${Date.now()}-${index}`;
    sessionStorage.setItem(blogId, JSON.stringify(blog));
    
    // Open edit page in new tab with just the ID
    window.open(`/ai-blog-writer/edit?id=${blogId}`, '_blank');
  };

  const handleDeleteBlog = (index: number) => {
    const updatedBlogs = generatedBlogs.filter((_, i) => i !== index);
    setGeneratedBlogs(updatedBlogs);
    
    if (selectedBlogIndex === index) {
      setSelectedBlogIndex(updatedBlogs.length > 0 ? 0 : null);
    } else if (selectedBlogIndex !== null && selectedBlogIndex > index) {
      setSelectedBlogIndex(selectedBlogIndex - 1);
    }
    
    toast.success("Blog removed from preview");
  };

  const selectedBlog = selectedBlogIndex !== null ? generatedBlogs[selectedBlogIndex] : null;

  return (
    <PageWrapper>
      <PageHeader title="AI Blog Writer" />
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <PageTitle>AI Blog Writer</PageTitle>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-gray-600">Powered by AI</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>Configure AI model and blog parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* LLM Provider */}
                <div className="space-y-2">
                  <Label htmlFor="provider">LLM Provider</Label>
                  <Select value={provider} onValueChange={(v) => handleProviderChange(v as LLMProvider)}>
                    <SelectTrigger id="provider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="gemini">Google Gemini</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Model */}
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger id="model">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels[provider].map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Topic */}
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic *</Label>
                  <Input
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Machine Learning in Healthcare"
                    disabled={isGenerating}
                  />
                </div>

                {/* Number of Blogs */}
                <div className="space-y-2">
                  <Label htmlFor="numberOfBlogs">Number of Blogs</Label>
                  <Input
                    id="numberOfBlogs"
                    type="number"
                    min={1}
                    max={10}
                    value={numberOfBlogs}
                    onChange={(e) => setNumberOfBlogs(parseInt(e.target.value) || 1)}
                    disabled={isGenerating}
                  />
                </div>

                {/* Tone */}
                <div className="space-y-2">
                  <Label htmlFor="tone">Tone (Optional)</Label>
                  <Input
                    id="tone"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    placeholder="e.g., Professional, Casual, Technical"
                    disabled={isGenerating}
                  />
                </div>

                {/* Target Audience */}
                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Target Audience (Optional)</Label>
                  <Input
                    id="targetAudience"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g., Developers, Students, Beginners"
                    disabled={isGenerating}
                  />
                </div>

                {/* Keywords */}
                <div className="space-y-2">
                  <Label htmlFor="keywords">Keywords (Optional)</Label>
                  <Textarea
                    id="keywords"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="Comma-separated keywords"
                    rows={3}
                    disabled={isGenerating}
                  />
                  <p className="text-xs text-gray-500">Separate keywords with commas</p>
                </div>

                {/* Use Current Context */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="useCurrentContext"
                      checked={useCurrentContext}
                      onChange={(e) => setUseCurrentContext(e.target.checked)}
                      disabled={isGenerating}
                      className="rounded"
                    />
                    <Label htmlFor="useCurrentContext" className="cursor-pointer">
                      Use Tavily for current context
                    </Label>
                  </div>
                  <p className="text-xs text-blue-600">
                    💡 Tip: Tavily is automatically enabled for topics with keywords like "latest", "recent", "news", "2024", "2025", etc.
                  </p>
                </div>

                {/* Plagiarism Check */}
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="checkPlagiarism"
                      checked={checkPlagiarism}
                      onChange={(e) => setCheckPlagiarism(e.target.checked)}
                      disabled={isGenerating}
                      className="rounded"
                    />
                    <Label htmlFor="checkPlagiarism" className="cursor-pointer font-semibold">
                      Check for plagiarism
                    </Label>
                  </div>

                  {checkPlagiarism && (
                    <>
                      <div className="space-y-2 ml-6">
                        <Label htmlFor="plagiarismThreshold">Plagiarism Threshold (%)</Label>
                        <Input
                          id="plagiarismThreshold"
                          type="number"
                          min={0}
                          max={100}
                          value={plagiarismThreshold}
                          onChange={(e) => setPlagiarismThreshold(parseInt(e.target.value) || 30)}
                          disabled={isGenerating}
                        />
                        <p className="text-xs text-gray-500">Content exceeding this threshold will be flagged</p>
                      </div>

                      <div className="flex items-center space-x-2 ml-6">
                        <input
                          type="checkbox"
                          id="autoRewrite"
                          checked={autoRewrite}
                          onChange={(e) => setAutoRewrite(e.target.checked)}
                          disabled={isGenerating}
                          className="rounded"
                        />
                        <Label htmlFor="autoRewrite" className="cursor-pointer">
                          Auto-rewrite if plagiarism detected
                        </Label>
                      </div>
                    </>
                  )}
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerateBlogs}
                  disabled={isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Blogs
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-2">
            {generatedBlogs.length === 0 && !isGenerating && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Sparkles className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-center">
                    Configure your settings and click "Generate Blogs" to start
                  </p>
                </CardContent>
              </Card>
            )}

            {isGenerating && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-16 h-16 text-yellow-500 animate-spin mb-4" />
                  <p className="text-gray-700 font-medium">Generating your blogs...</p>
                  <p className="text-gray-500 text-sm mt-2">
                    This may take a few moments
                  </p>
                </CardContent>
              </Card>
            )}

            {generatedBlogs.length > 0 && !isGenerating && (
              <div className="space-y-4">
                {/* Blog Tabs */}
                <Card>
                  <CardHeader>
                    <CardTitle>Generated Blogs ({generatedBlogs.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {generatedBlogs.map((blog, index) => (
                        <div key={index} className="relative group">
                          <Button
                            variant={selectedBlogIndex === index ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedBlogIndex(index)}
                          >
                            Blog {index + 1}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteBlog(index)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Selected Blog Preview */}
                {selectedBlog && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-2xl mb-2">{selectedBlog.heading}</CardTitle>
                          <CardDescription className="text-base">{selectedBlog.sub_heading}</CardDescription>
                        </div>
                        <Button onClick={() => handleEditBlog(selectedBlogIndex!)} size="sm">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit & Publish
                          <ExternalLink className="w-3 h-3 ml-2" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Banner Image */}
                      {selectedBlog.banner_image && (
                        <div className="rounded-lg overflow-hidden">
                          <img
                            src={selectedBlog.banner_image}
                            alt={selectedBlog.heading}
                            className="w-full h-64 object-cover"
                          />
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">
                          Status: {selectedBlog.blog_visibility_status}
                        </Badge>
                        <Badge variant="outline">Slug: {selectedBlog.slug}</Badge>
                        {selectedBlog.plagiarismScore !== undefined && (
                          <Badge 
                            variant="outline"
                            className={`${
                              selectedBlog.plagiarismScore > plagiarismThreshold
                                ? "bg-red-100 text-red-800 border-red-300"
                                : "bg-green-100 text-green-800 border-green-300"
                            }`}
                          >
                            Plagiarism: {selectedBlog.plagiarismScore}%
                          </Badge>
                        )}
                        {selectedBlog.wasRewritten && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                            Rewritten ({selectedBlog.rewriteAttempts}x)
                          </Badge>
                        )}
                      </div>

                      {/* Tags */}
                      {selectedBlog.tags && selectedBlog.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedBlog.tags.map((tag, idx) => (
                            <Badge key={idx}>{tag}</Badge>
                          ))}
                        </div>
                      )}

                      {/* Summary */}
                      <div>
                        <h3 className="font-semibold mb-2">Summary</h3>
                        <p className="text-gray-700">{selectedBlog.summary}</p>
                      </div>

                      {/* Body Preview */}
                      <div>
                        <h3 className="font-semibold mb-2">Content Preview</h3>
                        <div className="prose max-w-none bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                          <pre className="whitespace-pre-wrap text-sm">{selectedBlog.body.substring(0, 1000)}...</pre>
                        </div>
                      </div>

                      {/* SEO Info */}
                      <div className="border-t pt-4">
                        <h3 className="font-semibold mb-2">SEO Information</h3>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Meta Title:</span> {selectedBlog.meta_title}
                          </div>
                          <div>
                            <span className="font-medium">Meta Description:</span> {selectedBlog.meta_description}
                          </div>
                        </div>
                      </div>

                      {/* Quiz Questions */}
                      {selectedBlog.quiz_questions && selectedBlog.quiz_questions.length > 0 && (
                        <div className="border-t pt-4">
                          <h3 className="font-semibold mb-3">Quiz Questions ({selectedBlog.quiz_questions.length})</h3>
                          <div className="space-y-4">
                            {selectedBlog.quiz_questions.map((quiz, idx) => (
                              <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                                <p className="font-medium mb-2">
                                  {idx + 1}. {quiz.text}
                                </p>
                                <div className="space-y-1 ml-4">
                                  {quiz.options.map((option, optIdx) => (
                                    <div
                                      key={optIdx}
                                      className={`text-sm ${
                                        quiz.correct_answer_label === option.label
                                          ? "text-green-600 font-medium"
                                          : "text-gray-600"
                                      }`}
                                    >
                                      {option.label}. {option.option_text}
                                      {quiz.correct_answer_label === option.label && " ✓"}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
