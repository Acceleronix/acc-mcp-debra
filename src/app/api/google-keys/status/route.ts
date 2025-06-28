import { googleKeyManager } from '@/lib/ai/google-key-manager';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const status = googleKeyManager.getStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('Error getting Google keys status:', error);
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}