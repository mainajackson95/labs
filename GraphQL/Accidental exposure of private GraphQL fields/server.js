// server.js
const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');

// In-memory database
let users = [
  { id: '0', username: 'carlos', password: 'ilovecarlos', isAdmin: false },
  { id: '1', username: 'administrator', password: 'adminadmin', isAdmin: true }
];

const requireAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.isAdmin) {
    next();
  } else {
    res.status(403).send('<div class="container"><div class="alert error">Access denied. Admins only.</div></div>');
  }
};

// GraphQL schema
const schema = buildSchema(`
  type User {
    id: ID!
    username: String!
    password: String!
    isAdmin: Boolean!
  }

  type Query {
    getUser(id: ID!): User
    products: [Product]
  }

  type Product {
    id: ID!
    name: String!
    listed: Boolean!
    price: Float
    description: String
    image: String
  }

  type Mutation {
    login(username: String!, password: String!): String
  }
`);

// Root resolver
const root = {
  getUser: ({ id }) => users.find(user => user.id === id),
  products: () => [
    {
      id: '1',
      name: 'Web Security Book',
      listed: true,
      price: 49.99,
      description: 'Comprehensive guide to web application security',
      image: 'https://images.unsplash.com/photo-1548048026-5a1a941d93d3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80'
    },
    {
      id: '2',
      name: 'Burp Suite Pro',
      listed: true,
      price: 399.00,
      description: 'Professional web security testing toolkit',
      image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80'
    },
    {
      id: '4',
      name: 'Hacking Lab License',
      listed: true,
      price: 199.00,
      description: 'Access to premium security training labs',
      image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80'
    }
  ],
  login: ({ username, password }, context) => {
    const { req } = context;
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      // Set session
      req.session.user = {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin
      };
      return user.isAdmin ? 'ADMIN_REDIRECT' : 'Login successful!';
    } else {
      return 'Invalid credentials';
    }
  }
};

const app = express();
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
  secret: 'supersecret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Success popup middleware
app.use((req, res, next) => {
  const originalSend = res.send;

  res.send = function (body) {
    if (req.path === '/admin/delete' && req.method === 'POST') {
      if (body.includes('User deleted successfully')) {
        const popup = `
          <div id="success-popup" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.85);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
            backdrop-filter: blur(5px);
          ">
            <div style="
              background: linear-gradient(135deg, #1a2a6c, #b21f1f, #1a2a6c);
              padding: 5px;
              border-radius: 15px;
              animation: border-pulse 2s infinite;
            ">
              <div style="
                background: #0d1117;
                padding: 40px;
                border-radius: 12px;
                text-align: center;
                box-shadow: 0 0 40px rgba(0,255,127,0.7);
                border: 1px solid #30363d;
                width: 500px;
              ">
                <div style="font-size: 100px; color: #2ECC40; margin: 20px 0;">
                  ✓
                </div>
                <h1 style="color: #2ECC40; font-size: 36px; margin: 0; font-weight: bold;">
                  LAB SOLVED!
                </h1>
                <p style="font-size: 24px; margin: 20px 0 30px; color: #c9d1d9;">
                  You've successfully completed the lab
                </p>
                <div style="background: #161b22; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #30363d;">
                  <p style="margin: 0; color: #8b949e; font-size: 18px;">Accidental exposure of private GraphQL fields</p>
                </div>
                <button onclick="document.getElementById('success-popup').remove()" 
                  style="
                    background: #238636;
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    font-size: 18px;
                    border-radius: 5px;
                    cursor: pointer;
                    transition: all 0.3s;
                    font-weight: bold;
                    margin-top: 20px;
                  ">
                  CONTINUE
                </button>
              </div>
            </div>
          </div>
          <style>
            @keyframes border-pulse {
              0% { box-shadow: 0 0 10px rgba(46, 204, 64, 0.5); }
              50% { box-shadow: 0 0 30px rgba(46, 204, 64, 0.9); }
              100% { box-shadow: 0 0 10px rgba(46, 204, 64, 0.5); }
            }
          </style>
        `;
        body = popup + body;
      }
    }
    originalSend.call(this, body);
  };
  next();
});

// GraphQL endpoint
app.use('/graphql', graphqlHTTP((req) => ({
  schema: schema,
  rootValue: root,
  graphiql: true,
  context: { req } 
})));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Home route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>GraphQL Security Lab</title>
      <link rel="stylesheet" href="/styles.css">
    </head>
    <body>
      <header>
        <div class="container">
          <h1>GraphQL Security Lab</h1>
          <nav>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/products">Products</a></li>
              <li><a href="/my-account">My Account</a></li>
              <li><a href="/admin">Admin Panel</a></li>
            </ul>
          </nav>
        </div>
      </header>
      
      <main class="container">
        <div class="hero">
          <div class="hero-content">
            <h2>Master GraphQL Security</h2>
            <p>Discover and exploit vulnerabilities in a safe learning environment</p>
            <a href="/my-account" class="btn">Start Learning</a>
          </div>
          <div class="hero-image">
            <img src="https://images.unsplash.com/photo-1563014959-7aaa83350992?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80" alt="Cyber Security">
          </div>
        </div>
        
        <section class="features">
          <div class="feature-card">
            <div class="icon">🔍</div>
            <h3>Discover Endpoints</h3>
            <p>Find GraphQL API endpoints using common techniques</p>
          </div>
          <div class="feature-card">
            <div class="icon">💡</div>
            <h3>Introspection</h3>
            <p>Explore API schemas through introspection queries</p>
          </div>
          <div class="feature-card">
            <div class="icon">🛡️</div>
            <h3>Exploit Vulnerabilities</h3>
            <p>Identify and exploit insecure implementations</p>
          </div>
        </section>
      </main>
      
      <footer>
        <div class="container">
          <p>GraphQL Security Lab © 2023 | Designed for educational purposes</p>
        </div>
      </footer>
    </body>
    </html>
  `);
});

// Products route
app.get('/products', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Products - GraphQL Security Lab</title>
      <link rel="stylesheet" href="/styles.css">
    </head>
    <body>
      <header>
        <div class="container">
          <h1>GraphQL Security Lab</h1>
          <nav>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/products">Products</a></li>
              <li><a href="/my-account">My Account</a></li>
              <li><a href="/admin">Admin Panel</a></li>
            </ul>
          </nav>
        </div>
      </header>
      
      <main class="container">
        <h2>Security Learning Resources</h2>
        <div class="products-grid">
          <div class="product-card">
            <img src="https://images.unsplash.com/photo-1548048026-5a1a941d93d3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" alt="Web Security Book">
            <h3>Web Security Book</h3>
            <p class="price">$49.99</p>
            <p>Comprehensive guide to web application security</p>
          </div>
          <div class="product-card">
            <img src="https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" alt="Burp Suite Pro">
            <h3>Burp Suite Pro</h3>
            <p class="price">$399.00</p>
            <p>Professional web security testing toolkit</p>
          </div>
          <div class="product-card">
            <img src="https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" alt="Hacking Lab">
            <h3>Hacking Lab License</h3>
            <p class="price">$199.00</p>
            <p>Access to premium security training labs</p>
          </div>
        </div>
      </main>
      
      <footer>
        <div class="container">
          <p>GraphQL Security Lab © 2023 | Designed for educational purposes</p>
        </div>
      </footer>
    </body>
    </html>
  `);
});

// Admin panel route
app.get('/admin', requireAdmin, (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Admin Panel - GraphQL Security Lab</title>
      <link rel="stylesheet" href="/styles.css">
    </head>
    <body>
      <header>
        <div class="container">
          <h1>GraphQL Security Lab</h1>
          <nav>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/products">Products</a></li>
              <li><a href="/my-account">My Account</a></li>
              <li><a href="/admin">Admin Panel</a></li>
            </ul>
          </nav>
        </div>
      </header>
      
      <main class="container">
        <div class="admin-panel">
          <h2>Administrator Panel</h2>
          <div class="panel-section">
            <h3>User Management</h3>
            <form action="/admin/delete" method="POST">
              <div class="form-group">
                <label>Select user to delete:</label>
                <select name="username" class="form-control">
                  <option value="carlos">carlos (Standard User)</option>
                </select>
              </div>
              <button type="submit" class="btn danger">Delete User</button>
            </form>
          </div>
          
          <div class="panel-section">
            <h3>Recent Activity</h3>
            <div class="activity-log">
              <div class="log-entry">
                <div class="log-icon">🔒</div>
                <div class="log-content">
                  <p>User <strong>administrator</strong> logged in</p>
                  <small>2 minutes ago</small>
                </div>
              </div>
              <div class="log-entry">
                <div class="log-icon">👤</div>
                <div class="log-content">
                  <p>User <strong>carlos</strong> attempted login</p>
                  <small>5 minutes ago</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer>
        <div class="container">
          <p>GraphQL Security Lab © 2023 | Designed for educational purposes</p>
        </div>
      </footer>
    </body>
    </html>
  `);
});

// Delete endpoint
app.post('/admin/delete', requireAdmin, (req, res) => {
  const index = users.findIndex(u => u.username === 'carlos');
  if (index !== -1) {
    users.splice(index, 1);
    
    // Replace the entire response with this:
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Lab Solved</title>
        <link rel="stylesheet" href="/styles.css">
      </head>
      <body>
        <div class="container">
          <div class="alert success">User carlos deleted successfully</div>
          <p><a href="/">Back to home</a></p>
        </div>
        
        <!-- Success Popup -->
        <div id="success-popup" style="
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.85);
          z-index: 10000;
          display: flex;
          justify-content: center;
          align-items: center;
          backdrop-filter: blur(5px);
        ">
          <div style="
            background: linear-gradient(135deg, #1a2a6c, #b21f1f, #1a2a6c);
            padding: 5px;
            border-radius: 15px;
            animation: border-pulse 2s infinite;
          ">
            <div style="
              background: #0d1117;
              padding: 40px;
              border-radius: 12px;
              text-align: center;
              box-shadow: 0 0 40px rgba(0,255,127,0.7);
              border: 1px solid #30363d;
              width: 500px;
            ">
              <div style="font-size: 100px; color: #2ECC40; margin: 20px 0;">
                ✓
              </div>
              <h1 style="color: #2ECC40; font-size: 36px; margin: 0; font-weight: bold;">
                LAB SOLVED!
              </h1>
              <p style="font-size: 24px; margin: 20px 0 30px; color: #c9d1d9;">
                You've successfully completed the lab
              </p>
              <div style="background: #161b22; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #30363d;">
                <p style="margin: 0; color: #8b949e; font-size: 18px;">Accidental exposure of private GraphQL fields</p>
              </div>
              <button onclick="document.getElementById('success-popup').remove()" 
                style="
                  background: #238636;
                  color: white;
                  border: none;
                  padding: 12px 30px;
                  font-size: 18px;
                  border-radius: 5px;
                  cursor: pointer;
                  transition: all 0.3s;
                  font-weight: bold;
                  margin-top: 20px;
                ">
                CONTINUE
              </button>
            </div>
          </div>
        </div>
        <style>
          @keyframes border-pulse {
            0% { box-shadow: 0 0 10px rgba(46, 204, 64, 0.5); }
            50% { box-shadow: 0 0 30px rgba(46, 204, 64, 0.9); }
            100% { box-shadow: 0 0 10px rgba(46, 204, 64, 0.5); }
          }
        </style>
      </body>
      </html>
    `);
  } else {
    res.status(404).send('<div class="container"><div class="alert error">User not found</div></div>');
  }
});

// My Account route
app.get('/my-account', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>My Account - GraphQL Security Lab</title>
      <link rel="stylesheet" href="/styles.css">
    </head>
    <body>
      <header>
        <div class="container">
          <h1>GraphQL Security Lab</h1>
          <nav>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/products">Products</a></li>
              <li><a href="/my-account">My Account</a></li>
              <li><a href="/admin">Admin Panel</a></li>
            </ul>
          </nav>
        </div>
      </header>
      
      <main class="container">
        <div class="login-container">
          <div class="login-card">
            <h2>Login to Your Account</h2>
            <form id="loginForm">
              <div class="form-group">
                <label for="username">Username</label>
                <input type="text" id="username" name="username" required>
              </div>
              <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required>
              </div>
              <button type="submit" class="btn">Sign In</button>
            </form>
            <div class="login-footer">
              <p>Don't have an account? <a href="#">Register</a></p>
              <p><a href="#">Forgot password?</a></p>
            </div>
          </div>
          
          <div class="info-panel">
            <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80" alt="Security">
            <div class="hint">
              <h4>💡 Hint</h4>
              <p>GraphQL introspection might reveal more than intended. Try exploring the API schema.</p>
            </div>
          </div>
        </div>
      </main>
      
      <footer>
        <div class="container">
          <p>GraphQL Security Lab © 2023 | Designed for educational purposes</p>
        </div>
      </footer>
      
            <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const username = document.getElementById('username').value;
          const password = document.getElementById('password').value;

          const response = await fetch('/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: 'mutation Login($username: String!, $password: String!) { login(username: $username, password: $password) }',
              variables: { username, password }
            })
          });
              
          const result = await response.json();
          if (result.data?.login === 'ADMIN_REDIRECT') {
            window.location.href = '/admin';
          } else if (result.data?.login === 'Login successful!') {
            alert('Login successful! Redirecting...');
            window.location.href = '/';
          } else {
            alert('Login failed. Invalid credentials');
          }
        });
      </script>
    </body>
    </html>
  `);
});

const PORT = 4000;
app.listen(PORT, () => console.log(`Lab running at http://localhost:${PORT}`));