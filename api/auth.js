// Import required libraries
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Authenticate API key
export async function authenticate(apiKey) {
  try {
    // Check if API key exists in Supabase
    const { data, error } = await supabase
      .from('api_keys')
      .select('user_email, active')
      .eq('key', apiKey)
      .single();
    
    if (error || !data || !data.active) {
      return null;
    }
    
    return data.user_email;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}
