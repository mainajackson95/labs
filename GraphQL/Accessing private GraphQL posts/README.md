# GraphQL Security Lab - Docker Environment

A hands-on Docker lab for practicing GraphQL security testing, specifically focusing on accessing private GraphQL posts through introspection and IDOR vulnerabilities.

## 🎯 Lab Objective

**Accessing Private GraphQL Post**: Find the hidden blog post with ID 3 and discover its secret password using GraphQL introspection and IDOR techniques.

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Basic understanding of GraphQL
- Burp Suite or similar proxy tool (recommended)

### Setup Instructions

1. **Clone or create the lab files** in a directory with the following structure:

```
graphql-lab/
├── Dockerfile
├── docker-compose.yml
├── package.json
├── server.js
├── README.md
└── public/
    └── index.html
```

2. **Build and run the lab**:

```bash
docker-compose up --build
```

3. **Access the lab**:
   - Web Interface: http://localhost:3000
   - GraphQL Endpoint: http://localhost:3000/graphql/v1

## 🛡️ Vulnerabilities to Discover

### 1. Introspection Enabled

The GraphQL endpoint has introspection enabled, allowing you to query the schema structure.

**Test with**:

```graphql
{
  __schema {
    queryType {
      name
    }
  }
}
```

### 2. Insecure Direct Object Reference (IDOR)

You can access any blog post by ID, even unpublished ones.

**Example query**:

```graphql
query {
  blogPost(id: 3) {
    id
    title
    content
    author
    published
    postPassword
  }
}
```

### 3. Sensitive Data Exposure

The hidden blog post contains a `postPassword` field with sensitive information.

## 🔍 Solution Walkthrough

### Step 1: Identify Missing Blog Post

1. Visit http://localhost:3000
2. Notice that blog posts have sequential IDs (1, 2, 4) but ID 3 is missing
3. This suggests a hidden/unpublished blog post

### Step 2: Use Introspection

1. Send a POST request to `/graphql/v1` with introspection query:

```json
{
  "query": "{ __schema { queryType { name } } }"
}
```

2. Perform full introspection to discover the `BlogPost` schema:

```json
{
  "query": "query IntrospectionQuery { __schema { queryType { name } mutationType { name } types { ...FullType } } } fragment FullType on __Type { kind name description fields(includeDeprecated: true) { name description type { ...TypeRef } } } fragment TypeRef on __Type { kind name ofType { kind name ofType { kind name } } }"
}
```

### Step 3: Discover the postPassword Field

From introspection, you'll discover that `BlogPost` has a `postPassword` field.

### Step 4: Access Hidden Blog Post

Query the hidden blog post directly:

```json
{
  "query": "query { blogPost(id: 3) { id title content author published postPassword } }"
}
```

### Step 5: Submit the Password

1. Extract the password from the `postPassword` field
2. Use the "Submit Password" button on the website
3. Enter the password: `graphql_h4ck3r_2024`
4. Enjoy the success celebration! 🎉

## 🔧 Testing with Burp Suite

1. **Configure Burp Proxy**: Set browser to use Burp as proxy (127.0.0.1:8080)
2. **Intercept Requests**: Browse to the lab and observe GraphQL requests in HTTP History
3. **Send to Repeater**: Right-click GraphQL requests and send to Repeater
4. **Test Introspection**: Modify queries to test introspection capabilities
5. **Exploit IDOR**: Change blog post IDs to access hidden content

## 📝 Learning Objectives

After completing this lab, you will understand:

- How to identify GraphQL endpoints
- The risks of enabled introspection in production
- How to perform GraphQL introspection queries
- Insecure Direct Object Reference (IDOR) vulnerabilities in GraphQL
- How to extract sensitive information from GraphQL responses
- GraphQL security best practices

## 🛠️ Architecture

- **Backend**: Node.js with Express and express-graphql
- **Frontend**: Vanilla HTML/CSS/JavaScript with beautiful UI
- **Database**: In-memory JavaScript objects (for simplicity)
- **Security Features**: Intentionally vulnerable for educational purposes

## 🚨 Security Notes

This lab contains **intentional vulnerabilities** for educational purposes:

1. ✅ Introspection enabled
2. ✅ No access control on blog post queries
3. ✅ Sensitive data exposure in GraphQL schema
4. ✅ CORS enabled for easy testing

**Do not deploy this in production!**

## 🎨 Features

- **Beautiful UI**: Modern, responsive design with animations
- **Interactive Modals**: Engaging success/error feedback
- **Real-time Validation**: Immediate password verification
- **Educational**: Clear hints and learning objectives
- **Burp-Friendly**: Easy to test with security tools

## 🛑 Stopping the Lab

```bash
docker-compose down
```

## 📚 Additional Resources

- [GraphQL Security Best Practices](https://graphql.org/learn/security/)
- [PortSwigger GraphQL Vulnerabilities](https://portswigger.net/web-security/graphql)
- [OWASP GraphQL Security](https://owasp.org/www-project-graphql-security/)

## 🤝 Contributing

Feel free to enhance this lab with additional vulnerabilities or improvements!

---

**Happy Hacking! 🎯**
