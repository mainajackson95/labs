const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const cors = require('cors');
const path = require('path');

const app = express();

// Enable CORS
app.use(cors());

// Serve static files
app.use(express.static('public'));

// Sample blog post data
const blogPosts = [
  {
    id: 1,
    title: "Getting Started with GraphQL",
    content: "GraphQL is a powerful query language for APIs that provides a complete and understandable description of the data in your API.",
    author: "John Doe",
    published: true,
    postPassword: null
  },
  {
    id: 2,
    title: "Advanced GraphQL Techniques",
    content: "Learn about advanced GraphQL concepts including subscriptions, fragments, and schema stitching.",
    author: "Jane Smith", 
    published: true,
    postPassword: null
  },
  {
    id: 3,
    title: "Secret GraphQL Post",
    content: "This is a hidden blog post that contains sensitive information about our GraphQL implementation. Only authorized users should access this content.",
    author: "Admin",
    published: false,
    postPassword: "graphql_h4ck3r_2024"
  },
  {
    id: 4,
    title: "GraphQL Best Practices",
    content: "Discover the best practices for implementing secure and efficient GraphQL APIs in production environments.",
    author: "Bob Johnson",
    published: true,
    postPassword: null
  }
];

// GraphQL Schema
const schema = buildSchema(`
  type BlogPost {
    id: Int!
    title: String!
    content: String!
    author: String!
    published: Boolean!
    postPassword: String
  }

  type Query {
    blogPosts: [BlogPost!]!
    blogPost(id: Int!): BlogPost
  }

  type Mutation {
    createBlogPost(title: String!, content: String!, author: String!): BlogPost
  }
`);

// Root resolver
const root = {
  blogPosts: () => {
    // Only return published blog posts for the main query
    return blogPosts.filter(post => post.published);
  },
  blogPost: ({ id }) => {
    // This allows access to any blog post by ID, including unpublished ones
    // This is the vulnerability - IDOR (Insecure Direct Object Reference)
    return blogPosts.find(post => post.id === id);
  },
  createBlogPost: ({ title, content, author }) => {
    const newPost = {
      id: blogPosts.length + 1,
      title,
      content,
      author,
      published: true,
      postPassword: null
    };
    blogPosts.push(newPost);
    return newPost;
  }
};

// GraphQL endpoint with introspection enabled (vulnerability)
app.use('/graphql/v1', graphqlHTTP({
  schema: schema,
  rootValue: root,
  introspection: true, // This should be disabled in production
  graphiql: false // Disable GraphiQL in production
}));

// API endpoint to verify password
app.use(express.json());
app.post('/api/verify-password', (req, res) => {
  const { password } = req.body;
  const correctPassword = "graphql_h4ck3r_2024";
  
  if (password === correctPassword) {
    res.json({ success: true, message: "Congratulations! You have successfully solved the lab!" });
  } else {
    res.json({ success: false, message: "Incorrect password. Try again!" });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`GraphQL Security Lab running on http://localhost:${PORT}`);
  console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql/v1`);
});