# Set the name of the output binary
BINARY_NAME := app.wasm

# Set the Go compiler
GO_COMPILER := go

# Set the build flags for WebAssembly
GO_BUILD_FLAGS := GOOS=js GOARCH=wasm

# Set the Go build command
GO_BUILD_CMD := $(GO_BUILD_FLAGS) $(GO_COMPILER) build -o $(PWD)/public/$(BINARY_NAME)

# Default target
all: build

# Build the WebAssembly binary
build:
	$(GO_BUILD_CMD)

# Clean the build artifacts
clean:
	rm -f $(PWD)/public/$(BINARY_NAME)

.PHONY: install-tools
install-tools:
	go install github.com/cosmtrek/air@latest

.PHONY: devserver
devserver: install-tools
	go run $(CURDIR)/devserver & air -c .air.toml