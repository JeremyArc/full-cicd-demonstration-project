FROM node:18-alpine

# Set working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json into WORKDIR
COPY ../package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of application code
COPY . .

# Expose port 8080
EXPOSE 8080

# Command to run container
CMD ["node", "app.js"]