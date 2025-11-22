#!/bin/bash
# Test the /api/import endpoint

# This is a minimal OPML file to test
cat > /tmp/test.opml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Test</title>
  </head>
  <body>
    <outline text="Tech" title="Tech">
      <outline type="rss" text="Feed1" xmlUrl="http://example.com/feed1"/>
    </outline>
  </body>
</opml>
EOF

# Get OPML content
OPML_DATA=$(cat /tmp/test.opml | jq -Rs .)

# Create POST body
POST_BODY=$(jq -n --arg xml "$OPML_DATA" '{xmlData: $xml}')

echo "POST Body:"
echo $POST_BODY | jq .

# Make request
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=s:i9-701YvcVZ26Uq5jwJwmnrz9aT2JnhW.PoxWMD99meoKb6wiu3qFly/Zxmh9at+eYmC1NZXWKmg" \
  -d "$POST_BODY" \
  http://localhost:3000/api/import

echo ""
