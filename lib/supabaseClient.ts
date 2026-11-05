import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rktwutibfgaytygtavfy.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_CP6fSFEw4icdfm7I6OqJxw_FHqBzEfe';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
