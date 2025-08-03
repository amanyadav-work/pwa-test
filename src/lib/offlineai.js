import { CreateMLCEngine } from "@mlc-ai/web-llm";


export const initializeEngine = async (setEngine, setLoading, setProgressText) => {

  try {
    const model = "SmolLM2-135M-Instruct-q0f32-MLC";

    const initProgressCallback = (progress) => {
      console.log('[MLC Progress Raw]', progress);
      const percent = Math.floor(progress.progress * 100);
      const text = progress.text || "Loading model...";
      setProgressText(`${text} (${percent}%) ---- Time Elapsed ${progress.timeElapsed.toFixed(2)}s`);
    };

    const engineInstance = await CreateMLCEngine(model, {
      initProgressCallback,
    });

    setEngine(engineInstance);
  } catch (error) {
    console.error("Error initializing MLC engine:", error);
    setProgressText("Failed to load model. Please try again later.");
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
  onToken, // <-- ✅ NEW: token handler for real-time speech
}) => {
  if (!input || !engine || isStreamingRef.current) return;

  const newMessages = [
    ...chatLog,
    { role: "user", content: input },
    { role: "assistant", content: "" },
  ];
  setChatLog(newMessages);
  setInput("");

  isStreamingRef.current = true;

  const chunks = await engine.chat.completions.create({
    messages: [...chatLog, { role: "user", content: input }],
    temperature: 0.8,
    stream: true,
    stream_options: { include_usage: true },
  });

  let reply = "";

  for await (const chunk of chunks) {
    const delta = chunk.choices?.[0]?.delta?.content;
    if (delta) {
      reply += delta;

      // ✅ Emit token to external handler
      if (onToken) {
        onToken(delta);
      }

      // ✅ Update chat UI
      setChatLog((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].content = reply;
        return updated;
      });
    }
  }

  isStreamingRef.current = false;
};
