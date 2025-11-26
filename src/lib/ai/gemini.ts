import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy');

/**
 * Generate embeddings for text content using Gemini
 * Used for semantic search (Phase 3.1)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Generate AI tags for document content
 * Used for automated tagging (Advanced Feature 2)
 */
export async function generateTags(text: string): Promise<string[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Analyze the following document content and suggest 3-5 relevant, concise tags that categorize it.
Return ONLY a comma-separated list of tags, nothing else.

Document content:
${text.substring(0, 5000)}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();

    // Parse comma-separated tags
    const tags = response
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0 && tag.length < 30)
      .slice(0, 5);

    return tags;
  } catch (error) {
    console.error('Error generating tags:', error);
    return [];
  }
}

/**
 * Answer questions using RAG (Retrieval-Augmented Generation)
 * Used for Advanced Feature 1
 */
export async function answerQuestion(
  question: string,
  context: Array<{ title: string; content: string; source: string }>
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const contextText = context
      .map((doc, idx) => `[${idx + 1}] ${doc.title}\n${doc.content}\nSource: ${doc.source}`)
      .join('\n\n---\n\n');

    const prompt = `You are a helpful assistant that answers questions based on archived documents.
Use the following document excerpts to answer the user's question. Always cite your sources using [1], [2], etc.

Documents:
${contextText}

Question: ${question}

Answer:`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error answering question:', error);
    throw error;
  }
}
