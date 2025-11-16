"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import PageWrapper from '@/src/components/page/page-wrapper';
import PageHeader from '@/src/components/page/page-header';

interface ProgressMessage {
  type: 'info' | 'success' | 'error';
  message: string;
  timestamp: Date;
}

export default function BulkQuestionUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<ProgressMessage[]>([]);
  const [examId, setExamId] = useState('');
  const [paperId, setPaperId] = useState('');

  // Mock data - replace with actual data fetching
  const mockExams = [
    { id: '1', name: 'JEE Main 2024' },
    { id: '2', name: 'NEET 2024' },
    { id: '3', name: 'JEE Advanced 2024' },
  ];

  const mockPapers = [
    { id: '1', name: 'JEE Main 2024 - Paper 1', examId: '1' },
    { id: '2', name: 'JEE Main 2024 - Paper 2', examId: '1' },
    { id: '3', name: 'NEET 2024 - Paper 1', examId: '2' },
  ];

  const filteredPapers = paperId ? mockPapers.filter(p => p.examId === examId) : mockPapers;

  const addProgress = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setProgress(prev => [...prev, { type, message, timestamp: new Date() }]);
  };

  const handleUpload = async () => {
    if (!file || !examId || !paperId) {
      addProgress('Please select PDF, exam, and paper', 'error');
      return;
    }
    
    setProcessing(true);
    setProgress([]);
    
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('examId', examId);
    formData.append('paperId', paperId);

    try {
      addProgress('📤 Uploading PDF...', 'info');
      
      const response = await fetch('/api/questions/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (true && reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(Boolean);
        
        lines.forEach(line => {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const type = data.message.includes('Error') ? 'error' : 
                          data.message.includes('✅') || data.message.includes('🎉') ? 'success' : 'info';
              addProgress(data.message, type);
            } catch (e) {
              console.error('Failed to parse progress:', e);
            }
          }
        });
      }
      
      addProgress('🎉 Upload completed successfully!', 'success');
    } catch (error: any) {
      addProgress(`❌ Error: ${error.message}`, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
    }
  };

  return (
    <>
      <PageHeader title="Bulk Question Upload" />
      <PageWrapper>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Bulk Question Upload</h1>
            <p className="text-gray-600 mt-2">
              Upload exam PDFs and automatically extract questions using AI
            </p>
          </div>

          {/* Configuration Card */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Configuration</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <Label htmlFor="exam">Select Exam *</Label>
                <Select value={examId} onValueChange={setExamId}>
                  <SelectTrigger id="exam">
                    <SelectValue placeholder="Choose exam" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockExams.map(exam => (
                      <SelectItem key={exam.id} value={exam.id}>
                        {exam.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paper">Select Paper *</Label>
                <Select value={paperId} onValueChange={setPaperId} disabled={!examId}>
                  <SelectTrigger id="paper">
                    <SelectValue placeholder="Choose paper" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPapers.map(paper => (
                      <SelectItem key={paper.id} value={paper.id}>
                        {paper.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-yellow-500 transition-colors">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="pdf-upload"
                disabled={processing}
              />
              <label htmlFor="pdf-upload" className="cursor-pointer">
                {file ? (
                  <>
                    <FileText className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
                    <p className="text-lg font-medium mb-2">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg mb-2">Click to upload PDF</p>
                    <p className="text-sm text-gray-500">
                      Supports exam question papers with text and images
                    </p>
                  </>
                )}
              </label>
            </div>

            {file && (
              <Button 
                onClick={handleUpload} 
                disabled={processing || !examId || !paperId}
                className="mt-4 w-full bg-yellow-500 hover:bg-yellow-600 text-black"
                size="lg"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Upload and Process
                  </>
                )}
              </Button>
            )}
          </Card>

          {/* Progress Card */}
          {progress.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Loader2 className={`w-5 h-5 ${processing ? 'animate-spin' : ''}`} />
                Processing Log
              </h2>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {progress.map((item, i) => (
                  <div 
                    key={i}
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      item.type === 'success' ? 'bg-green-50' :
                      item.type === 'error' ? 'bg-red-50' :
                      'bg-blue-50'
                    }`}
                  >
                    {getIcon(item.type)}
                    <div className="flex-1">
                      <p className="text-sm">{item.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Info Card */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              How It Works
            </h3>
            <ol className="space-y-2 text-sm text-gray-700">
              <li>1. <strong>PDF Parsing:</strong> Extracts text and images from the PDF</li>
              <li>2. <strong>Image Upload:</strong> Automatically uploads images to S3</li>
              <li>3. <strong>AI Processing:</strong> Uses GPT-4 to extract questions with LaTeX formatting</li>
              <li>4. <strong>Question Creation:</strong> Automatically creates questions in the database</li>
              <li>5. <strong>Review:</strong> Questions are saved as drafts for your review</li>
            </ol>
          </Card>
        </div>
      </PageWrapper>
    </>
  );
}
