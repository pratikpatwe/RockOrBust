.PHONY: build-gateway build-plugin build-cli build-all

# Master build command
build-all: build-gateway build-plugin build-cli

build-gateway:
	npm run build -w gateway

build-plugin:
	npm run build -w @rockorbust/playwright-plugin

# Builds the CLI for the current OS
build-cli:
	mkdir -p bin
	cd apps/cli && go build -o ../../bin/rockorbust main.go

# Builds CLI binaries for all major platforms
release-cli:
	mkdir -p bin/release
	# Windows
	cd apps/cli && GOOS=windows GOARCH=amd64 go build -o ../../bin/release/rockorbust-windows-amd64.exe main.go
	# Linux
	cd apps/cli && GOOS=linux GOARCH=amd64 go build -o ../../bin/release/rockorbust-linux-amd64 main.go
	# macOS (Intel)
	cd apps/cli && GOOS=darwin GOARCH=amd64 go build -o ../../bin/release/rockorbust-darwin-amd64 main.go
	# macOS (Apple Silicon)
	cd apps/cli && GOOS=darwin GOARCH=arm64 go build -o ../../bin/release/rockorbust-darwin-arm64 main.go

clean:
	rm -rf bin
	rm -rf packages/playwright-plugin/dist
	rm -rf apps/gateway/dist
