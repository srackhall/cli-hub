BINARY  = xlsx-extract

TARGETS = darwin-amd64 darwin-arm64 linux-amd64 linux-arm64 windows-amd64 windows-arm64

# make build — compile for current platform, output to current directory
.PHONY: build
build:
	go build -o $(BINARY) .

# make build-all — cross-compile all 6 platforms to bin/<os>-<arch>/
.PHONY: build-all
build-all:
	@for t in $(TARGETS); do \
		os=$$(echo $$t | cut -d- -f1); \
		arch=$$(echo $$t | cut -d- -f2); \
		out="bin/$$t/$(BINARY)"; \
		[ "$$os" = "windows" ] && out="$$out.exe"; \
		echo "→ $$t"; \
		GOOS=$$os GOARCH=$$arch CGO_ENABLED=0 go build -o "$$out" . ; \
	done

# make clean — remove bin/ and local binary
.PHONY: clean
clean:
	rm -rf bin $(BINARY)
