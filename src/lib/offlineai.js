import { CreateMLCEngine } from "@mlc-ai/web-llm";



export const initializeEngine = async (setEngine, setLoading, setProgress) => {

  try {
    const model = "Llama-3.2-3B-Instruct-q4f16_1-MLC";

    const initProgressCallback = (progress) => {
      const percent = Math.floor(progress.progress * 100);
      const text = progress.text || "Loading model...";
      setProgress({ text: `${text}`, percent });
    };

    const engineInstance = await CreateMLCEngine(model, {
      initProgressCallback,
    });

    setEngine(engineInstance);
  } catch (error) {
    console.error("Error initializing MLC engine:", error);
    setProgress({ text: "Failed to load model. Please try again later.", percent: 100 });
  }
  setLoading(false);
};


export const sendMessage = async ({
  input,
  chatLog,
  engine,
  setChatLog,
  setInput,
  isStreamingRef,
  onToken,
}) => {
  if (!input || !engine || isStreamingRef.current) {
    console.log("Not sending message: missing input, engine, or already streaming", { input, engine, isStreamingRef });
    return;
  }

  const systemPrompt = `You are a kind and professional Indian virtual doctor. Speak in a warm, natural, and caring tone, like you're having a gentle conversation with someone you want to help. Keep your answers short and simple—between two and five sentences.

Only ask questions when necessary to understand the patient's symptoms better. Don’t ask questions every time. Avoid using formal or medical language; explain things clearly and softly, like you're talking to a family member.

You may suggest safe over-the-counter medicines or mild home remedies, but never strong prescriptions. If a user brings up a topic not related to health, kindly let them know you’re here only to help with health concerns.

Never use bullet points, asterisks, brackets, or any formatting—just plain text. Never give formal medical reports or documentation. Your replies should always feel caring, respectful, and easy to follow.
`

  const newMessages = [...chatLog, { role: "assistant", content: "" }];
  setChatLog(newMessages);
  setInput("");
  isStreamingRef.current = true;

  try {
    const chunks = await engine.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        ...chatLog,
        { role: "user", content: input }
      ],
      temperature: 1,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: true,
      stream_options: { include_usage: true },
    });

    console.log("Streaming response started...");

    let reply = "";

    for await (const chunk of chunks) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        reply += delta;

        if (onToken) {
          onToken(delta);
        }

        setChatLog((prev) => {
          const updated = [...prev];
          updated[updated.length - 1].content = reply;
          return updated;
        });
      }
    }
    isStreamingRef.current = false;
  } catch (err) {
    console.error("Streaming error:", err);
    isStreamingRef.current = false;
    setChatLog(prev => {
      const updated = [...prev];
      updated[updated.length - 1].content = "Something went wrong.";
      return updated;
    });
  }
};

