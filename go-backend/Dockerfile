# Use a Go base image
FROM golang:1.23

WORKDIR /app

# Copy go mod files and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy the application code
COPY . .

# Set APP_ENV to docker (to auto-select .env.docker in the code)
ENV APP_ENV=docker

# Build the Go application
RUN go build -o myapp

# Expose port
EXPOSE 8080

# Run the app
CMD ["./myapp"]
