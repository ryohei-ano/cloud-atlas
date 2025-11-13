import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ANONYMOUS_USER_ID } from '@/lib/constants';

export async function POST(req: Request) {
  console.log('POST /api/post-memory - Request received');
  
  try {
    const { memory } = await req.json();
    console.log('Memory content:', memory);

    if (!memory || memory.length < 3) {
      console.log('Memory validation failed - too short');
      return NextResponse.json({ error: 'Memory too short' }, { status: 400 });
    }

    console.log('Attempting to insert into Supabase...');
    const { data, error } = await supabase
      .from('memories')
      .insert([{ memory, memory_id: ANONYMOUS_USER_ID }])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ 
        error: `Database error: ${error.message}`,
        details: error 
      }, { status: 500 });
    }

    console.log('Successfully inserted into Supabase:', data);
    return NextResponse.json({ 
      message: 'Saved', 
      inserted_data: data 
    });
  } catch (err) {
    console.error('API route error:', err);
    return NextResponse.json({ 
      error: `Server error: ${err instanceof Error ? err.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}
