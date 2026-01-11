const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const updatedHtml = html.replace(
  /window\.__ENV = {[^}]+}/,
  `window.__ENV = {
    NEXT_PUBLIC_SUPABASE_URL: '${process.env.NEXT_PUBLIC_SUPABASE_URL}',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: '${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}'
  }`
);

fs.writeFileSync('index.html', updatedHtml);