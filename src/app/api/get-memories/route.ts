import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logError } from '@/lib/errorHandler';

export async function GET() {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    logError(error, {
      endpoint: '/api/get-memories',
      method: 'GET',
      message: 'Failed to fetch memories from database',
    });
    return NextResponse.json({ error: 'Fetch error' }, { status: 500 });
  }

  return NextResponse.json(data);
}
