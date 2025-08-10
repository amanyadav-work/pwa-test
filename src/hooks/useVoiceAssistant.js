'use client';

import { useState, useRef, useCallback, useEffect, createContext, useContext } from 'react';
import { initializeEngine, sendMessage } from '@/lib/offlineai';
import { GenerateAiDataGroq } from '@/actions/groq-copy';
import { useOfflineStatus } from '@/context/OfflineStatusContext';
import Vosk from 'vosk-browser';
import { generateHealthReport } from '@/lib/reportGen';

const IND_ENG = 'https://ccoreilly.github.io/vosk-browser/models/vosk-model-small-en-us-0.15.tar.gz';

const VoiceAssistantContext = createContext(null);
export function VoiceAssistantProvider({ children, preferredVoiceName = 'Google हिन्दी', language = 'en-US' }) {
  const { isOfflineMode: offline } = useOfflineStatus();

  const [status, setStatus] = useState('idle');
  const [response, setResponse] = useState('');
  const [structuredResponse, setStructuredResponse] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [error, setError] = useState(null);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [imgUrl, setImgUrl] = useState([]);
  const [progress, setprogress] = useState({
    text: '',
    percent: 0
  });
  const [engine, setEngine] = useState(null);

  const downloadingRef = useRef(false);

  const recognitionRef = useRef(null);
  const voskRefs = useRef({});
  const imgUrlRef = useRef([]);
  const speakQueue = useRef([]);
  const isSpeaking = useRef(false);
  const isStreaming = useRef(false);
  const bottomRef = useRef(null);
  const lastRecognizedText = useRef('');

  // ---------------------------------------------
  // Speech Synthesis
  // ---------------------------------------------
  const processSpeakQueue = useCallback(async () => {
    if (isSpeaking.current || speakQueue.current.length === 0) return;
    isSpeaking.current = true;

    while (speakQueue.current.length) {
      const text = speakQueue.current.shift();
      await new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = selectedVoice || null;
        utterance.lang = selectedVoice?.lang || language;
        utterance.onend = resolve;
        utterance.onerror = resolve;
        window.speechSynthesis.speak(utterance);
      });
    }

    isSpeaking.current = false;
  }, [selectedVoice, language]);




  const downloadModel = async () => {
    if (engine) return; // already downloaded

    setprogress({ text: "Initializing...", percent: 0 });

    try {
      const engineInstance = await initializeEngine(setEngine, () => { }, setprogress);
      setprogress({ text: "Model loaded", percent: 100 });
    } catch (err) {
      console.error("Model download failed:", err);
      setError("Model download failed");
      setprogress({ text: "Error loading model", percent: 0 });
    }
  }


  async function isModelCached(modelName = "Llama-3.2-3B-Instruct-q4f16_1-MLC") {
    if (!("caches" in window)) return false;

    // Try common MLC model URL
    const configUrl = `https://huggingface.co/mlc-ai/${modelName}/resolve/main/mlc-chat-config.json`;

    const cacheNames = await caches.keys();

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const match = await cache.match(configUrl);

      if (match) {
        try {
          const json = await match.json();

          // Optional: check if it's a valid config
          if (json?.model_type && json?.context_window_size) {
            return true;
          }
        } catch (err) {
          console.warn("Model config exists but is not valid JSON:", err);
        }
      }
    }

    return false;
  }


  useEffect(() => {
    if (engine || downloadingRef.current) return; // ✅ Prevent re-entry
    downloadingRef.current = true;
    async function checkAndDownload() {
      if (offline) {
        if (voskRefs.current.model) return; // already loaded
        const Voskjs = await import('vosk-browser');
        const model = await Voskjs.createModel(IND_ENG);
        voskRefs.current.model = model;
      }
      if (!offline) return;

      const cached = await isModelCached();
      if (cached) {
        await downloadModel();
      }
    }
    checkAndDownload();
  }, [offline]);


  useEffect(() => {
    const synth = window.speechSynthesis;
    const loadVoices = () => {
      const availableVoices = synth.getVoices();

      // Try preferred voice first
      let voice =
        preferredVoiceName
          ? availableVoices.find((v) => v.name === preferredVoiceName)
          : null;

      // Fallback 1: first voice with matching language
      if (!voice) {
        voice = availableVoices.find((v) => v.lang.startsWith(language));
      }

      // Fallback 2: fallback to a common US female voice if language is 'en-US'
      if (!voice && language === 'en-US') {
        voice = availableVoices.find((v) => v.name === 'Microsoft Ava Online (Natural) - English (United States)');
      }

      // Final fallback: just use the first available voice
      if (!voice && availableVoices.length > 0) {
        voice = availableVoices[0];
      }

      setVoices(availableVoices);
      setSelectedVoice(voice);
      console.log('Selected voice:', voice, 'Available voices:', availableVoices);
    };

    loadVoices();
    synth.onvoiceschanged = loadVoices;

    return () => {
      synth.onvoiceschanged = null;
    };
  }, [preferredVoiceName, language]);


  useEffect(() => {
    imgUrlRef.current = imgUrl;
  }, [imgUrl]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  // ---------------------------------------------
  // Vosk (Offline Speech Recognition)
  // ---------------------------------------------
  const stopVoskRecognition = useCallback(async () => {
    const { recognizer, processor, audioContext, mediaStream } = voskRefs.current;

    if (processor) {
      processor.disconnect();
      processor.onaudioprocess = null;
    }

    if (audioContext && audioContext.state !== 'closed') {
      await audioContext.close();
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }

    if (recognizer) {
      recognizer.remove();
    }

    voskRefs.current.recognizer = null;
    voskRefs.current.processor = null;
    voskRefs.current.audioContext = null;
    voskRefs.current.mediaStream = null;

    setStatus('idle');
  }, []);


  const startVoskRecognition = useCallback(async () => {
    if (voskRefs.current.recognizer) return;

    setStatus('loading');
    try {
      const model = voskRefs.current.model;
      if (!model) {
        setError('Model not loaded');
        return;
      }
      const recognizer = new model.KaldiRecognizer(16000);
      recognizer.setWords(true);

      recognizer.on('result', (msg) => {
        const finalText = msg.result.text?.trim();
        if (!finalText || finalText === lastRecognizedText.current) return;
        lastRecognizedText.current = finalText;
        stopVoskRecognition();
        const userMessage = { role: 'user', content: finalText };
        setConversation(prev => [...prev, userMessage]);
        setStatus('loading');
        lastRecognizedText.current = finalText;

        (async () => {
          try {
            let buffer = '';
            await sendMessage({
              input: finalText,
              chatLog: [...conversation, userMessage],
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
                  if (!isSpeaking.current) {
                    processSpeakQueue();
                  }
                }

                setConversation(prev => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];

                  if (last?.role === 'assistant') {
                    last.content = buffer;
                  } else {
                    updated.push({ role: 'assistant', content: buffer });
                  }

                  return [...updated];
                });
              },
            });

            if (buffer.trim()) {
              speakQueue.current.push(buffer.trim());
              if (!isSpeaking.current) {
                processSpeakQueue();
              }
            }

            setStatus('idle');
          } catch (e) {
            console.error('AI processing error:', e);
            setError('AI processing failed.');
            setStatus('idle');
          }
        })();
      });



      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
        video: false,
      });

      const audioContext = new AudioContext({ sampleRate: 16000 });
      const source = audioContext.createMediaStreamSource(mediaStream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (event) => {
        try { recognizer.acceptWaveform(event.inputBuffer); }
        catch (err) { console.error('Waveform error:', err); }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      voskRefs.current = {
        ...voskRefs.current, // ✅ preserve existing model
        recognizer,
        processor,
        audioContext,
        mediaStream,
      };

      setStatus('listening');
      setError(null);
    } catch (e) {
      console.error('Failed to start Vosk:', e);
      setError('Failed to start offline recognition.');
      setStatus('idle');
    }
  }, [conversation, engine, processSpeakQueue]);

  // ---------------------------------------------
  // Online Speech Recognition
  // ---------------------------------------------
  const startListening = useCallback(() => {
    if (status === 'listening') return;

    if (offline) {
      startVoskRecognition();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition not supported.');
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

    recognition.onend = () => { if (status === 'listening') setStatus('idle'); };

    recognition.onerror = (e) => {
      console.error('Speech Recognition Error:', e);
      setStatus('idle');
      setError('Speech recognition error.');
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      const updatedConversation = [...conversation, { role: 'user', content: transcript }];
      setStatus('loading');
      setError(null);

      try {
        const result = await GenerateAiDataGroq(updatedConversation, undefined, imgUrlRef.current);
        const reply = result?.text || 'Sorry, I didn’t understand that.';
        const summary = result?.json?.summary || reply;

        setConversation([...updatedConversation, { role: 'assistant', content: summary }]);
        speakQueue.current.push(summary);
        if (!isSpeaking.current) {
          processSpeakQueue();
        }


        setResponse(reply);
        setStructuredResponse(summary);
      } catch (err) {
        console.error('AI Error:', err);
        setResponse('An error occurred. Please try again.');
        setError('AI error occurred.');
      } finally {
        setStatus('idle');
      }
    };

    recognition.start();
  }, [status, language, conversation, offline, engine, processSpeakQueue, startVoskRecognition]);

  const stopListening = useCallback(() => {
    if (offline) {
      stopVoskRecognition();
    } else {
      recognitionRef.current?.stop();
      setStatus('idle');
    }
  }, [offline, stopVoskRecognition]);

  const stopVoice = useCallback(() => {
    window.speechSynthesis?.speaking && window.speechSynthesis.cancel();
    stopListening();
  }, [stopListening]);


const generateReportFromCurrentConversation = useCallback(async () => {
  try {
    const report = await generateHealthReport(conversation, engine, offline);
    return report;
  } catch (err) {
    console.error('Generate report failed:', err);
    return null;
  }
}, [conversation, engine, offline]);


  return (
    <VoiceAssistantContext.Provider
      value={{
        generateHealthReport:generateReportFromCurrentConversation,
        isModelCached,
        downloadModel,
        listening: status === 'listening',
        loading: status === 'loading',
        speaking: isSpeaking.current,
        error,
        response,
        structuredResponse,
        conversation,
        startListening,
        stopListening,
        stopVoice,
        bottomRef,
        scrollToBottom: () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }),
        voices,
        selectedVoice,
        setSelectedVoice,
        imgUrl,
        setImgUrl,
        progress,
      }}
    >
      {children}
    </VoiceAssistantContext.Provider>
  );
};

// Hook to access the context
export const useVoiceAssistant = () => {
  const context = useContext(VoiceAssistantContext);
  if (!context) throw new Error('useVoiceAssistant must be used within a VoiceAssistantProvider');
  return context;
};