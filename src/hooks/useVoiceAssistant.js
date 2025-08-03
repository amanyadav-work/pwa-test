'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { initializeEngine, sendMessage } from '@/lib/offlineai';
import { GenerateAiDataGroq } from '@/actions/groq-copy';
import { useOfflineStatus } from '@/context/OfflineStatusContext';

export function useVoiceAssistant({
  preferredVoiceName,
  language = 'en-US',
}) {
  const { isOfflineMode: offline } = useOfflineStatus();

  const [status, setStatus] = useState('idle');
  const [response, setResponse] = useState('');
  const [structuredResponse, setStructuredResponse] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [error, setError] = useState(null);

  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [imgUrl, setImgUrl] = useState([]);
  const recognitionRef = useRef(null);
  const bottomRef = useRef(null);
  const imgUrlRef = useRef([]);

  const [engine, setEngine] = useState(null);
  const [progressText, setProgressText] = useState('');
  const isStreaming = useRef(false);

  // 🎤 Speak Queue System
  const speakQueue = useRef([]);
  const isSpeaking = useRef(false);

  const processSpeakQueue = useCallback(async () => {
    if (isSpeaking.current || speakQueue.current.length === 0) return;
    isSpeaking.current = true;

    while (speakQueue.current.length > 0) {
      const text = speakQueue.current.shift();
      await new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
          utterance.lang = selectedVoice.lang;
        } else {
          utterance.lang = language;
        }

        utterance.onend = resolve;
        utterance.onerror = resolve;
        window.speechSynthesis.speak(utterance);
      });
    }

    isSpeaking.current = false;
  }, [selectedVoice, language]);

  useEffect(() => {
    if (offline) {
      initializeEngine(setEngine, () => {}, setProgressText);
    }
  }, [offline]);

  useEffect(() => {
    const synth = window.speechSynthesis;
    function loadVoices() {
      const availableVoices = synth.getVoices();
      setVoices(availableVoices);
      let voice = preferredVoiceName
        ? availableVoices.find((v) => v.name === preferredVoiceName)
        : availableVoices.find((v) => v.lang.startsWith('en-US')) || availableVoices[0] || null;
      setSelectedVoice(voice);
    }

    loadVoices();
    synth.onvoiceschanged = loadVoices;
    return () => {
      synth.onvoiceschanged = null;
    };
  }, [preferredVoiceName]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  useEffect(() => scrollToBottom(), [conversation, scrollToBottom]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (window.speechSynthesis?.speaking) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    const handlePageHide = () => {
      if (window.speechSynthesis?.speaking) {
        window.speechSynthesis.cancel();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        handlePageHide();
      }
    });

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  useEffect(() => {
    imgUrlRef.current = imgUrl;
  }, [imgUrl]);

  const stopVoice = useCallback(() => {
    if (window.speechSynthesis?.speaking) window.speechSynthesis.cancel();
    recognitionRef.current?.stop();
    setStatus('idle');
  }, []);

  const startListening = useCallback(() => {
    if (status === 'listening') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser.');
      setError('Speech Recognition not supported.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setStatus('listening');
      setResponse('');
      setError(null);
    };

    recognition.onend = () => {
      if (status === 'listening') setStatus('idle');
    };

    recognition.onerror = (e) => {
      console.error('❌ Speech Recognition Error:', e);
      setStatus('idle');
      setError('Speech recognition error.');
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setStatus('loading');
      setError(null);
      const updatedConversation = [...conversation, { role: 'user', content: transcript }];

      try {
        let reply = '';
        let summary = '';

        if (offline) {
          let buffer = '';

          await sendMessage({
            input: transcript,
            chatLog: conversation,
            engine,
            setChatLog: setConversation,
            setInput: () => { },
            isStreamingRef: isStreaming,
            onToken: async (token) => {
              buffer += token;

              const match = buffer.match(/(.+?[.!?])(\s|$)/);
              if (match) {
                const sentence = match[1].trim();
                buffer = buffer.slice(match[0].length);
                speakQueue.current.push(sentence);
                processSpeakQueue();
              }

              reply += token;

              setConversation((prev) => {
                const updated = [...prev];
                updated[updated.length - 1].content = reply;
                return updated;
              });
            },
          });

          if (buffer.trim()) {
            speakQueue.current.push(buffer.trim());
            processSpeakQueue();
          }

          const lastMessage = conversation.at(-1);
          reply = lastMessage?.content || 'Sorry, I didn’t understand that.';
          summary = reply;
        } else {
          const result = await GenerateAiDataGroq(updatedConversation, undefined, imgUrlRef.current);
          reply = result?.text || 'Sorry, I didn’t understand that.';
          summary = result?.json?.summary || reply;

          setConversation([
            ...updatedConversation,
            {
              role: 'assistant',
              content: summary,
            },
          ]);

          speakQueue.current.push(summary);
          processSpeakQueue();
        }

        setResponse(reply);
        setStructuredResponse(offline ? null : summary);
      } catch (err) {
        console.error('❌ AI Error:', err);
        setResponse('An error occurred. Please try again.');
        setError('AI error occurred.');
      } finally {
        setStatus('idle');
      }
    };

    recognition.start();
  }, [status, language, conversation, offline, engine, processSpeakQueue]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setStatus('idle');
  }, []);

  return {
    listening: status === 'listening',
    loading: status === 'loading',
    speaking: status === 'speaking',
    error,
    response,
    structuredResponse,
    conversation,
    startListening,
    stopListening,
    stopVoice,
    bottomRef,
    scrollToBottom,
    voices,
    selectedVoice,
    setSelectedVoice,
    imgUrl,
    setImgUrl,
    progressText,
  };
}
