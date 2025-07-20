# Use official Node.js LTS image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy all files
COPY . .

# Build Next.js app
RUN npm run build

# Expose port (Next.js default)
EXPOSE 3000

# Run the Next.js production server
CMD ["npm", "start"]
