'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { initializeEngine, sendMessage } from '@/lib/offlineai';
import { GenerateAiDataGroq } from '@/actions/groq-copy';
import { useOfflineStatus } from '@/context/OfflineStatusContext';
import Vosk from 'vosk-browser';

const IND_ENG = 'https://ccoreilly.github.io/vosk-browser/models/vosk-model-small-en-us-0.15.tar.gz';

export function useVoiceAssistant({ preferredVoiceName, language = 'en-US' }) {
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
    text: 'Loading...',
    percent: 0
  });
  const [engine, setEngine] = useState(null);

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

  useEffect(() => {
    (async () => {
      if (!engine) {
        await initializeEngine(setEngine, () => { }, setprogress);
        setprogress((prev) => ({ ...prev, text: "" }));
      }
      if (offline) {
        const Voskjs = await import('vosk-browser');
        const model = await Voskjs.createModel(IND_ENG);
        voskRefs.current.model = model;
      }
    })();

  }, [offline]);

  useEffect(() => {
    const synth = window.speechSynthesis;
    const loadVoices = () => {
      const availableVoices = synth.getVoices();
      setVoices(availableVoices);
      const voice =
        preferredVoiceName
          ? availableVoices.find((v) => v.name === preferredVoiceName)
          : availableVoices.find((v) => v.lang.startsWith(language)) || availableVoices[0] || null;
      setSelectedVoice(voice);
    };
    loadVoices();
    synth.onvoiceschanged = loadVoices;
    return () => { synth.onvoiceschanged = null; };
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
        console.log('Vosk result:', msg);
        stopVoskRecognition();
        setConversation(prevConversation => {
          const updatedConversation = [...prevConversation, { role: 'user', content: finalText }];
          // Also update AI here
          setResponse(finalText);
          setStatus('loading');

          (async () => {
            try {
              let buffer = '';
              await sendMessage({
                input: finalText,
                chatLog: updatedConversation,
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
                  setConversation((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1].content = buffer;
                    return updated;
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

          return updatedConversation;
        });
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

  return {
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
  };
}
