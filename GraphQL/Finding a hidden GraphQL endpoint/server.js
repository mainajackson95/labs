const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');

let users = [
  { id: '1', username: 'admin' },
  { id: '2', username: 'wiener' },
  { id: '3', username: 'carlos' }
];
let labSolved = false;

const schema = buildSchema(`
  type User {
    id: ID!
    username: String!
  }

  input DeleteUserInput {
    id: ID!
  }

  type DeleteUserPayload {
    user: User
  }

  type Query {
    getUser(id: ID!): User
  }

  type Mutation {
    deleteOrganizationUser(input: DeleteUserInput!): DeleteUserPayload
  }
`);

const root = {
  getUser: ({ id }) => users.find(user => user.id === id),
  deleteOrganizationUser: ({ input }) => {
    if (input.id === '3') {
      const deletedUser = users.find(user => user.id === '3');
      users = users.filter(user => user.id !== '3');
      labSolved = true;
      return { user: deletedUser };
    }
    return { user: null };
  }
};

const app = express();

// Ultra-robust introspection blocking with debugging
const blockIntrospection = (query, debug = false) => {
  // Only remove whitespace that could be used for obfuscation, but preserve newlines
  const cleanQuery = query
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[\r\t\+%20%0d%09]/gi, '') // Remove tabs and other separators
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, '') // Remove control chars
    .replace(/[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000\ufeff]/g, ''); // Unicode spaces
  
  // Check for specific patterns that indicate introspection bypass attempts
  const introspectionPatterns = [
    // Core patterns that should be blocked
    /__schema\{/,  // Block __schema{ without space
    /__type\{/,     // Block __type{ without space
  ];
  
  // Check if any pattern matches
  const matchedPatterns = [];
  const isIntrospection = introspectionPatterns.some(pattern => {
    if (pattern.test(cleanQuery)) {
      matchedPatterns.push(pattern.toString());
      return true;
    }
    return false;
  });
  
  // Debug logging
  if (debug && isIntrospection) {
    console.log('=== INTROSPECTION DETECTION DEBUG ===');
    console.log('Original query:', query.substring(0, 200) + '...');
    console.log('Cleaned query:', cleanQuery.substring(0, 200) + '...');
    console.log('Matched patterns:', matchedPatterns);
    console.log('=====================================');
  }
  
  return isIntrospection;
};

// GET endpoint for GraphQL with mutation support
app.get('/api', (req, res) => {
  let query = req.query.query || '';
  
  // Decode URL encoding
  let decodedQuery = query;
  try {
    for (let i = 0; i < 3; i++) {
      const previous = decodedQuery;
      decodedQuery = decodeURIComponent(decodedQuery);
      if (previous === decodedQuery) break;
    }
  } catch (e) {
    return res.status(400).json({ 
      errors: [{ message: 'Invalid query encoding' }] 
    });
  }
  
  // DEVELOPMENT ONLY: Temporary bypass
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const bypassKeyword = 'BYPASS_FOR_TESTING';
  
  if (isDevelopment && decodedQuery.includes(bypassKeyword)) {
    console.log('🚨 DEVELOPMENT BYPASS ACTIVATED');
    decodedQuery = decodedQuery.replace(bypassKeyword, '');
  } else if (blockIntrospection(decodedQuery, true)) {
    return res.status(403).json({ 
      errors: [{ 
        message: 'Introspection blocked: Security policy violation detected' 
      }] 
    });
  }
  
  return graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: false,
    introspection: false,
    allowGetMutations: true // Allow mutations via GET
  })(req, res);
});


app.get('/api', (req, res) => {
  let query = req.query.query || '';
  
  // Decode URL encoding (handle multiple encodings)
  let decodedQuery = query;
  try {
    // Decode multiple times to handle double encoding
    for (let i = 0; i < 3; i++) {
      const previous = decodedQuery;
      decodedQuery = decodeURIComponent(decodedQuery);
      if (previous === decodedQuery) break; // No more decoding needed
    }
  } catch (e) {
    return res.status(400).json({ 
      errors: [{ message: 'Invalid query encoding' }] 
    });
  }
  
  // DEVELOPMENT ONLY: Temporary bypass (remove in production)
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const bypassKeyword = 'BYPASS_FOR_TESTING';
  
  if (isDevelopment && decodedQuery.includes(bypassKeyword)) {
    console.log('🚨 DEVELOPMENT BYPASS ACTIVATED');
    // Remove the bypass keyword and continue
    decodedQuery = decodedQuery.replace(bypassKeyword, '');
  } else if (blockIntrospection(decodedQuery, true)) { // Enable debug mode
    return res.status(403).json({ 
      errors: [{ 
        message: 'Introspection blocked: Security policy violation detected' 
      }] 
    });
  }
  
  return graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: false,
    introspection: false, // Also disable at GraphQL level
    allowGetMutations: true // Allow mutations via GET
  })(req, res);
});

// Configure express middleware BEFORE routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// POST endpoint for GraphQL
app.post('/api', (req, res) => {
  const query = req.body.query || '';
  
  if (blockIntrospection(query, true)) {
    return res.status(403).json({ 
      errors: [{ 
        message: 'Introspection blocked: Security policy violation detected' 
      }] 
    });
  }
  
  return graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: false,
    introspection: false
  })(req, res);
});

// Visual verification endpoint
app.get('/', (req, res) => {
  // Custom success popup HTML/CSS
  const successPopup = labSolved ? `
    <div id="successPopup" class="popup show">
      <div class="popup-content">
        <div class="popup-header">
          <h2>Lab Solved!</h2>
          <span class="close">&times;</span>
        </div>
        <div class="popup-body">
          <svg class="success-icon" viewBox="0 0 24 24">
            <path fill="#4CAF50" d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M10,17l-5-5l1.41-1.41L10,14.17l7.59-7.59L19,8L10,17z"/>
          </svg>
          <p>Congratulations! You've successfully solved the lab!</p>
          <p>You've found the hidden GraphQL endpoint and deleted carlos.</p>
        </div>
        <div class="popup-footer">
          <button class="dismiss-btn">Dismiss</button>
        </div>
      </div>
    </div>
    <script>
      document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('successPopup').classList.remove('show');
      });
      document.querySelector('.dismiss-btn').addEventListener('click', () => {
        document.getElementById('successPopup').classList.remove('show');
      });
    </script>
  ` : '';

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GraphQL API Service</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                color: #333;
            }
            
            .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
                position: relative;
            }
            
            .header {
                text-align: center;
                margin-bottom: 40px;
                padding: 40px 0;
            }
            
            .header h1 {
                color: white;
                font-size: 3rem;
                font-weight: 300;
                margin-bottom: 10px;
                text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            
            .header p {
                color: rgba(255,255,255,0.8);
                font-size: 1.2rem;
                font-weight: 300;
            }
            
            .status-card {
                background: rgba(255,255,255,0.95);
                border-radius: 15px;
                padding: 30px;
                margin-bottom: 30px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.2);
            }
            
            .api-status {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 20px;
                padding-bottom: 20px;
                border-bottom: 1px solid #e0e0e0;
            }
            
            .status-indicator {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .status-dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #4CAF50;
                box-shadow: 0 0 10px rgba(76,175,80,0.5);
            }
            
            .status-text {
                font-weight: 600;
                color: #2e7d32;
            }
            
            .endpoint-info {
                background: #f8f9fa;
                border-radius: 10px;
                padding: 20px;
                margin-top: 20px;
            }
            
            .endpoint-info h3 {
                color: #495057;
                margin-bottom: 15px;
                font-size: 1.1rem;
            }
            
            .endpoint {
                background: #fff;
                border: 1px solid #dee2e6;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 10px;
                font-family: 'Courier New', monospace;
                color: #6c757d;
                position: relative;
                overflow-x: auto;
            }
            
            .method {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
                margin-right: 10px;
            }
            
            .method.get {
                background: #e3f2fd;
                color: #1976d2;
            }
            
            .method.post {
                background: #e8f5e8;
                color: #388e3c;
            }
            
            .user-count {
                text-align: center;
                font-size: 2rem;
                font-weight: 300;
                color: #666;
                margin: 20px 0;
            }
            
            .footer {
                text-align: center;
                color: rgba(255,255,255,0.7);
                font-size: 0.9rem;
                margin-top: 40px;
                padding: 20px 0;
            }
            
            .pulse {
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            
            /* Success Popup Styles */
            .popup {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }
            
            .popup.show {
                opacity: 1;
                visibility: visible;
            }
            
            .popup-content {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 15px;
                width: 90%;
                max-width: 500px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                overflow: hidden;
                transform: translateY(-50px);
                transition: transform 0.5s ease;
            }
            
            .popup.show .popup-content {
                transform: translateY(0);
            }
            
            .popup-header {
                padding: 20px;
                background: rgba(0,0,0,0.1);
                position: relative;
            }
            
            .popup-header h2 {
                color: white;
                text-align: center;
                font-weight: 300;
                font-size: 1.8rem;
            }
            
            .popup-header .close {
                position: absolute;
                top: 15px;
                right: 20px;
                font-size: 28px;
                color: white;
                cursor: pointer;
                transition: color 0.3s;
            }
            
            .popup-header .close:hover {
                color: #ff5252;
            }
            
            .popup-body {
                padding: 30px 20px;
                text-align: center;
                color: white;
            }
            
            .success-icon {
                width: 80px;
                height: 80px;
                margin-bottom: 20px;
                animation: successScale 0.5s ease;
            }
            
            @keyframes successScale {
                0% { transform: scale(0); }
                70% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }
            
            .popup-body p {
                margin: 10px 0;
                font-size: 1.1rem;
                line-height: 1.6;
            }
            
            .popup-footer {
                padding: 20px;
                text-align: center;
                background: rgba(0,0,0,0.1);
            }
            
            .dismiss-btn {
                background: white;
                border: none;
                border-radius: 50px;
                padding: 12px 30px;
                font-size: 1rem;
                color: #764ba2;
                cursor: pointer;
                transition: all 0.3s ease;
                font-weight: 600;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            }
            
            .dismiss-btn:hover {
                transform: translateY(-3px);
                box-shadow: 0 6px 20px rgba(0,0,0,0.3);
            }
            
            .dismiss-btn:active {
                transform: translateY(0);
            }
            
            @media (max-width: 768px) {
                .header h1 {
                    font-size: 2rem;
                }
                
                .container {
                    padding: 15px;
                }
                
                .status-card {
                    padding: 20px;
                }
                
                .popup-content {
                    width: 95%;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            ${successPopup}
            
            <div class="header">
                <h1 class="pulse">GraphQL API</h1>
                <p>Enterprise Data Service</p>
            </div>
            
            <div class="status-card">
                <div class="api-status">
                    <div class="status-indicator">
                        <div class="status-dot"></div>
                        <span class="status-text">Service Online</span>
                    </div>
                    <div class="user-count">
                        ${users.length} Active Records
                    </div>
                </div>
                
                <div class="endpoint-info">
                    <h3>Available Endpoints</h3>
                    
                    <div class="endpoint">
                        <span class="method get">GET</span>
                        <code>/api?query={...}</code>
                    </div>
                    
                    <div class="endpoint">
                        <span class="method post">POST</span>
                        <code>/api</code> - Content-Type: application/json
                    </div>
                </div>
            </div>
            
            <div class="footer">
                <p>&copy; 2024 GraphQL Service Platform | Powered by Express & GraphQL</p>
            </div>
        </div>
        
        <script>
            // Auto-show popup on page load if solved
            window.onload = function() {
                const popup = document.getElementById('successPopup');
                if (popup && popup.classList.contains('show')) {
                    setTimeout(() => {
                        popup.classList.add('show');
                    }, 500);
                }
            };
        </script>
    </body>
    </html>
  `);
});

app.listen(3000, () => console.log('GraphQL Security Lab running on port 3000'));