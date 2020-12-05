ARG GO_VERSION=1.15.5

FROM golang:${GO_VERSION}-buster AS builder

RUN apt update && apt install postgresql -y

RUN mkdir -p /src
WORKDIR /src

COPY . .

