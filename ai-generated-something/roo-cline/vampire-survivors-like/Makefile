.PHONY: build serve clean

build:
	GOOS=js GOARCH=wasm go build -o public/main.wasm

serve: build
	go run -v cmd/server/main.go

clean:
	rm -f public/main.wasm