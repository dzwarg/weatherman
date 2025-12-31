# Research: Automated Build and Test Workflows

**Feature**: 003-automated-build-test
**Date**: 2025-12-30
**Status**: Complete

## Research Questions

This document consolidates research findings for implementing automated build, test, and deployment workflows using GitHub Actions with blue-green deployment.

---

## 1. GitHub Actions Workflow Patterns for Monorepo CI/CD

### Decision
Use separate workflow files for different triggers (push, pull_request, merge to main) with job-level parallelization and dependency caching.

### Rationale
- **Separation of Concerns**: Different workflows for CI (feature branches), PR gates, and deployments makes each workflow focused and maintainable
- **Parallel Execution**: GitHub Actions supports concurrent jobs within a workflow and concurrent workflows across branches
- **Cache Efficiency**: Built-in cache action supports npm dependencies with automatic key generation based on lock files
- **Monorepo Support**: Path filters (`paths:` in workflow triggers) allow selective execution based on changed packages

### Alternatives Considered
1. **Single Monolithic Workflow**: Rejected because it would be harder to maintain, debug, and would run unnecessary steps
2. **Per-Package Workflows**: Rejected because it creates too many workflow files and doesn't handle cross-package dependencies well
3. **External CI Tool (CircleCI, Jenkins)**: Rejected because requirement specifies GitHub Actions

### Implementation Pattern
```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches-ignore: [main]
jobs:
  lint:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  test-frontend:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm test --workspace=packages/frontend -- --coverage
      - uses: actions/upload-artifact@v4
        with:
          name: frontend-coverage
          path: packages/frontend/coverage/

  test-backend:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm test --workspace=packages/backend -- --coverage
      - uses: actions/upload-artifact@v4
        with:
          name: backend-coverage
          path: packages/backend/coverage/
```

---

## 2. Code Coverage Enforcement (80% Threshold)

### Decision
Use Vitest's built-in coverage threshold configuration with c8 coverage reporter, enforced at both PR check and merge gate levels.

### Rationale
- **Native Integration**: Vitest has built-in support for coverage thresholds via configuration
- **c8 (V8 Coverage)**: Modern coverage tool using V8's native coverage, faster than istanbul
- **Fail-Fast**: Coverage check fails immediately if threshold not met, no manual review needed
- **Detailed Reports**: Coverage reports can be uploaded as artifacts for developer review

### Alternatives Considered
1. **Istanbul/nyc**: Rejected because c8 is faster and more accurate for modern JavaScript
2. **Codecov/Coveralls**: Rejected because adds external dependency; GitHub Actions can display coverage in PR comments
3. **Manual Coverage Review**: Rejected because it's error-prone and slows down PR reviews

### Implementation Pattern
```javascript
// vitest.config.js
export default defineConfig({
  test: {
    coverage: {
      provider: 'c8',
      reporter: ['text', 'html', 'json-summary'],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.js',
        '**/dist/',
      ]
    }
  }
});
```

```yaml
# .github/workflows/pr-quality-gate.yml (excerpt)
- name: Check coverage threshold
  run: |
    npm test --workspace=packages/frontend -- --coverage --run
    npm test --workspace=packages/backend -- --coverage --run
    # Vitest will exit with code 1 if coverage < 80%
```

---

## 3. PM2 Blue-Green Deployment with Zero Downtime

### Decision
Use PM2 cluster mode with two separate PM2 ecosystems (blue.config.js, green.config.js) and nginx upstream switching for traffic routing.

### Rationale
- **Zero Downtime**: PM2 cluster mode performs graceful reloads, handling in-flight requests before switching
- **Process Management**: PM2 automatically restarts failed processes, logs management, and monitoring
- **Dual Ecosystem**: Separate configs for Blue/Green allow independent deployment and rollback
- **Health Checks**: PM2 can wait for health check endpoints before marking deployment successful

### Alternatives Considered
1. **Docker Containers with Load Balancer**: Rejected because requires containerization infrastructure not specified in requirements
2. **Manual Process Management**: Rejected because PM2 provides battle-tested process management
3. **HAProxy for Blue-Green**: Considered but nginx is more commonly available and simpler for static + API serving

### Implementation Pattern
```javascript
// pm2.blue.config.js
module.exports = {
  apps: [{
    name: 'weatherman-blue',
    script: './packages/backend/dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      ENV_NAME: 'blue'
    },
    wait_ready: true,
    listen_timeout: 10000,
    kill_timeout: 5000
  }]
};

// pm2.green.config.js
module.exports = {
  apps: [{
    name: 'weatherman-green',
    script: './packages/backend/dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3002,
      ENV_NAME: 'green'
    },
    wait_ready: true,
    listen_timeout: 10000,
    kill_timeout: 5000
  }]
};
```

```bash
# scripts/deployment/deploy-to-green.sh (excerpt)
#!/bin/bash
set -e

# Stop existing green if running
pm2 delete weatherman-green || true

# Pull latest code
git fetch origin main
git checkout main
git pull origin main

# Build
npm ci
npm run build

# Start green with new code
pm2 start pm2.green.config.js

# Wait for health check
timeout 30s bash -c 'until curl -f http://localhost:3002/health; do sleep 1; done'

echo "Green environment deployed successfully on port 3002"
```

```nginx
# /etc/nginx/sites-available/weatherman (excerpt)
upstream backend {
    server localhost:3001;  # Blue (active)
    # server localhost:3002;  # Green (inactive, uncommented after successful deploy)
}

server {
    listen 80;
    server_name weatherman.example.com;

    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        root /var/www/weatherman/frontend/dist;
        try_files $uri /index.html;
    }
}
```

---

## 4. GitHub Self-Hosted Runner Setup for Production Deployment

### Decision
Install GitHub Actions self-hosted runner as a systemd service on the production server with restricted permissions and dedicated deployment user.

### Rationale
- **Security**: Runner runs as dedicated user with minimal permissions, uses PAT with repo-only scope
- **Reliability**: Systemd ensures runner auto-starts on reboot and restarts on failure
- **Simplicity**: GitHub provides official runner binaries and clear setup instructions
- **Auditability**: All deployment actions logged in GitHub Actions UI with full traceability

### Alternatives Considered
1. **SSH from GitHub-Hosted Runner**: Rejected due to security concerns (storing SSH keys in secrets, managing known_hosts)
2. **Third-Party Deployment Tool (Ansible, Capistrano)**: Rejected because adds complexity when GitHub Actions can handle it
3. **Multiple Self-Hosted Runners**: Deferred until scale requires it; single runner sufficient initially

### Implementation Pattern
```bash
# Setup on production server
sudo useradd -m -s /bin/bash github-runner
sudo su - github-runner

# Download and configure runner (using PAT from GitHub repo settings)
mkdir actions-runner && cd actions-runner
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz
./config.sh --url https://github.com/yourorg/weatherman --token <TOKEN> --labels self-hosted,production

# Install as systemd service
sudo ./svc.sh install github-runner
sudo ./svc.sh start
```

```yaml
# .github/workflows/deploy-production.yml (excerpt)
jobs:
  deploy:
    runs-on: [self-hosted, production]
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
        with:
          ref: main
      - name: Deploy to Green
        run: bash scripts/deployment/deploy-to-green.sh
      - name: Run post-deployment tests
        run: bash scripts/testing/run-post-deployment-tests.sh
```

---

## 5. Post-Deployment Testing Strategy

### Decision
Three-tier post-deployment test suite: smoke tests (30s), integration tests (5min), performance tests (9min) with early exit on failure.

### Rationale
- **Fast Feedback**: Smoke tests catch obvious failures quickly before expensive tests
- **Comprehensive Coverage**: Integration tests validate cross-service communication
- **Performance Regression Detection**: Performance tests compare Green vs Blue with 20% threshold
- **Within Timeout**: Total test suite completes in ~14 minutes, under 15-minute requirement

### Alternatives Considered
1. **Single Monolithic Test Suite**: Rejected because slow failures waste time
2. **Production Traffic Shadow Testing**: Deferred to future optimization; initial implementation uses synthetic tests
3. **Canary Deployment**: Rejected because requirement specifies full blue-green, not gradual rollout

### Implementation Pattern
```bash
# scripts/testing/run-post-deployment-tests.sh
#!/bin/bash
set -e

GREEN_URL="http://localhost:3002"

echo "=== Running Smoke Tests (30s) ==="
timeout 30s bash scripts/testing/smoke-tests.sh "$GREEN_URL"

echo "=== Running Integration Tests (5min) ==="
timeout 300s npm run test:integration --workspace=packages/backend -- --baseUrl="$GREEN_URL"
timeout 300s npm run test:e2e --workspace=packages/frontend -- --baseUrl="$GREEN_URL"

echo "=== Running Performance Tests (9min) ==="
bash scripts/testing/performance-baseline.sh "http://localhost:3001" > /tmp/blue-perf.json
bash scripts/testing/performance-baseline.sh "$GREEN_URL" > /tmp/green-perf.json
bash scripts/testing/compare-performance.sh /tmp/blue-perf.json /tmp/green-perf.json

echo "✅ All post-deployment tests passed"
```

```javascript
// scripts/testing/compare-performance.sh (excerpt)
#!/bin/bash
THRESHOLD=20  # 20% regression threshold

BLUE_TIME=$(jq '.responseTime' $1)
GREEN_TIME=$(jq '.responseTime' $2)

REGRESSION=$(echo "scale=2; (($GREEN_TIME - $BLUE_TIME) / $BLUE_TIME) * 100" | bc)

if (( $(echo "$REGRESSION > $THRESHOLD" | bc -l) )); then
  echo "❌ Performance regression: ${REGRESSION}% (threshold: ${THRESHOLD}%)"
  exit 1
fi

echo "✅ Performance check passed: ${REGRESSION}% change"
```

---

## 6. Concurrency Control (Block Merges During Deployment)

### Decision
Use GitHub Environments with `required_reviewers` set to empty and `wait_timer: 0` to create deployment locks, combined with workflow concurrency groups.

### Rationale
- **Native GitHub Feature**: Environments provide built-in deployment protection rules
- **Atomic Lock**: Only one deployment can be in progress per environment
- **PR Blocking**: Can use required status checks to prevent merge when deployment environment is locked
- **Visibility**: GitHub UI shows deployment status clearly

### Alternatives Considered
1. **External Lock Service (Redis, DynamoDB)**: Rejected because adds infrastructure dependency
2. **File-Based Locks on Server**: Rejected because doesn't integrate with GitHub PR checks
3. **Manual Coordination**: Rejected because error-prone

### Implementation Pattern
```yaml
# .github/workflows/deploy-production.yml
name: Deploy Production
on:
  push:
    branches: [main]

concurrency:
  group: production-deployment
  cancel-in-progress: false  # Don't cancel, queue instead

jobs:
  deploy:
    runs-on: [self-hosted, production]
    environment:
      name: production
      url: https://weatherman.example.com
    steps:
      # deployment steps
```

```yaml
# .github/workflows/pr-quality-gate.yml
name: PR Quality Gate
on:
  pull_request:
    branches: [main]

jobs:
  check-deployment-status:
    runs-on: ubuntu-latest
    steps:
      - name: Check if deployment in progress
        uses: actions/github-script@v7
        with:
          script: |
            const deployments = await github.rest.repos.listDeployments({
              owner: context.repo.owner,
              repo: context.repo.repo,
              environment: 'production',
              per_page: 1
            });

            if (deployments.data.length > 0) {
              const latest = deployments.data[0];
              const statuses = await github.rest.repos.listDeploymentStatuses({
                owner: context.repo.owner,
                repo: context.repo.repo,
                deployment_id: latest.id,
                per_page: 1
              });

              if (statuses.data[0]?.state === 'in_progress') {
                core.setFailed('❌ Deployment in progress. Wait for completion before merging.');
              }
            }
```

---

## 7. Workflow Status Badges and Historical Trends

### Decision
Use GitHub Actions badge URLs in README.md and GitHub Actions Artifacts API to store historical test/coverage data for trend analysis.

### Rationale
- **Built-in Badges**: GitHub provides workflow status badges automatically
- **No External Service**: Artifacts API provides storage for historical data without external dependency
- **Simple Visualization**: Can generate static HTML reports from artifact data

### Alternatives Considered
1. **External Monitoring (Datadog, Prometheus)**: Deferred; artifacts sufficient for initial implementation
2. **Custom Badge Service**: Rejected because GitHub's built-in badges are sufficient
3. **No Historical Tracking**: Rejected because spec requires tracking trends (FR-015)

### Implementation Pattern
```markdown
<!-- README.md -->
# Weatherman

![CI Status](https://github.com/yourorg/weatherman/actions/workflows/ci.yml/badge.svg)
![Coverage](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/user/id/raw/coverage.json)
```

```yaml
# .github/workflows/ci.yml (excerpt)
- name: Store coverage trend data
  run: |
    DATE=$(date +%Y-%m-%d)
    COVERAGE=$(jq '.total.lines.pct' coverage/coverage-summary.json)
    echo "{\"date\":\"$DATE\",\"coverage\":$COVERAGE}" >> coverage-history.json

- uses: actions/upload-artifact@v4
  with:
    name: coverage-history-${{ github.run_number }}
    path: coverage-history.json
    retention-days: 90
```

---

## Summary

All research questions have been resolved with concrete technical decisions:

1. ✅ **GitHub Actions Patterns**: Separate workflows with job parallelization
2. ✅ **Coverage Enforcement**: Vitest + c8 with 80% threshold in config
3. ✅ **Blue-Green Deployment**: PM2 cluster mode with nginx switching
4. ✅ **Self-Hosted Runner**: Systemd service with dedicated user
5. ✅ **Post-Deployment Tests**: Three-tier suite (smoke, integration, performance)
6. ✅ **Concurrency Control**: GitHub Environments with deployment locks
7. ✅ **Badges & Trends**: Built-in badges + Artifacts API for history

**Next Step**: Proceed to Phase 1 - Design (data-model.md, contracts/, quickstart.md)
