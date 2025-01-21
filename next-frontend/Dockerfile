# Use Node.js base image
FROM node:18

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the app code
COPY . .

# Build the frontend
RUN npm run build

# Expose port
EXPOSE 3000

# Start Next.js app
CMD ["npm", "run", "start"]
