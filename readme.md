# Blog API

A full-featured blogging engine built with Node.js, Express, GraphQL, and REST. This project was developed to fulfill a backend developer exercise, focusing on implementing both REST and GraphQL APIs for a single-user blogging platform. Since this was my first time working with GraphQL, Prisma and Swagger, this has also served as a valuable learning experience for me.

## Features

- **Authentication**: Users can register and log in using a simple password-based system.
- **Blog Posts**: CRUD operations for blog posts, including title, content, perex (summary), author, and timestamp.
- **Comments**: Users can add comments to blog posts.
- **Voting System**: Reddit-style upvote and downvote system for comments, with votes tracked by IP address.
- **Real-time Updates**: Implemented using GraphQL Subscriptions for real-time commenting and voting.
- **API Documentation**:
  - REST API documented with Swagger.
  - GraphQL API documented with inline schema comments.
- **Dockerized**: Dockerfile and Docker Compose configurations for easy setup.
- **Testing**: Comprehensive testing with Jest, with focus on unit tests.
- **Linting and Formatting**: Code linted with ESLint and formatted with Prettier.

## Technologies Used

- **Backend**: Node.js, Express
- **Database**: PostgreSQL (with Prisma ORM)
- **API**: GraphQL (Apollo Server), REST (Express)
- **Real-time**: GraphQL Subscriptions
- **Documentation**: Swagger (REST), GraphQL schema comments (GraphQL)
- **Testing**: Jest, Supertest
- **Other Tools**: Docker, Docker Compose, ESLint, Prettier

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en/)
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)
- [PostgreSQL](https://www.postgresql.org/) (optional if running outside Docker)

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/johnjohncode/blog-api.git
   cd blog-api
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory and configure your environment variables as needed. Example:
   ```env
   JWT_SECRET=your_jwt_secret
   POSTGRES_USER=myuser
   POSTGRES_PASSWORD=mypassword
   POSTGRES_DB=mydb
   DATABASE_URL=postgres://myuser:mypassword@db:5432/mydb
   ```

### Running the Application

#### Using Docker

1. **Build and start the containers**:

   ```bash
   docker-compose up --build
   ```

2. The app will be available at `http://localhost:3000`.

#### Without Docker

1. **Start PostgreSQL** and ensure it matches your `.env` configuration.

2. **Run the app**:

   ```bash
   npm run dev
   ```

3. The app will be available at `http://localhost:3000`.

### API Documentation

- **REST API**: Accessible via Swagger UI at `http://localhost:3000/api-docs`.
- **GraphQL Playground**: Available at `http://localhost:3000/graphql`.

### Usage

- **Register/Login**: Use the `/api/users/register` and `/api/users/login` endpoints for user registration and authentication.
- **CRUD Operations**:
  - **Posts**: Manage posts using the `/api/posts` REST endpoints or corresponding GraphQL queries/mutations.
  - **Comments**: Add, update, and delete comments using the `/api/comments` REST endpoints or GraphQL mutations.
- **Voting**: Upvote or downvote comments using the `/api/comments/{id}/vote` REST endpoint or GraphQL mutations.

### Testing

To run tests, use the following command:

```bash
npm test
```

### Linting and Formatting

To lint and format the code, use:

```bash
npm run lint:fix
npm run format
```

## License

This project is open-source and available under the [MIT License](LICENSE).

## Acknowledgments

- This project was developed as a technical exercise for [Applifting](https://github.com/Applifting/culture) per provided requirements.
- Special thanks to the creators of Node.js, Prisma, Apollo, Docker, and all other libraries used in this project.
