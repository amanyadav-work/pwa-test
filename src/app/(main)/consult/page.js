'use client'

import React, { useState, useEffect } from 'react';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';
import { uploadImage } from '@/lib/cloudinary';
import Markdown from 'react-markdown';
import { DropzoneField } from '@/components/DropzoneField';
import { useOfflineStatus } from '@/context/OfflineStatusContext';

const LANGUAGES = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'es-ES', label: 'Spanish (Spain)' },
  { code: 'fr-FR', label: 'French (France)' },
  { code: 'de-DE', label: 'German (Germany)' },
  { code: 'ja-JP', label: 'Japanese' },
  { code: 'hi-IN', label: 'Hindi (India)' },
];

export default function Consult() {
  const [voiceName, setVoiceName] = useState('Google हिन्दी');
  const [language, setLanguage] = useState('en-US');

  const {
    response,
    listening,
    loading,
    speaking,
    error,
    conversation,
    startListening,
    stopVoice,
    bottomRef,
    voices,
    selectedVoice,
    setSelectedVoice,
    images,
    setImgUrl,
    structuredResponse,
    progressText,
  } = useVoiceAssistant({ preferredVoiceName: voiceName, language });


  const { isOfflineMode } = useOfflineStatus()

  const handleDrop = async (acceptedFiles) => {
    try {
      const uploadedUrl = await uploadImage(acceptedFiles[0]);
      setImgUrl(uploadedUrl);
    } catch (err) {
      console.error('Image upload failed:', err);
    }
  };

  const handleRemoveFile = (_removedFile, updatedFiles) => {
    // Promise.all(updatedFiles.map(fileToBase64))
    //   .then(setImgUrl)
    //   .catch(err => console.error(err));
  };



  return (
    <div className="mx-auto mt-12 p-4 flex flex-col md:flex-row h-[650px] rounded-lg shadow-2xl overflow-hidden bg-gray-950 text-white">

      {/* Dropzone */}
      {!isOfflineMode && <div className="md:w-1/3 bg-gray-800 p-4 border-r border-gray-700 flex flex-col space-y-4">

        <hr />

        <h3 className="text-xl font-semibold mb-4">Upload Medical Images</h3>
        <DropzoneField
          accept={{ 'image/*': [] }}
          onDrop={handleDrop}
          onRemoveFile={handleRemoveFile}
          showFileList
          text="Drag & drop or click to upload"
          className="h-full"
        />
      </div>}

      {/* Main Panel */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <div className="p-6 bg-gray-900 border-b border-gray-800">
          <h2 className="text-3xl font-bold text-center">🎙️ AI Voice Assistant</h2>
        </div>


        {/* Error Display */}
        {error && (
          <div className="bg-red-800 text-red-100 p-4 text-sm text-center">
            {error}
          </div>
        )}

        {progressText && (
          <div className="p-2 fixed bottom-0 left-0 right-0 text-center text-blue-400 text-sm font-mono">
            🔄 {progressText}
          </div>
        )}

        {/* Chat Window */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-950">
          {conversation.length === 0 && (
            <p className="text-center text-gray-500">Start the conversation by clicking below.</p>
          )}
          {conversation.map((msg, idx) => {
            const isUser = msg.role === 'user';

            return (
              <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2 rounded-xl text-sm whitespace-pre-wrap break-words ${isUser ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-300 text-gray-900 rounded-bl-none'}`}>
                  <Markdown>
                    {msg.content}
                  </Markdown>
                </div>
              </div>
            );
          })}


          <div ref={bottomRef} />
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-gray-900 border-t border-gray-800 flex justify-center gap-4">
          <button
            className={`px-6 py-3 rounded-full font-semibold transition ${listening || loading
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
              }`}
            onClick={startListening}
            disabled={listening || loading}
          >
            {loading ? '🤖 Thinking...' : listening ? '🎧 Listening...' : '🎤 Start Talking'}
          </button>

          <button
            className={`px-6 py-3 rounded-full font-semibold transition ${(!listening && !loading && !speaking)
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700'
              }`}
            onClick={stopVoice}
            disabled={!listening && !loading && !speaking}
          >
            ⛔ Stop
          </button>
        </div>
      </div>

      {structuredResponse?.details?.length > 0 && (
        <div className="mt-6 max-w-xl h-full bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-4">
          <h3 className="text-xl font-semibold text-white">🧠 Structured Analysis</h3>
          {/* Details Sections */}
          {structuredResponse.details.map((section, index) => (
            <div key={index} className="bg-gray-900 p-4 rounded-md border border-gray-700">
              <h4 className="text-lg font-bold text-white mb-2">{section.title}</h4>
              {section.type === 'text' && (
                <p className="text-gray-200">{section.content[0]}</p>
              )}
              {section.type === 'list' && (
                <ul className="list-disc list-inside text-gray-200 space-y-1">
                  {section.content.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              )}
              {section.type === 'steps' && (
                <ol className="list-decimal list-inside text-gray-200 space-y-1">
                  {section.content.map((item, i) => <li key={i}>{item}</li>)}
                </ol>
              )}
              {section.type === 'warning' && (
                <div className="bg-red-900 text-red-100 p-3 rounded">
                  {section.content.map((item, i) => (
                    <p key={i}>⚠️ {item}</p>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Follow-ups */}
          {structuredResponse.follow_up_questions?.length > 0 && (
            <div className="bg-gray-900 p-4 rounded-md border border-gray-700">
              <h4 className="text-lg font-semibold text-white mb-2">🤔 Follow-Up Questions</h4>
              <ul className="list-disc list-inside text-gray-300 space-y-1">
                {structuredResponse.follow_up_questions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
