# Stage 1: Install dependencies
FROM node:18-alpine AS base

WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install --only=production

# Stage 2: Build Stage
FROM base AS build

# Install development dependencies
RUN npm install --only=dev

# Copy the entire project
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Compile TypeScript to JavaScript
RUN npm run build

# Stage 3: Production image
FROM node:18-alpine AS production

WORKDIR /usr/src/app

# Copy the necessary files from the build stage
COPY --from=build /usr/src/app/package*.json ./
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules/.prisma ./node_modules/.prisma

# Install only production dependencies
RUN npm install --only=production

# Run the application
CMD ["node", "dist/index.js"]

# Expose the port
EXPOSE 3000
