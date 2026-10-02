import express from 'express';
import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createXai } from '@ai-sdk/xai';

const router = express.Router();

function getModelProvider(providerName, userApiKey) {
  switch (providerName?.toLowerCase()) {
    case 'gemini': {
      const apiKey = userApiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('Missing Gemini API Key');
      const google = createGoogleGenerativeAI({ apiKey });
      return google('gemini-2.5-flash');
    }

    case 'claude': {
      const apiKey = userApiKey || process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error('Missing Anthropic API Key');
      const anthropic = createAnthropic({ apiKey });
      return anthropic('claude-3-7-sonnet-20250219');
    }

    case 'deepseek': {
      const apiKey = userApiKey || process.env.DEEPSEEK_API_KEY;
      if (!apiKey) throw new Error('Missing DeepSeek API Key');
      const deepseek = createDeepSeek({ apiKey });
      return deepseek('deepseek-chat');
    }

    case 'grok': {
      const apiKey = userApiKey || process.env.XAI_API_KEY;
      if (!apiKey) throw new Error('Missing Grok/xAI API Key');
      const xai = createXai({ apiKey });
      return xai('grok-4.5');
    }

    default:
      throw new Error(`Unsupported provider: "${providerName}". Supported: gemini, claude, deepseek, grok`);
  }
}

router.post('/api/chat', async (req, res) => {
  try {
    const { provider, messages, systemInstruction } = req.body;
    const userApiKey = req.headers['x-custom-api-key'];

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const model = getModelProvider(provider, userApiKey);

    const result = streamText({
      model,
      system: systemInstruction || 'You are OmniStudent, a friendly and helpful AI study assistant.',
      messages,
      temperature: 0.7,
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    return result.pipeTextStreamToResponse(res);

  } catch (error) {
    console.error('[Chat API Error]:', error.message);
    return res.status(500).json({ 
      error: error.message || 'An error occurred while communicating with the AI model.' 
    });
  }
});

export default router;
