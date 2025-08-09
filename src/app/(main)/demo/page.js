'use client';

import React, { useRef, useState } from 'react';
import Vosk from 'vosk-browser';

const ENG = 'https://ccoreilly.github.io/vosk-browser/models/vosk-model-small-en-us-0.15.tar.gz';
const IND_ENG = 'https://ccoreilly.github.io/vosk-browser/models/vosk-model-small-en-in-0.4.tar.gz';
const HIN = 'hi-model.tar.gz'; // Placeholder

export default function SpeechPage() {
    const [listening, setListening] = useState(false);

    const refs = useRef({
        recognizer: null,
        processor: null,
        audioContext: null,
        mediaStream: null,
    });

    const stopListening = async () => {
        const {
            recognizer,
            processor,
            audioContext,
            mediaStream,
        } = refs.current;

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

        // Reset all references
        refs.current = {
            recognizer: null,
            processor: null,
            audioContext: null,
            mediaStream: null,
        };

        setListening(false);
    };

    const startListening = async () => {
        if (listening) return;

        setListening(true);
        console.log('Loading model...');

        const model = await Vosk.createModel(IND_ENG);
        console.log('Model loaded.');

        const recognizer = new model.KaldiRecognizer(16000);
        recognizer.setWords(true);

        recognizer.on('result', (msg) => {
            console.log('Final:', msg.result.text);
        });

        recognizer.on('partialresult', (msg) => {
            console.log('Partial:', msg.result.partial);
        });

        const mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                channelCount: 1,
            },
            video: false,
        });

        const audioContext = new AudioContext({ sampleRate: 16000 });
        const source = audioContext.createMediaStreamSource(mediaStream);

        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processor.onaudioprocess = (event) => {
            try {
                recognizer.acceptWaveform(event.inputBuffer);
            } catch (err) {
                console.error('Waveform error:', err);
            }
        };

        source.connect(processor);
        processor.connect(audioContext.destination);

        refs.current = {
            recognizer,
            processor,
            audioContext,
            mediaStream,
        };

        console.log('Listening...');
    };

    return (
        <div>
            <button onClick={startListening} disabled={listening}>
                {listening ? 'Listening...' : 'Start Listening'}
            </button>

            <button onClick={stopListening} disabled={!listening}>
                Stop
            </button>
        </div>
    );
}
