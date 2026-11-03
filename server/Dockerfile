FROM golang:1.27.3-alpine3.24 AS base
WORKDIR /app
COPY go.mod .
RUN go mod download
COPY . .

FROM base AS dev
CMD ["go", "run", "cmd/server/main.go"]

