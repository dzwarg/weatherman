# Deployment Scripts

Blue-green deployment automation scripts for Weatherman application.

## Architecture Overview

Weatherman uses a blue-green deployment architecture with separate environments:

```
┌─────────────────────────────────────────────────────────────┐
│                         Nginx (Port 80)                      │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Static Files: /var/www/weatherman/{blue|green}/       │ │
│  │ - Frontend React app (index.html, JS, CSS, assets)    │ │
│  │ - Served directly by nginx                            │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ API Proxy: /api/* → http://localhost:{3001|3002}      │ │
│  │ - Proxied to PM2-managed backend                      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌───────────────────┐                 ┌───────────────────┐
│   Blue Backend    │                 │   Green Backend   │
│   Port: 3001      │                 │   Port: 3002      │
│                   │                 │                   │
│  PM2 Cluster Mode │                 │  PM2 Cluster Mode │
│  - Multiple       │                 │  - Multiple       │
│    workers        │                 │    workers        │
│  - Load balanced  │                 │  - Load balanced  │
│  - API endpoints  │                 │  - API endpoints  │
└───────────────────┘                 └───────────────────┘
```

**Blue Environment:**
- Backend: Node.js API on port 3001 (PM2 cluster)
- Frontend: Static files in /var/www/weatherman/blue/

**Green Environment:**
- Backend: Node.js API on port 3002 (PM2 cluster)
- Frontend: Static files in /var/www/weatherman/green/

**Traffic Switching:**
When switching from Blue to Green, nginx configuration is updated to:
1. Change backend upstream from port 3001 → 3002
2. Change frontend root from /var/www/weatherman/blue/ → /var/www/weatherman/green/

This allows zero-downtime deployments with instant rollback capability.

## Prerequisites

### System Requirements

- **OS**: Ubuntu 20.04+ or similar Linux distribution
- **Node.js**: 22+
- **PM2**: Latest version (`npm install -g pm2`)
- **Nginx**: Latest stable version
- **Sudo access**: For nginx management and state directory creation

### User Setup

Create a dedicated deployment user (recommended):

```bash
# Create weatherman user
sudo useradd -r -m -s /bin/bash weatherman

# Add to necessary groups
sudo usermod -aG www-data weatherman  # For nginx config access
```

### Sudo Configuration (Least Privilege)

Install the sudoers configuration to grant minimum required permissions:

```bash
# Method 1: Automated installation (recommended)
cd /path/to/weatherman
sudo ./scripts/deployment/install-sudoers.sh weatherman

# Method 2: Manual installation
sudo visudo -c -f scripts/deployment/weatherman-sudoers
sudo cp scripts/deployment/weatherman-sudoers /etc/sudoers.d/weatherman
sudo chmod 440 /etc/sudoers.d/weatherman
```

**Granted Permissions:**
- Copy/edit nginx configuration: `/etc/nginx/sites-enabled/weatherman`
- Test nginx configuration: `nginx -t`
- Reload nginx service: `systemctl reload nginx`
- Manage state directory: `/var/lib/weatherman/state/`
- Write state files: `blue.json`, `green.json`

**Security Notes:**
- NOPASSWD is enabled for automation (GitHub Actions)
- Sudo logging is enabled for audit trail
- Commands are restricted to specific paths only
- User should only be used by GitHub Actions runner

### Deployment State Initialization

Run once during initial server setup:

```bash
# Initialize deployment state directory and files
sudo ./scripts/deployment/setup-deployment-state.sh

# Verify state files created
ls -la /var/lib/weatherman/state/
cat /var/lib/weatherman/state/blue.json
cat /var/lib/weatherman/state/green.json
```

This creates:
- `/var/lib/weatherman/state/` directory (755 permissions)
- `blue.json` - Active environment state (default)
- `green.json` - Inactive environment state (default)

### Nginx Configuration

Install nginx configuration using the automated script:

```bash
# Method 1: Automated installation (recommended)
sudo ./scripts/deployment/install-nginx-config.sh

# Method 2: Custom server name
sudo ./scripts/deployment/install-nginx-config.sh your-domain.com

# Method 3: Localhost for testing
sudo ./scripts/deployment/install-nginx-config.sh localhost
```

**What the installation script does:**
- Validates nginx syntax before installation
- Backs up existing configuration automatically
- Installs to sites-available with correct permissions
- Creates symlink to sites-enabled
- Tests complete nginx configuration
- Reloads nginx service (if running)
- Rolls back on failure

**Verify installation:**
```bash
# Run verification checks
./scripts/deployment/verify-nginx-config.sh

# Manual verification
sudo nginx -t
sudo systemctl status nginx
curl http://localhost/health
```

**Configuration features:**
- Blue-Green deployment support
  - Blue: Backend on port 3001, Frontend in /var/www/weatherman/blue/
  - Green: Backend on port 3002, Frontend in /var/www/weatherman/green/
- Nginx serves frontend static files directly (packages/frontend/dist)
- Nginx proxies /api/* requests to PM2-managed backend cluster
- Health check endpoint with monitoring disabled
- WebSocket support for real-time features
- Security headers (XSS, CORS, frame protection)
- Static asset caching with immutable cache-control
- Request logging (access and error logs)
- SSL/HTTPS ready (commented out, enable when needed)

### PM2 Configuration

Ensure PM2 configs exist in repository root:

- `pm2.blue.config.js` - Blue backend configuration (port 3001, cluster mode)
- `pm2.green.config.js` - Green backend configuration (port 3002, cluster mode)

PM2 manages the Node.js backend API server in cluster mode with multiple workers for load balancing.
The frontend static files are served directly by nginx, not by the Node.js backend.

### GitHub Actions Runner (Self-Hosted)

Install and configure a self-hosted runner on the production server:

```bash
# Download and configure runner (follow GitHub's instructions)
# https://github.com/<org>/<repo>/settings/actions/runners/new

# Run as weatherman user
sudo -u weatherman bash

# Start runner as a service
cd ~/actions-runner
sudo ./svc.sh install weatherman
sudo ./svc.sh start
```

## Deployment Scripts

### deploy-to-blue.sh / deploy-to-green.sh

Deploy application to specific environment.

**Usage:**
```bash
./scripts/deployment/deploy-to-blue.sh
./scripts/deployment/deploy-to-green.sh
```

**What it does:**
1. Verifies PM2 config exists
2. Verifies build artifacts exist (packages/frontend/dist)
3. Deploys frontend static files to environment-specific directory:
   - Blue: /var/www/weatherman/blue/
   - Green: /var/www/weatherman/green/
4. Sets correct permissions (www-data:www-data, 755)
5. Stops existing environment PM2 processes
6. Starts environment backend with PM2 cluster
7. Verifies PM2 process is running

**Requirements:**
- Application must be built (`npm run build --workspace=packages/frontend`)
- PM2 must be installed
- Correct PM2 config file must exist
- Sudo access for frontend deployment directory management

### switch-traffic.sh

Switch nginx traffic between Blue and Green environments.

**Usage:**
```bash
./scripts/deployment/switch-traffic.sh blue
./scripts/deployment/switch-traffic.sh green
```

**What it does:**
1. Validates target environment health (backend /health endpoint)
2. Backs up current nginx configuration
3. Updates nginx configuration:
   - Backend upstream port (3001 ↔ 3002)
   - Frontend root directory (/var/www/weatherman/blue ↔ /var/www/weatherman/green)
4. Validates nginx syntax
5. Reloads nginx with zero downtime
6. Updates deployment state files (backend_port, frontend_dir)
7. Rolls back on failure

**Requirements:**
- Target environment must be running and healthy
- Target frontend files must be deployed to /var/www/weatherman/{env}/
- Sudo access for nginx management
- Nginx configuration at `/etc/nginx/sites-enabled/weatherman`

**Safety:**
- Always validates health before switching
- Backs up configuration before changes
- Validates nginx syntax before reload
- Automatic rollback on failure

### rollback-to-blue.sh / rollback-to-green.sh

Emergency rollback to specific environment.

**Usage:**
```bash
./scripts/deployment/rollback-to-blue.sh
./scripts/deployment/rollback-to-green.sh
```

**What it does:**
1. Verifies target environment health
2. Switches traffic to target environment
3. Stops failed environment
4. Updates state files
5. Reports rollback status

**Use cases:**
- Deployment validation fails
- New version has critical bugs
- Performance degradation detected
- Manual intervention required

### setup-deployment-state.sh

Initialize deployment state directory and files (one-time setup).

**Usage:**
```bash
sudo ./scripts/deployment/setup-deployment-state.sh
```

**What it does:**
1. Creates `/var/lib/weatherman/state/` directory
2. Initializes `blue.json` (active by default)
3. Initializes `green.json` (inactive by default)
4. Sets correct permissions
5. Displays current state

**Run this once** during initial production server setup.

## Deployment Workflow

### Normal Deployment (via GitHub Actions)

When code is merged to main branch:

1. **Detect Active Environment**
   - Workflow reads nginx config
   - Determines which environment is active (Blue or Green)
   - Sets inactive environment as deployment target

2. **Deploy to Inactive Environment**
   - Checkout code on self-hosted runner
   - Install dependencies: `npm ci`
   - Build frontend: `npm run build --workspace=packages/frontend`
   - Deploy frontend static files to /var/www/weatherman/{env}/
   - Stop inactive environment backend
   - Start backend with PM2 cluster

3. **Health Check**
   - Poll `/health` endpoint (2-minute timeout)
   - Verify deployment is healthy
   - Fail deployment if health check times out

4. **Post-Deployment Tests** (Phase 6)
   - Run smoke tests
   - Run integration tests
   - Compare performance baseline
   - Fail if tests don't pass

5. **Switch Traffic** (Phase 6)
   - Update nginx to point to new environment
   - Reload nginx
   - Verify traffic routing
   - Update deployment state

6. **Rollback on Failure** (Phase 6)
   - Automatic rollback if tests fail
   - Switch traffic back to previous environment
   - Stop failed environment
   - Report failure

### Manual Deployment

For testing or manual deployments:

```bash
# 1. Build application
npm ci
npm run build --workspace=packages/frontend

# 2. Deploy to Green (if Blue is active)
./scripts/deployment/deploy-to-green.sh

# 3. Wait for health check
curl http://localhost:3002/health

# 4. Run post-deployment tests (manual)
npm test --workspace=packages/frontend
npm test --workspace=packages/server

# 5. Switch traffic if tests pass
./scripts/deployment/switch-traffic.sh green

# 6. Rollback if issues found
./scripts/deployment/rollback-to-blue.sh
```

## Monitoring & Debugging

### Check Environment Status

```bash
# View deployment state
cat /var/lib/weatherman/state/blue.json
cat /var/lib/weatherman/state/green.json

# Check PM2 processes
pm2 list
pm2 logs weatherman-blue
pm2 logs weatherman-green

# Check nginx
sudo nginx -t
sudo systemctl status nginx
curl http://localhost/health
```

### View Nginx Logs

```bash
# Access log (traffic)
sudo tail -f /var/log/nginx/access.log

# Error log
sudo tail -f /var/log/nginx/error.log

# Filter for weatherman
sudo grep weatherman /var/log/nginx/access.log
```

### View PM2 Logs

```bash
# Real-time logs
pm2 logs

# Specific environment
pm2 logs weatherman-blue
pm2 logs weatherman-green

# Error logs only
pm2 logs --err
```

### Verify Health

```bash
# Check both backend environments directly
curl http://localhost:3001/health  # Blue backend
curl http://localhost:3002/health  # Green backend

# Check via nginx (active environment)
curl http://localhost/health

# Check frontend directories exist
ls -la /var/www/weatherman/blue/
ls -la /var/www/weatherman/green/
```

## Troubleshooting

### Deployment Fails - Health Check Timeout

**Symptom**: Health check never passes, deployment times out

**Solutions**:
1. Check PM2 logs: `pm2 logs weatherman-green --lines 50`
2. Verify port not in use: `lsof -i :3002`
3. Check build artifacts deployed: `ls -la /var/www/weatherman/green/`
4. Check source build: `ls -la packages/frontend/dist/`
5. Manually test backend health: `curl http://localhost:3002/health`

### Traffic Switch Fails - Nginx Error

**Symptom**: `nginx -t` fails after configuration update

**Solutions**:
1. Check nginx error: `sudo nginx -t`
2. Configuration automatically rolled back
3. Verify nginx config syntax: `/etc/nginx/sites-enabled/weatherman`
4. Check nginx logs: `sudo tail /var/log/nginx/error.log`

### Rollback Fails - Target Environment Unhealthy

**Symptom**: Cannot rollback because Blue is also unhealthy

**Solutions**:
1. Manually restart Blue: `pm2 restart weatherman-blue`
2. Check Blue logs: `pm2 logs weatherman-blue`
3. Rebuild and redeploy: `npm run build && ./scripts/deployment/deploy-to-blue.sh`
4. Fix underlying issue before attempting rollback

### Permission Denied - Sudo Commands

**Symptom**: Deployment scripts fail with permission errors

**Solutions**:
1. Verify sudoers installed: `sudo cat /etc/sudoers.d/weatherman`
2. Test permissions: `sudo -l -U weatherman`
3. Reinstall sudoers: `sudo ./scripts/deployment/install-sudoers.sh weatherman`
4. Verify user in correct groups: `groups weatherman`

## Security Considerations

### Least Privilege

- Deployment user only has sudo for specific commands
- No sudo access to shell, package managers, or system config
- Nginx editing restricted to weatherman config only
- State directory restricted to `/var/lib/weatherman/state/`

### Audit Trail

- All sudo commands are logged
- PM2 logs all process activity
- Nginx access logs track traffic patterns
- Deployment state files track all changes with timestamps

### Access Control

- Deployment user should only be used by GitHub Actions runner
- SSH access should be restricted or disabled
- Consider firewall rules for port 3000/3001
- Nginx should be the only public-facing service

### Secrets Management

- API keys in environment variables only
- Never commit secrets to repository
- Use GitHub Actions secrets for sensitive values
- Rotate credentials regularly

## Phase 6: Post-Deployment Validation

Phase 6 (tasks T045-T058) will add:

- Automated smoke tests
- Performance baseline comparison
- Automatic rollback on test failures
- GitHub deployment status updates
- Comprehensive validation before traffic switch

See: `specs/003-automated-build-test/tasks.md` for Phase 6 tasks.
