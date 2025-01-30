FROM golang:1.23

WORKDIR /app

COPY go.mod go.sum ./

# Set APP_ENV to docker (to auto-select .env.docker in the code)
ENV APP_ENV=docker

RUN go mod download

COPY . .

ENTRYPOINT ["go", "run", "."]
