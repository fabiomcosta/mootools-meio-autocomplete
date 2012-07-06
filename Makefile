build:
	@python build.py

test:
	@node Specs/helpers/server.js

setup:
	@npm install express@2.5.11

.PHONY: build setup
