# Quickstart Guide: Automated Build and Test Workflows

**Feature**: 003-automated-build-test
**Audience**: Developers, DevOps Engineers
**Date**: 2025-12-30

## Overview

This guide provides step-by-step instructions to set up and use the automated build, test, and deployment workflows for the Weatherman project.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [CI Workflow Usage](#ci-workflow-usage)
4. [Pull Request Process](#pull-request-process)
5. [Production Deployment Setup](#production-deployment-setup)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

- **Git** 2.30+
- **Node.js** 22+
- **npm** 10+ (included with Node.js 22)
- **GPG** for commit signing
- **GitHub Account** with repository access

### Required Configuration

1. **GPG Signing Setup**:
   ```bash
   # Generate GPG key
   gpg --full-generate-key

   # List keys and copy the key ID
   gpg --list-secret-keys --keyid-format=long

   # Configure Git to use GPG
   git config --global user.signingkey <YOUR_KEY_ID>
   git config --global commit.gpgsign true

   # Add GPG key to GitHub account
   gpg --armor --export <YOUR_KEY_ID>
   # Paste into GitHub Settings → SSH and GPG keys → New GPG key
   ```

2. **Repository Clone**:
   ```bash
   git clone https://github.com/yourorg/weatherman.git
   cd weatherman
   ```

3. **Dependencies Install**:
   ```bash
   npm install
   ```

---

## Local Development Setup

### 1. Verify Local Tests Pass

Before pushing code, ensure all quality checks pass locally:

```bash
# Run linter
npm run lint

# Run all tests with coverage
npm test

# Run tests for specific package
npm test --workspace=packages/frontend
npm test --workspace=packages/backend

# Build all packages
npm run build
```

### 2. Configure Pre-Commit Hooks (Optional but Recommended)

Install Husky to run quality checks before commits:

```bash
# Install Husky
npm install --save-dev husky

# Initialize Husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm test"
```

---

## CI Workflow Usage

### Feature Branch Development

When you push to a feature branch, the CI workflow automatically runs:

**Workflow**: `.github/workflows/ci.yml`

**Triggered On**: Push to any branch except `main`

**Steps Executed**:
1. ✅ Lint code (ESLint, no console.log check)
2. ✅ Run frontend tests with coverage
3. ✅ Run backend tests with coverage
4. ✅ Build frontend and backend
5. ✅ Check frontend bundle size (< 300KB)
6. ✅ Track coverage trends
7. ✅ Lighthouse PWA score check (≥90/100)
8. ✅ Accessibility tests (axe-core WCAG 2.2 AA)
9. ✅ Upload coverage reports and build artifacts

**Expected Duration**: 8-12 minutes

**Workflow Configuration Example**:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches-ignore:
      - main
  workflow_dispatch:  # Manual triggering

jobs:
  test-frontend:
    name: Test Frontend
    runs-on: ubuntu-latest
    steps:
      - name: Setup Node.js environment
        uses: ./.github/actions/setup-node
        with:
          node-version: '22'

      - name: Run frontend tests with coverage
        uses: ./.github/actions/run-tests-with-coverage
        with:
          workspace: packages/frontend
          package-name: frontend

      - name: Check coverage threshold
        uses: ./.github/actions/check-coverage-threshold
        with:
          coverage-file: packages/frontend/coverage/coverage-summary.json
          threshold: 80
          package-name: frontend
```

**Reusable Actions**:

The CI workflow uses custom reusable actions for consistency:

- **`setup-node`**: Checks out code, sets up Node.js with npm cache, installs dependencies
- **`run-tests-with-coverage`**: Executes tests with coverage and uploads artifacts
- **`check-coverage-threshold`**: Validates coverage meets 80% threshold

### Viewing CI Results

1. **GitHub Actions Tab**: Navigate to `Actions` → `CI` workflow
2. **Commit Status**: Check marks appear next to commits when CI passes
3. **Coverage Reports**: Download from workflow run artifacts

### Example: Push to Feature Branch

```bash
# Create feature branch (following speckit convention)
git checkout -b 003-automated-build-test

# Make changes
# ... edit files ...

# Commit changes (GPG signed, conventional format)
git add .
git commit -m "feat(ci): add GitHub Actions CI workflow"

# Push to remote (triggers CI workflow)
git push origin 003-automated-build-test

# Check CI status
gh run list --branch 003-automated-build-test
```

---

## Pull Request Process

### 1. Create Pull Request

Once CI passes on your feature branch:

```bash
# Create PR using GitHub CLI
gh pr create --base main --head 003-automated-build-test \
  --title "feat(ci): add GitHub Actions CI workflow" \
  --body "Implements automated CI for feature branches per spec 003"

# Or create via GitHub web UI
```

### 2. PR Quality Gate Workflow

**Workflow**: `.github/workflows/pr-quality-gate.yml`

**Triggered On**: Pull request opened/updated targeting `main`

**Quality Checks**:
1. ✅ **Branch Name Validation**: Must match `NNN-description` format
2. ✅ **Deployment Check**: Blocks merge if production deployment is in progress
3. ✅ **All CI Checks**: Reruns lint, test, build from CI workflow
4. ✅ **Commit Validation**: Conventional commit format + GPG signatures
5. ✅ **Aggregate Coverage**: Combined frontend + backend coverage >= 80%
6. 💬 **Coverage Comment**: Posts coverage summary as PR comment

**Expected Duration**: 8-12 minutes

**Workflow Configuration Example**:

```yaml
# .github/workflows/pr-quality-gate.yml
name: PR Quality Gate

on:
  pull_request:
    types: [opened, synchronize, reopened]
    branches:
      - main

jobs:
  validate-branch-name:
    name: Validate Branch Name
    runs-on: ubuntu-latest
    steps:
      - name: Check branch name format
        run: |
          BRANCH_NAME="${{ github.head_ref }}"
          if [[ ! "$BRANCH_NAME" =~ ^[0-9]{3}-.+ ]]; then
            echo "::error::Branch name must match: NNN-description"
            exit 1
          fi

  check-deployment-status:
    name: Check Deployment Status
    runs-on: ubuntu-latest
    steps:
      - name: Check for active deployments
        uses: actions/github-script@v7
        with:
          script: |
            // Check for in_progress deployments
            // Block merge if deployment is active
```

### 3. Review and Merge

- **Required Checks**: All status checks must pass (green checkmarks)
- **Branch Protection**: GitHub branch protection rules enforce these checks
- **Merge Options**: Squash and merge (recommended) or rebase and merge

```bash
# Check PR status
gh pr status

# Merge PR (after approval)
gh pr merge --squash --delete-branch
```

### 4. Blocked Merge Scenarios

If you see "Merge blocked" on your PR, check:

- **Deployment in Progress**: Wait for production deployment to complete (~15-20 min)
- **Coverage Below 80%**: Add more tests to increase coverage
- **Unsigned Commits**: Rebase and re-sign commits
- **Invalid Commit Format**: Rebase and fix commit messages
- **Invalid Branch Name**: Create new branch with correct naming

---

## Production Deployment Setup

### One-Time Setup: Self-Hosted Runner

This setup is performed once by a DevOps engineer on the production server.

**Prerequisites**:
- Ubuntu/Debian Linux server with sudo access
- Node.js 22+ installed system-wide
- PM2 installed globally (`npm install -g pm2`)
- Nginx installed (`sudo apt install nginx`)
- GitHub repository admin access to generate runner token

**Time Required**: 30-45 minutes

#### 1. Create Dedicated User

```bash
# On production server
sudo useradd -m -s /bin/bash github-runner
sudo usermod -aG docker github-runner  # If using Docker
sudo usermod -aG sudo github-runner    # For nginx reload

# Set up passwordless sudo for specific commands
sudo visudo -f /etc/sudoers.d/github-runner
# Add these lines:
# github-runner ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t
# github-runner ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload nginx
# github-runner ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx
# github-runner ALL=(ALL) NOPASSWD: /usr/sbin/service nginx reload
# github-runner ALL=(ALL) NOPASSWD: /usr/bin/pm2 *
```

#### 2. Install GitHub Actions Runner

```bash
# Switch to runner user
sudo su - github-runner

# Download runner
mkdir actions-runner && cd actions-runner
curl -o actions-runner-linux-x64-2.311.0.tar.gz \
  -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# Configure runner (use repo settings → Actions → Runners → New self-hosted runner)
./config.sh \
  --url https://github.com/yourorg/weatherman \
  --token <RUNNER_TOKEN> \
  --labels self-hosted,production \
  --name production-runner

# Install as systemd service
sudo ./svc.sh install github-runner
sudo ./svc.sh start
sudo ./svc.sh status  # Verify running
```

#### 3. Install PM2 Globally

```bash
# On production server
sudo npm install -g pm2
pm2 startup systemd  # Configure PM2 to start on boot
```

#### 4. Setup Nginx for Blue-Green Traffic Routing

Nginx is configured to route traffic to either Blue (port 3101) or Green (port 3102) environment.

**Initial Configuration**:

```bash
# Create nginx config
sudo nano /etc/nginx/sites-available/weatherman
```

**Complete Nginx Configuration** (`/etc/nginx/sites-available/weatherman`):

```nginx
# Weatherman Blue-Green Deployment Configuration
# Blue: port 3101 | Green: port 3102

# Upstream backend - modify this line to switch traffic
# Initially points to Blue (3101)
upstream backend {
    server localhost:3101;  # Blue (initial active)
    # server localhost:3102;  # Green (switch by commenting/uncommenting)
}

server {
    listen 80;
    server_name weatherman.zwarg.com;

    # API proxy to backend (Blue or Green)
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint (direct, no proxy)
    location /health {
        proxy_pass http://backend/health;
        access_log off;
    }

    # Frontend static files
    location / {
        root /home/github-runner/weatherman/packages/frontend/dist;
        try_files $uri /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/json application/javascript;
}
```

**Enable Site**:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/weatherman /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Verify status
sudo systemctl status nginx
curl http://localhost/health
```

**Traffic Switching Mechanism**:

The deployment workflow uses `scripts/deployment/switch-traffic.sh` to automatically update the nginx upstream configuration:

```bash
#!/bin/bash
# scripts/deployment/switch-traffic.sh
# Switches nginx upstream to specified port (Blue: 3101, Green: 3102)

PORT=$1
CONFIG_FILE="/etc/nginx/sites-available/weatherman"

# Update upstream backend server
sudo sed -i "s/server localhost:[0-9]\+;/server localhost:${PORT};/" $CONFIG_FILE

# Reload nginx
sudo nginx -t && sudo systemctl reload nginx
```

**Manual Traffic Switch**:

```bash
# Switch to Green (port 3102)
sudo bash scripts/deployment/switch-traffic.sh 3102
sudo nginx -t && sudo systemctl reload nginx

# Switch to Blue (port 3101)
sudo bash scripts/deployment/switch-traffic.sh 3101
sudo nginx -t && sudo systemctl reload nginx

# Verify current configuration
grep "server localhost" /etc/nginx/sites-available/weatherman
```

#### 5. Create Deployment State Directory

```bash
# On production server
sudo mkdir -p /var/lib/weatherman/state
sudo chown github-runner:github-runner /var/lib/weatherman/state

# Initialize Blue environment as active
cat > /var/lib/weatherman/state/blue.json <<EOF
{
  "environment_id": "blue",
  "status": "active",
  "traffic_routing_state": "active",
  "port": 3001
}
EOF

# Initialize Green environment as inactive
cat > /var/lib/weatherman/state/green.json <<EOF
{
  "environment_id": "green",
  "status": "inactive",
  "traffic_routing_state": "inactive",
  "port": 3002
}
EOF
```

#### 6. Initial Blue Deployment

```bash
# On production server as github-runner user
cd /home/github-runner
git clone https://github.com/yourorg/weatherman.git
cd weatherman

# Install dependencies and build
npm ci --omit=dev
npm run build

# Start Blue environment
pm2 start pm2.blue.config.js
pm2 save
```

### Automatic Deployment Workflow

**Workflow**: `.github/workflows/deploy-production.yml`

**Triggered On**: Push to `main` branch (after PR merge)

**Runner**: Self-hosted runner on production server

**Deployment Steps**:
1. 🔍 Detect current active environment (Blue or Green)
2. 📦 Deploy new version to inactive environment
3. ✅ Run post-deployment validation tests:
   - Smoke tests (30s)
   - Integration tests (5min)
   - Performance comparison (9min, 20% threshold)
4. 🔄 Switch traffic to new environment (if tests pass)
5. 🚫 Rollback (if tests fail, keep traffic on old environment)

**Expected Duration**: 15-20 minutes

**Zero Downtime**: Traffic remains on active environment throughout deployment

### Viewing Deployment Status

```bash
# Check deployment workflow runs
gh run list --workflow="Deploy Production"

# Watch live deployment
gh run watch <RUN_ID>

# Check deployment status on server
ssh production-server "pm2 status"
ssh production-server "cat /var/lib/weatherman/state/blue.json"
ssh production-server "cat /var/lib/weatherman/state/green.json"
```

### Manual Traffic Switch (Emergency)

If automatic traffic switching fails, manually switch:

```bash
# On production server
sudo bash scripts/deployment/switch-traffic.sh 3002  # Switch to Green
sudo nginx -t && sudo systemctl reload nginx

# Or switch back to Blue
sudo bash scripts/deployment/switch-traffic.sh 3001  # Switch to Blue
sudo nginx -t && sudo systemctl reload nginx
```

---

## Troubleshooting

### CI Workflow Fails

#### Issue: Lint Errors

```bash
# Run locally to see errors
npm run lint

# Auto-fix where possible
npm run lint -- --fix

# Check for console.log
grep -r "console.log" packages/*/src
```

#### Issue: Test Failures

```bash
# Run tests locally with verbose output
npm test -- --reporter=verbose

# Run specific test file
npm test --workspace=packages/frontend WeatherCard.test.jsx

# Update snapshots (if needed)
npm test -- -u
```

#### Issue: Coverage Below 80%

```bash
# Run coverage locally
npm test -- --coverage

# Identify untested files
open packages/frontend/coverage/index.html  # View HTML report

# Add tests for files with low coverage
```

#### Issue: Build Failure

```bash
# Run build locally
npm run build

# Check for TypeScript errors (if using TS)
npx tsc --noEmit

# Clear cache and rebuild
rm -rf node_modules dist packages/*/dist
npm install
npm run build
```

### PR Quality Gate Fails

#### Issue: Branch Name Invalid

```bash
# Rename branch locally
git branch -m NNN-description

# Force push to update remote
git push origin -u NNN-description --force
```

#### Issue: Deployment in Progress

Wait for deployment to complete (check Actions tab) or contact DevOps to cancel stale deployment.

#### Issue: Unsigned Commits

```bash
# Configure GPG signing (see Prerequisites section)
git config commit.gpgsign true

# Rebase and re-sign commits
git rebase --exec 'git commit --amend --no-edit -n -S' main
git push --force
```

### Deployment Workflow Fails

#### Issue: Post-Deployment Tests Fail

Check test logs in GitHub Actions:

```bash
# Download test artifacts
gh run view <RUN_ID> --log

# SSH into server and run tests manually
ssh production-server
cd /home/github-runner/weatherman
bash scripts/testing/run-post-deployment-tests.sh http://localhost:3002
```

#### Issue: Performance Regression > 20%

Review performance metrics:

```bash
# Compare Blue vs Green performance
ssh production-server "cat /tmp/active-perf.json"
ssh production-server "cat /tmp/inactive-perf.json"

# Investigate slow endpoints
# Profile code, optimize queries, check external API latency
```

#### Issue: Traffic Switch Failed

Manual verification and switch:

```bash
# Check nginx config
ssh production-server "sudo nginx -t"

# Verify upstream ports
ssh production-server "curl http://localhost:3001/health"
ssh production-server "curl http://localhost:3002/health"

# Manually switch (see Manual Traffic Switch section above)
```

#### Issue: PM2 Process Crashed

```bash
# SSH into server
ssh production-server

# Check PM2 status
pm2 status

# View logs
pm2 logs weatherman-green --lines 100

# Restart process
pm2 restart weatherman-green

# Check for errors
pm2 describe weatherman-green
```

### Self-Hosted Runner Issues

#### Issue: Runner Offline

```bash
# SSH into server
ssh production-server

# Check runner service status
sudo systemctl status actions.runner.yourorg-weatherman.production-runner.service

# Restart runner
sudo systemctl restart actions.runner.yourorg-weatherman.production-runner.service

# View runner logs
sudo journalctl -u actions.runner.yourorg-weatherman.production-runner.service -f
```

#### Issue: Permission Denied

```bash
# Ensure github-runner user has necessary permissions
sudo usermod -aG docker github-runner
sudo usermod -aG pm2 github-runner

# Check file permissions
ls -la /home/github-runner/weatherman
ls -la /var/lib/weatherman/state
```

---

## Additional Resources

- **GitHub Actions Documentation**: https://docs.github.com/en/actions
- **PM2 Documentation**: https://pm2.keymetrics.io/docs/usage/quick-start/
- **Vitest Documentation**: https://vitest.dev/
- **Conventional Commits**: https://www.conventionalcommits.org/

---

## Support

For issues or questions:
1. Check this quickstart guide
2. Review workflow logs in GitHub Actions tab
3. Contact DevOps team via Slack #devops channel
4. Open issue in GitHub repository with `[CI/CD]` label

---

**Last Updated**: 2025-12-30
**Maintained By**: DevOps Team
