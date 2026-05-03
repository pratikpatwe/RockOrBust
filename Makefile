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
	cd apps/cli && go build -o ../../bin/rockorbust .

# Builds CLI binaries for all major platforms
release-cli:
	mkdir -p bin/release
	# Windows
	cd apps/cli && GOOS=windows GOARCH=amd64 go build -o ../../bin/release/rockorbust-windows-amd64.exe .
	cd apps/cli && GOOS=windows GOARCH=arm64 go build -o ../../bin/release/rockorbust-windows-arm64.exe .
	# Linux
	cd apps/cli && GOOS=linux GOARCH=amd64 go build -o ../../bin/release/rockorbust-linux-amd64 .
	cd apps/cli && GOOS=linux GOARCH=arm64 go build -o ../../bin/release/rockorbust-linux-arm64 .
	# macOS (Intel)
	cd apps/cli && GOOS=darwin GOARCH=amd64 go build -o ../../bin/release/rockorbust-darwin-amd64 .
	# macOS (Apple Silicon)
	cd apps/cli && GOOS=darwin GOARCH=arm64 go build -o ../../bin/release/rockorbust-darwin-arm64 .

clean:
	rm -rf bin
	rm -rf packages/playwright-plugin/dist
	rm -rf apps/gateway/dist
