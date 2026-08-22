# Dayflow HRMS API — multi-stage build
FROM golang:1.26-alpine AS build

WORKDIR /app
ENV CGO_ENABLED=0 GOOS=linux

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -trimpath -ldflags="-s -w" -o /out/dayflow-api .

FROM alpine:3.20

RUN addgroup -S dayflow && adduser -S dayflow -G dayflow
RUN apk add --no-cache ca-certificates tzdata wget

COPY --from=build /out/dayflow-api /usr/local/bin/dayflow-api

USER dayflow
EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=4s --start-period=15s --retries=5 \
  CMD wget -qO- http://localhost:8080/health || exit 1

ENTRYPOINT ["dayflow-api"]
