import https from 'https';

https.get('https://api.microlink.io?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(data));
});
