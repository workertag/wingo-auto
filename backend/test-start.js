const { PrismaClient } = require('@prisma/client');
const http = require('http');

const prisma = new PrismaClient();

async function run() {
  const user = await prisma.user.findFirst();
  const bot = await prisma.botInstance.findFirst();
  console.log('Bot:', bot);
  if (!bot) {
     console.log('No bot found');
     return;
  }
  
  // Login to get token
  const req1 = http.request('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, (res1) => {
    let data1 = '';
    res1.on('data', chunk => data1 += chunk);
    res1.on('end', () => {
      const token = JSON.parse(data1).token;
      console.log('Token generated');
      
      const req2 = http.request(`http://localhost:3001/api/bots/${bot.id}/start`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }, (res2) => {
        let data2 = '';
        res2.on('data', chunk => data2 += chunk);
        res2.on('end', () => console.log('Start Status:', res2.statusCode, 'Body:', data2));
      });
      req2.end();
    });
  });
  req1.write(JSON.stringify({ password: 'admin123' }));
  req1.end();
}
run();
