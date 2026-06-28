"use client";

import React, { useRef, useState } from 'react';
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
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Paperclip,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const SUBJECTS = [
  'Mathematics',
  'Physical Sciences',
  'Life Sciences',
  'English',
  'Afrikaans',
  'History',
  'Geography',
  'Accounting',
];

const GRADES = ['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

const TIPS = [
  'Include clear definitions and key concepts',
  'Add examples and case studies',
  'Structure content with headings and sections',
  'Ensure content is grade-appropriate',
  'Use text-heavy files where possible to reduce data usage',
];

export function ContentUpload() {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    grade: '',
    content: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const charCount = formData.content.length;

  const resetFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openFilePicker = () => {
    if (!uploading) fileInputRef.current?.click();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (uploading) return;
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  };

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
      setFormData({ title: '', subject: '', grade: '', content: '' });
      resetFile();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error uploading content:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while uploading');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--chart-1))]">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(var(--chart-1))]/10 text-[10px]">
          01
        </span>
        Step one · Content
      </div>

      <Card className="border-border bg-card overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/30">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[hsl(var(--chart-1))]/10 shrink-0">
              <FileText className="w-5 h-5 text-[hsl(var(--chart-1))]" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
                Upload learning content
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Add material the quiz generator can turn into questions.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Content title</Label>
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
                    {SUBJECTS.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade">Grade level</Label>
                <Select
                  value={formData.grade}
                  onValueChange={(value: string) => setFormData({ ...formData, grade: value })}
                  disabled={uploading}
                >
                  <SelectTrigger id="grade">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADES.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-upload">Source file (optional)</Label>
              <div
                role="button"
                tabIndex={uploading ? -1 : 0}
                onClick={openFilePicker}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openFilePicker();
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!uploading) setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/30'
                } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
              >
                <input
                  ref={fileInputRef}
                  id="file-upload"
                  type="file"
                  accept=".pdf,.txt,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  disabled={uploading}
                  className="hidden"
                />

                {file ? (
                  <div className="flex items-center gap-2 rounded-lg bg-card border border-border px-3 py-2">
                    <Paperclip className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground max-w-[220px] truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        resetFile();
                      }}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-6 h-6 text-muted-foreground" />
                    <p className="text-sm text-foreground">
                      <span className="font-medium text-primary">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">PDF, TXT, or DOCX</p>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="content">Learning material</Label>
                <span
                  className={`text-xs font-medium ${
                    charCount >= 200 ? 'text-[hsl(var(--chart-2))]' : 'text-muted-foreground'
                  }`}
                >
                  {charCount} / 200 characters
                </span>
              </div>
              <Textarea
                id="content"
                placeholder="Paste or type the learning content here. This will be used to generate quiz questions automatically."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                disabled={uploading || !!file}
                rows={12}
                className="resize-y"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex items-center gap-3 pt-4 border-t border-border">
              <Button
                type="submit"
                disabled={
                  (!file && !formData.content.trim()) ||
                  !formData.title ||
                  !formData.subject ||
                  !formData.grade ||
                  uploading
                }
                className="gap-2"
              >
                {uploading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    Upload content
                  </>
                )}
              </Button>

              {success && (
                <div className="flex items-center gap-2 text-sm text-[hsl(var(--chart-2))]">
                  <CheckCircle2 className="w-4 h-4" />
                  Content uploaded successfully
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="rounded-xl border border-border bg-muted/30 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-[hsl(var(--chart-1))]" />
          <h3 className="text-sm font-semibold text-foreground">Tips for better quiz generation</h3>
        </div>
        <ul className="space-y-2">
          {TIPS.map((tip) => (
            <li key={tip} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 mt-0.5 text-[hsl(var(--chart-2))] shrink-0" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function UploadPage() {
  return <ContentUpload />;
}
