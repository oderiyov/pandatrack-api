require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testConnection() {
  try {
    // Test database connection
    const { data, error } = await supabase
      .from('carriers')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Database error:', error);
      return;
    }
    
    console.log('✅ Database connection successful!');
    console.log('📦 Found carriers:', data.length);
    console.log('🚛 Carriers:', data.map(c => c.name).join(', '));
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection();