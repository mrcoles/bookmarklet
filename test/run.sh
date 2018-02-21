#!/usr/bin/env bash

set -e

echo "Run bookmarklet"
./bin/bookmarklet test/test.bookmarklet.js test/actual.js
echo "...done"
echo ""

echo "Check for changes (should output none)"
diff test/expected.js test/actual.js
echo "...done"
echo ""

