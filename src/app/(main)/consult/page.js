'use client';

import React, { useState, useMemo } from 'react';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';
import { uploadImage } from '@/lib/cloudinary';
import Markdown from 'react-markdown';
import { DropzoneField } from '@/components/DropzoneField';
import { useOfflineStatus } from '@/context/OfflineStatusContext';

import {
  Mic,
  MicOff,
  Upload,
  AlertCircle,
  Brain,
  PanelRightClose,
  PanelLeft,
  Bot,
  Loader,
  PlayCircle,
  Play,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const Consult = () => {
  const { isOfflineMode } = useOfflineStatus();

  const [voiceName] = useState('Google हिन्दी');
  const [language] = useState('en-US');

  const {
    listening,
    loading,
    speaking,
    error,
    conversation,
    startListening,
    stopVoice,
    bottomRef,
    setSelectedVoice,
    setImgUrl,
    structuredResponse,
    progress,
  } = useVoiceAssistant({ preferredVoiceName: voiceName, language });

  const handleDrop = async (acceptedFiles) => {
    try {
      const uploadedUrl = await uploadImage(acceptedFiles[0]);
      setImgUrl(uploadedUrl);
    } catch (err) {
      console.error('Image upload failed:', err);
    }
  };

  const handleRemoveFile = () => {
    setImgUrl([]);
  };

  const langOptions = useMemo(() => [
    { code: 'en-US', label: 'English (US)' },
    { code: 'en-GB', label: 'English (UK)' },
    { code: 'es-ES', label: 'Spanish (Spain)' },
    { code: 'fr-FR', label: 'French (France)' },
    { code: 'de-DE', label: 'German (Germany)' },
    { code: 'ja-JP', label: 'Japanese' },
    { code: 'hi-IN', label: 'Hindi (India)' },
  ], []);

console.log(progress)

  return (
    <div className="flex flex-col md:flex-row mx-auto mt-20 p-4 h-[700px] md:w-[800px]  overflow-hidden bg-background text-foreground ">

      {/* Sidebar: Upload */}
      {!isOfflineMode && (
        <div className="md:w-[300px] bg-muted p-5 border-r space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Upload className="w-2 h-2" />
              <CardTitle className="text-xs">Upload Medical Images</CardTitle>
            </CardHeader>
            <CardContent>
              <DropzoneField
                accept={{ 'image/*': [] }}
                onDrop={handleDrop}
                onRemoveFile={handleRemoveFile}
                showFileList
                text="Drag & drop or click to upload"
                className="min-h-[150px]"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Assistant Panel */}
      <div className="flex-1 flex flex-col">

        {/* Header */}
        {/* Header with Bot and Dynamic Status Icon */}
        <div className="p-6 border-b flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="rounded-full relative p-7 bg-muted flex items-center justify-center">
              <Bot size={70} className="text-primary" />
              <div className="absolute bottom-2 right-0 bg-white rounded-full p-2 text-muted-foreground">
                {listening ? (
                  <Mic size={20} className=" text-green-500 animate-pulse" />
                ) : loading ? (
                  <Loader size={20} className=" animate-spin text-blue-500" />
                ) : speaking ? (
                  <Play size={20} className=" text-purple-500" />
                ) : (
                  <Mic size={20} className=" text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        </div>


        {/* Error Message */}
        {error && (
          <div className="bg-destructive text-destructive-foreground text-center py-2 text-sm flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {/* Progress Overlay */}
        {(progress.text && progress.percent !== 100) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 text-blue-400 text-sm font-mono overflow-hidden">
            {/* SVG Animated Background */}
            <svg className="absolute inset-0 w-full h-full animate-rotate opacity-10" viewBox="0 0 1440 320" preserveAspectRatio="none">
              <path
                fill="#3b82f6"
                fillOpacity="1"
                d="M0,160L60,165.3C120,171,240,181,360,165.3C480,149,600,107,720,101.3C840,96,960,128,1080,154.7C1200,181,1320,203,1380,213.3L1440,224L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"
              ></path>
            </svg>

            {/* Centered Text */}
            <div className="relative z-10 animate-fade-in">
              {progress.text || "Loading..."}
            </div>
          </div>
        )}


        {/* Chat History */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-background">
          {conversation.length === 0 ? (
            <p className="text-center text-muted-foreground">Start a conversation by clicking below</p>
          ) : (
            conversation.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] px-4 py-2 rounded-xl text-sm whitespace-pre-wrap break-words
                      ${isUser
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-muted text-muted-foreground rounded-bl-none'
                      }`}
                  >
                    <Markdown>{msg.content}</Markdown>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Controls */}
        <div className="p-6 bg-muted border-t flex justify-center gap-4">
          <Button
            variant="default"
            size="lg"
            onClick={startListening}
            disabled={listening || loading}
            className="flex items-center gap-2"
          >
            <Mic className="w-4 h-4" />
            {loading ? 'Thinking...' : listening ? 'Listening...' : 'Start Talking'}
          </Button>

          <Button
            variant="destructive"
            size="lg"
            onClick={stopVoice}
            disabled={!listening && !loading && !speaking}
            className="flex items-center gap-2"
          >
            <MicOff className="w-4 h-4" />
            Stop
          </Button>
        </div>
      </div>

      {/* Sidebar: Structured Response */}
      {structuredResponse?.details?.length > 0 && (
        <div className="md:w-1/3 bg-muted p-6 border-l overflow-y-auto space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5" />
            <h3 className="text-xl font-bold">Structured Analysis</h3>
          </div>

          {structuredResponse.details.map((section, idx) => (
            <Card key={idx} className="bg-background border-muted">
              <CardHeader>
                <CardTitle className="text-lg">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {section.type === 'text' && <p>{section.content[0]}</p>}
                {section.type === 'list' && (
                  <ul className="list-disc list-inside space-y-1">
                    {section.content.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                )}
                {section.type === 'steps' && (
                  <ol className="list-decimal list-inside space-y-1">
                    {section.content.map((item, i) => <li key={i}>{item}</li>)}
                  </ol>
                )}
                {section.type === 'warning' && (
                  <div className="bg-red-100 text-red-800 p-2 rounded">
                    {section.content.map((item, i) => <p key={i}>{item}</p>)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {structuredResponse.follow_up_questions?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-md">Follow-Up Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
                  {structuredResponse.follow_up_questions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default Consult;
