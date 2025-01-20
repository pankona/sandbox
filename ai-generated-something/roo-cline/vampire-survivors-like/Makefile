.PHONY: build serve clean wasm

build:
	GOOS=js GOARCH=wasm go build -o public/main.wasm

serve: build
	go run -v cmd/server/main.go

wasm:
	GOOS=js GOARCH=wasm go build -o public/main.wasm
	cp "$$(go env GOROOT)/misc/wasm/wasm_exec.js" public/

clean:
	rm -f public/main.wasm
	rm -f public/wasm_exec.js