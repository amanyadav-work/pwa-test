import { GenerateAiDataGroq } from '@/actions/groq-copy';

export async function generateHealthReport(conversation, engine, offline) {
  // Compose prompt for summary in markdown
  const prompt = `
You are a caring virtual doctor summarizing the following conversation between a patient and assistant.  
Create a detailed but concise health report in Markdown format covering:

- What problem or symptoms the user described  
- Any specific details or concerns mentioned  
- Suggestions, remedies, or medicines given  
- Additional helpful advice based on the conversation  

Use friendly, easy-to-understand language. Format clearly using headings and bullet points where needed.

Conversation:  
${conversation.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n')}
  
Report in markdown:
`;

  if (offline && engine) {
    // Offline: Use MLC engine chat completion
    const messages = [
      {
        role: 'system',
        content: 'You are a kind and professional Indian virtual doctor who provides helpful summaries in markdown.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    try {
      const responseChunks = await engine.chat.completions.create({
        messages,
        temperature: 1,
        max_tokens: 1024,
        stream: false,
      });

      let report = responseChunks.choices[0].message.content;
    
      return report.trim();
    } catch (error) {
      console.error('Offline report generation failed:', error);
      throw error;
    }
  } else {
    // Online: Use Groq API (assuming GenerateAiDataGroq returns { text })
    try {
      const result = await GenerateAiDataGroq(
        [{ role: 'user', content: prompt }],
        undefined,
        []
      );
      return result?.text?.trim() || 'Failed to generate report.';
    } catch (error) {
      console.error('Online report generation failed:', error);
      throw error;
    }
  }
}
