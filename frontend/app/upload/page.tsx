"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function ContentUpload() {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    grade: '',
    content: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subjects = [
    'Mathematics',
    'Physical Sciences',
    'Life Sciences',
    'English',
    'Afrikaans',
    'History',
    'Geography',
    'Accounting',
  ];

  const grades = [
    'Grade 8',
    'Grade 9',
    'Grade 10',
    'Grade 11',
    'Grade 12',
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    setSuccess(false);
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('grade_level', formData.grade);
      
      if (file) {
        formDataToSend.append('file', file);
      } else {
        formDataToSend.append('text_content', formData.content);
      }

      const response = await fetch(`${API_URL}/contents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload content');
      }

      setSuccess(true);
      setFormData({
        title: '',
        subject: '',
        grade: '',
        content: '',
      });
      setFile(null);

      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error uploading content:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while uploading');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Upload Learning Content</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Add educational material that can be used to generate quizzes
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Content Title</Label>
              <Input
                id="title"
                placeholder="e.g., Introduction to Quadratic Equations"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                disabled={uploading}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value: string) => setFormData({ ...formData, subject: value })}
                  disabled={uploading}
                >
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade">Grade Level</Label>
                <Select
                  value={formData.grade}
                  onValueChange={(value: string) => setFormData({ ...formData, grade: value })}
                  disabled={uploading}
                >
                  <SelectTrigger id="grade">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
             <Label htmlFor="file-upload">Upload PDF, TXT, or DOCX (optional)</Label>
             <Input
               id="file-upload"
               type="file"
               accept=".pdf,.txt,.docx"
               onChange={(e) => setFile(e.target.files?.[0] || null)}
               disabled={uploading}
             />
             <p className="text-xs text-muted-foreground">
               Upload a PDF, TXT, or DOCX file instead of typing content
             </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Learning Material</Label>
              <Textarea
                id="content"
                placeholder="Paste or type the learning content here. This will be used to generate quiz questions automatically."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                disabled={uploading || !!file}
                rows={12}
                className="resize-y"
              />
              <p className="text-xs text-muted-foreground">
                Minimum 200 characters recommended for effective quiz generation
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="submit"
                disabled={(!file && !formData.content.trim()) || !formData.title || !formData.subject || !formData.grade || uploading}
                className="gap-2"
              >
                {uploading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Content
                  </>
                )}
              </Button>

              {success && (
                <div className="flex items-center gap-2 text-sm text-[hsl(var(--chart-2))]">
                  <CheckCircle2 className="w-4 h-4" />
                  Content uploaded successfully!
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
        <h3 className="text-sm font-medium text-foreground mb-2">Tips for Better Quiz Generation</h3>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Include clear definitions and key concepts</li>
          <li>Add examples and case studies</li>
          <li>Structure content with headings and sections</li>
         <li>Ensure content is grade-appropriate</li>
         <li>Use text-heavy files where possible to reduce data usage</li>
       </ul>
      </div>
    </div>
  );
}

export default function UploadPage() {
  return <ContentUpload />;
}
