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

/**
 * PHASE 1.1: Suggest facets for a document based on its content
 * Returns suggested hard facets from predefined categories
 */
export async function suggestFacets(
  title: string,
  content: string,
  fileName: string
): Promise<{
  era?: string[];
  location?: string[];
  subject?: string[];
  sourceType?: string;
  language?: string;
  sensitivity?: string;
}> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Analyze this historical document and suggest appropriate facets (categories).

Document Title: ${title}
File Name: ${fileName}
Content Preview: ${content.substring(0, 3000)}

Based on the content, suggest facets from these options:

ERA (select all that apply):
- ancient_history, classical_antiquity, medieval, renaissance, early_modern, 18th_century, 19th_century, 20th_century, 21st_century, contemporary

LOCATION (select all that apply):
- global, europe, asia, africa, americas, oceania, middle_east, turkey, anatolia

SUBJECT (select all that apply):
- military, politics, culture, economy, science, religion, society, art, education, technology

SOURCE_TYPE (select ONE - REQUIRED):
- government_document, personal_document, newspaper, book, photograph, audio_recording, video_recording, manuscript, letter, map

LANGUAGE (select ONE):
- en, tr, ar, fa, el, ota, de, fr, ru, es, it, zh, ja

SENSITIVITY (select ONE - REQUIRED):
- public, sensitive, confidential, restricted

Return your response ONLY as a JSON object in this format:
{
  "era": ["20th_century"],
  "location": ["europe", "turkey"],
  "subject": ["military", "politics"],
  "sourceType": "government_document",
  "language": "tr",
  "sensitivity": "public"
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = responseText;
    if (responseText.includes('```json')) {
      jsonText = responseText.split('```json')[1].split('```')[0].trim();
    } else if (responseText.includes('```')) {
      jsonText = responseText.split('```')[1].split('```')[0].trim();
    }

    const facets = JSON.parse(jsonText);
    return facets;
  } catch (error) {
    console.error('Error suggesting facets:', error);
    // Return safe defaults on error
    return {
      sourceType: 'other',
      sensitivity: 'public',
    };
  }
}

/**
 * PHASE 1.1: Generate English translation of document content
 * Returns a draft translation (status: 'draft')
 */
export async function generateTranslation(
  content: string,
  targetLanguage: string = 'en',
  sourceLanguage?: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const sourceLangText = sourceLanguage
      ? `from ${sourceLanguage}`
      : '';

    const prompt = `Translate the following document content ${sourceLangText} to ${targetLanguage}.
Preserve the original formatting, structure, and meaning as much as possible.
This is a historical archive document, so maintain formal tone and accuracy.

Content to translate:
${content.substring(0, 10000)}

Translation:`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error generating translation:', error);
    return '';
  }
}

/**
 * PHASE 1.1: Extract text from image using OCR (Gemini Vision)
 */
export async function extractTextFromImage(imageBuffer: Buffer, mimeType: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const imagePart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: mimeType,
      },
    };

    const prompt = `Extract ALL text from this image.
If this is a historical document, preserve the original layout and formatting as much as possible.
If there is no text, return "NO_TEXT_FOUND".

Return only the extracted text, nothing else.`;

    const result = await model.generateContent([prompt, imagePart]);
    const extractedText = result.response.text().trim();

    return extractedText === 'NO_TEXT_FOUND' ? '' : extractedText;
  } catch (error) {
    console.error('Error extracting text from image:', error);
    return '';
  }
}
