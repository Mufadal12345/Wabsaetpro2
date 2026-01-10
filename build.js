const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

// استبدال القيم المضمنة بمتغيرات البيئة
const updatedHtml = html
  .replace('https://lpjimlprsbtcbitanxop.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lpjimlprsbtcbitanxop.supabase.co')
  .replace('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

fs.writeFileSync('dist/index.html', updatedHtml);
