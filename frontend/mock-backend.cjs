const http = require('http');

const data = {
  summary: { totalEnquiries: 24, pendingAnalysis: 3, pendingApprovals: 2, followupsDue: 5, highPriority: 4, mediumPriority: 15, lowPriority: 5, aiProcessed: 21, completed: 18 },
  enquiries: [
    { id: 'enq-1', customerName: 'Acme Corp', customerEmail: 'contact@acme.com', status: 'PENDING_APPROVAL', priority: 'HIGH', budget: 15000, currency: 'USD', timeline: '6 weeks', aiSummary: 'Comprehensive enterprise CRM system with custom API integrations.', createdAt: new Date().toISOString() },
    { id: 'enq-2', customerName: 'Globex Inc', customerEmail: 'info@globex.com', status: 'ANALYZING', priority: 'MEDIUM', budget: 5000, currency: 'USD', timeline: '2 weeks', aiSummary: 'Standard marketing website with CMS.', createdAt: new Date().toISOString() },
    { id: 'enq-3', customerName: 'Stark Industries', customerEmail: 'tony@stark.com', status: 'COMPLETED', priority: 'HIGH', budget: 120000, currency: 'USD', timeline: '6 months', aiSummary: 'Security audit and infrastructure overhaul.', createdAt: new Date().toISOString() }
  ],
  quotations: [
    { id: 'quot-1', enquiryId: 'enq-1', customer: 'Acme Corp', amount: 15000, status: 'PENDING_APPROVAL', createdAt: new Date().toISOString() }
  ],
  followUps: [
    { id: 'fu-1', title: 'Schedule technical scoping call', dueDate: new Date().toISOString(), status: 'PENDING', priority: 'HIGH', enquiryId: 'enq-1', customer: 'Acme Corp' },
    { id: 'fu-2', title: 'Send revised contract', dueDate: new Date().toISOString(), status: 'COMPLETED', priority: 'MEDIUM', enquiryId: 'enq-2', customer: 'Globex Inc' }
  ]
};

const sendJson = (res, payload) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, data: payload }));
};

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url;
  
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      const parsedBody = body ? JSON.parse(body) : {};
      if (url === '/api/auth/login' || url === '/api/auth/register') {
        return sendJson(res, { token: 'mock-token', user: { id: 'u1', name: parsedBody.fullName || 'Demo User', email: parsedBody.email } });
      }
      if (url.includes('/analyze')) return setTimeout(() => sendJson(res, { status: 'REVIEW' }), 1000);
      if (url.includes('/generate-response')) return setTimeout(() => sendJson(res, { status: 'REVIEW' }), 1000);
      if (url.includes('/generate-quotation')) return setTimeout(() => sendJson(res, { status: 'PENDING_APPROVAL' }), 1000);
      if (url.includes('/generate-followups')) return setTimeout(() => sendJson(res, { status: 'PENDING_APPROVAL' }), 1000);
      if (url.includes('/approve')) return setTimeout(() => sendJson(res, { status: 'APPROVED' }), 1000);
      if (url.includes('/reject')) return setTimeout(() => sendJson(res, { status: 'REVIEW' }), 1000);
      if (url === '/api/enquiries') return setTimeout(() => sendJson(res, { id: 'enq-new' }), 1000);
      
      sendJson(res, {});
    });
    return;
  }

  if (req.method === 'PATCH') {
    return setTimeout(() => sendJson(res, { status: 'COMPLETED' }), 500);
  }

  if (req.method === 'GET') {
    if (url === '/api/dashboard/summary') return sendJson(res, { summary: data.summary });
    if (url === '/api/enquiries') return sendJson(res, { enquiries: data.enquiries });
    if (url === '/api/quotations') return sendJson(res, { quotations: data.quotations });
    if (url === '/api/followups') return sendJson(res, { followUps: data.followUps });
    
    if (url.startsWith('/api/enquiries/')) {
      const id = url.split('/').pop();
      return sendJson(res, {
        enquiry: {
          id, customerName: 'Acme Corp', customerEmail: 'contact@acme.com', status: 'PENDING_APPROVAL', priority: 'HIGH', budget: 15000, currency: 'USD', timeline: '6 weeks', rawContent: 'Hi team,\n\nWe need a CRM.', aiSummary: 'CRM system', requirements: ['CRM'], missingInformation: ['Users?'], suggestedResponse: 'Thanks',
          quotation: { id: 'quot-1', totalAmount: 15000, items: [{ description: 'CRM', quantity: 1, total: 15000 }] }, followUps: [ data.followUps[0] ]
        }
      });
    }
    if (url.startsWith('/api/quotations/')) {
      const id = url.split('/').pop();
      return sendJson(res, {
        quotation: {
          id, enquiryId: 'enq-1', customer: 'Acme Corp', amount: 15000, currency: 'USD', status: 'PENDING_APPROVAL', createdAt: new Date().toISOString(),
          items: [{ description: 'CRM Core Development', quantity: 1, total: 15000 }], enquiry: { customerName: 'Acme Corp' }
        }
      });
    }
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(5000, () => {
  console.log('----------------------------------------------------');
  console.log('MOCK BACKEND RUNNING ON PORT 5000');
  console.log('Serving frontend requests via standard Node HTTP.');
  console.log('----------------------------------------------------');
});
