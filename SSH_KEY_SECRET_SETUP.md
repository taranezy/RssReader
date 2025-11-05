# ⚠️ SSH Key Secret Setup - IMPORTANT

## The Problem

Your SSH private key secret is not being formatted correctly. This causes the SSH authentication to fail.

## ✅ The Solution

### Step 1: Get your SSH private key content properly

Open PowerShell and run:
```powershell
Get-Content "$env:USERPROFILE\.ssh\github-actions" -Raw
```

This will output your ENTIRE private key with proper newlines preserved.

### Step 2: Copy the ENTIRE output

Select and copy everything from:
```
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

**IMPORTANT:** Include the BEGIN and END lines!

### Step 3: Add it to GitHub Secrets CORRECTLY

1. Go to: **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Name: `SSH_PRIVATE_KEY`
4. Paste the entire key you copied (with BEGIN/END lines)
5. Click **Add secret**

### Step 4: Verify it's correct

Run the workflow again. It should now connect properly!

## 🔍 How to Debug

If it still fails, check the workflow logs for:
- File size of `~/.ssh/id_rsa` (should be several KB, not empty)
- First line should be: `-----BEGIN OPENSSH PRIVATE KEY-----`

## ✅ Correct Format Example

Your secret should look like:
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAACFwAAAAdzc2gt
... many lines of base64 ...
nqJIXXb3aI4AAAAg... (more content)
-----END OPENSSH PRIVATE KEY-----
```

**NOT like this:**
```
-----BEGIN OPENSSH PRIVATE KEY-----\n
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAACFwAAAAdzc2gt\n
... (with literal \n instead of actual newlines)
```

## 🚀 Quick Steps

1. Copy: `Get-Content "$env:USERPROFILE\.ssh\github-actions" -Raw`
2. Go to GitHub Secrets
3. Paste the content
4. Save
5. Done!

---

*The issue: Literal `\n` characters instead of actual line breaks in the secret.*
