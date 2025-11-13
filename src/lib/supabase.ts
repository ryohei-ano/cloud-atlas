import { createClient } from '@supabase/supabase-js';

// Next.jsでは環境変数名を静的に指定する必要があります
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase環境変数が設定されていません。.env.localファイルを確認してください。');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
