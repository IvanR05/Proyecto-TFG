//require('dotenv').config();

// Get the variables from config.json
//const config = require('./config.json');

// Load Supabase
import { createClient } from '@supabase/supabase-js';

// Read environment variables
//const SUPABASE_URL = config.SUPABASE_URL;
//const SUPABASE_KEY = config.SUPABASE_KEY;


// Create Supabase client
const supabase = createClient(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_ANON_KEY,
);

// Export to use in other scripts
export { supabase };
