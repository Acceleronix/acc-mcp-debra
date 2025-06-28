import { googleKeyManager } from '@/lib/ai/google-key-manager';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { NextResponse } from 'next/server';

interface TestResult {
  attempt: number;
  status: 'success' | 'error';
  keyMask?: string;
  message?: string;
  error?: string;
}

export async function POST() {
  try {
    const testResults: TestResult[] = [];
    let attempts = 0;
    const maxAttempts = 3;
    
    console.log('Starting Google API keys test...');
    
    while (attempts < maxAttempts) {
      const apiKey = googleKeyManager.getApiKey();
      if (!apiKey) {
        testResults.push({
          attempt: attempts + 1,
          status: 'error',
          message: 'No API key available'
        });
        break;
      }
      
      try {
        // Test a simple API call
        const googleProvider = createGoogleGenerativeAI({ apiKey });
        const model = googleProvider('gemini-2.5-flash-preview-04-17');
        
        // Try a minimal generation
        await model.doGenerate({
          inputFormat: 'prompt',
          prompt: [{ role: 'user', content: [{ type: 'text', text: 'Hi' }] }],
          mode: { type: 'regular', tools: undefined, toolChoice: undefined },
          providerOptions: {}
        });
        
        testResults.push({
          attempt: attempts + 1,
          status: 'success',
          keyMask: apiKey.substring(0, 8) + '...',
          message: 'API call successful'
        });
        
        break; // Success, no need to continue
        
      } catch (error: any) {
        attempts++;
        
        // Report error to key manager
        googleKeyManager.reportError(apiKey, error);
        
        testResults.push({
          attempt: attempts,
          status: 'error',
          keyMask: apiKey.substring(0, 8) + '...',
          error: error?.message || error?.toString() || 'Unknown error'
        });
        
        if (attempts >= maxAttempts) {
          break;
        }
      }
    }
    
    // Get current status
    const status = googleKeyManager.getStatus();
    
    return NextResponse.json({
      testResults,
      keyManagerStatus: status,
      summary: {
        totalAttempts: attempts,
        success: testResults.some(r => r.status === 'success'),
        activeKeys: status.activeKeys,
        totalKeys: status.totalKeys
      }
    });
    
  } catch (error) {
    console.error('Error testing Google keys:', error);
    return NextResponse.json(
      { error: 'Failed to test Google keys', details: error?.toString() },
      { status: 500 }
    );
  }
}