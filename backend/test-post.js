const http = require('http');

const req1 = http.request('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, (res1) => {
  let data1 = '';
  res1.on('data', chunk => data1 += chunk);
  res1.on('end', () => {
    const token = JSON.parse(data1).token;
    console.log('Token:', token);
    const req2 = http.request('http://localhost:3001/api/bots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    }, (res2) => {
      let data2 = '';
      res2.on('data', chunk => data2 += chunk);
      res2.on('end', () => console.log('Status:', res2.statusCode, 'Body:', data2));
    });
    req2.write(JSON.stringify({ userId: '1', name: 'Test Bot 2', wingoPhone: '123', wingoPassword: '123' }));
    req2.end();
  });
});
req1.write(JSON.stringify({ password: 'admin123' }));
req1.end();
