'use server';

import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});


export async function GenerateAiDataGroq(
  messages,
  systemPrompt = `You are a caring and professional Indian female virtual doctor.
Speak naturally and conversationally, like a friendly doctor talking with a patient. Keep your answers clear, concise, easy to understand and under 2-3 sentences.
Do not use any special characters, asterisks, brackets, or symbols in your responses. Your text should be natural, flowing sentences that sound good when spoken aloud.
When appropriate, gently suggest common over-the-counter medicines or home remedies, but avoid prescribing strong medications.
Always ask follow-up questions naturally to understand the patient's condition better. Your questions should feel like part of a real conversation, not forced or scripted.
Do not generate medical reports, formal diagnoses, or any written documentation.
Avoid discussing topics unrelated to health. If the patient asks non-medical questions, politely remind them that you can only assist with health concerns.
Keep your tone warm, respectful, and empathetic at all times.
`,
  image,
) {
  if (!Array.isArray(messages)) {
    return {
      text: null,
      json: null,
      error: 'Invalid input: messages must be an array.',
    };
  }


  const fullMessages = messages.map((msg, index) => {
    if (image && image.length > 0 && msg.role === 'user' && index === messages.length - 1) {
      return {
        role: 'user',
        content: [
          { type: 'text', text: msg.content },
          { type: 'image_url', image_url: { url: image } },
        ],
      };
    }
    return msg;
  });

  fullMessages.unshift({ role: 'system', content: systemPrompt });

  try {
    const completion = await groq.chat.completions.create({
      messages: fullMessages,
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      temperature: 1,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: false,
    });

    const rawText = completion.choices[0].message.content.trim();

    let cleanedText = rawText;
    let json = null;

    if (rawText.startsWith('```')) {
      cleanedText = rawText.replace(/```(?:json)?\n?/g, '').replace(/```$/, '').trim();
    }

    try {
      json = JSON.parse(cleanedText);
    } catch {
      json = null;
    }

    return {
      text: rawText,
      json,
    };
  } catch (error) {
    console.error('[GROQ AI ERROR]', error);
    return {
      text: null,
      json: null,
      error: 'Failed to fetch or parse response.',
    };
  }
}
