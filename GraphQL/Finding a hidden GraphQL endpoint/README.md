Lab: Finding a Hidden GraphQL Endpoint

Objective:

- Find the hidden GraphQL endpoint
- Bypass introspection defenses
- Delete the user 'carlos'

Steps:

1. Discover the hidden endpoint by probing common paths
2. When you find the endpoint, note it responds to GET requests
3. Bypass introspection blocking by inserting a newline after \_\_schema
4. Explore the schema to find the user deletion mutation
5. Delete carlos (ID: 3) using the mutation

Verification:
Visit http://localhost:3000 after completing the lab
