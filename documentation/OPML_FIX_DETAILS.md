# OPML Import Fix - What Changed

## The Key Change: Support OPML WITHOUT type="folder"

### Before (Broken)
The parser **only** recognized folders with explicit `type="folder"` attribute:
```javascript
const isFolderTag = /type\s*=\s*["']folder["']/i.test(openTag);
if (isFolderTag) {
  // Process as folder
}
```

**Problem:** Real Feedly exports don't have `type="folder"` - they just have nested outlines:
```xml
<!-- Real Feedly (BROKEN) - has nested feeds but NO type attribute -->
<outline text="Scrum and Planning">
  <outline text="DZone" xmlUrl="..." />
</outline>
```
This structure was treated as a **feed** instead of a **folder**, losing the category!

### After (Fixed)
The parser now **auto-detects folders** by checking for nested `<outline>` tags:
```javascript
const hasNestedOutline = /<outline\s/.test(content);
const isFeedTag = /type\s*=\s*["']rss["']/i.test(openTag);

if (isFeedTag) {
  // Explicit RSS feed
} else if (hasNestedOutline) {
  // HAS NESTED CONTENT = IT'S A FOLDER, regardless of type attribute
  const folderName = extractFolderName(openTag);
  processOutlines(content, folderName); // Pass folder name as category
} else if (!isFeedTag) {
  // No nested content, no type - check if it's a feed (has xmlUrl)
}
```

## Why This Works

### Logic Flow
1. **Self-closing tags** (`/>`) → Always feeds (can't have children)
2. **Has `type="rss"`** → Always feeds (explicit RSS type)
3. **Has nested `<outline>` tags** → Always folders (has children)
4. **No type attribute but has URL** → Feed without category
5. **No type, no URL, no nesting** → Ignore

### Example: Real Feedly Structure
```xml
<outline text="Scrum and Planning">                    ← Detected as FOLDER (has nested outlines)
  <outline text="DZone" xmlUrl="..." />               ← Feed with category="Scrum and Planning"
  <outline text="Mike Cohn Blog" xmlUrl="..." />      ← Feed with category="Scrum and Planning"
</outline>
<outline text="Entertainment">                         ← Detected as FOLDER (has nested outlines)
  <outline text="YouTube Channel 1" xmlUrl="..." />   ← Feed with category="Entertainment"
</outline>
<outline text="Standalone Feed" xmlUrl="..." />       ← Standalone feed (no parent folder)
```

**Result:** ✅ All categories preserved correctly!

## Additional Fixes

### 1. Flexible Attribute Matching
```javascript
// Now handles any order and quote style
const urlMatch = openTag.match(/xmlUrl\s*=\s*["']([^"']*?)["']/i);
const textMatch = openTag.match(/(?:text|title)\s*=\s*["']([^"']*?)["']/i);
```

### 2. Correct Nesting Level Tracking
```javascript
// Only count non-self-closing tags for nesting
const openTagEndMatch = xml.substring(nextOpen).match(/^\<outline[^>]*>/);
if (openTagEndMatch && !openTagEndMatch[0].endsWith('/>')) {
  nestLevel++;
}
```

## Testing

Both formats now work:
- ✅ `<outline type="folder">` (test files, some exporters)
- ✅ `<outline>` without type (real Feedly, Pocket)

```
Format WITH type="folder":    6 feeds ✅
Format WITHOUT type="folder": 4 feeds ✅
```

## Code Location
**File:** `rss-reader-app/backend/src/controllers/ImportExportController.js`  
**Method:** `parseOPML()` (lines 250-400)  
**Key section:** Lines 330-395 (folder detection logic)
