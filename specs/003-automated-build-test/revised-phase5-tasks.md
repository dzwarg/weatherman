# Revised Phase 5: User Story 3 - Automated Deployment on Merge

**Goal**: Deploy to production using blue-green pattern with zero downtime and automatic rollback on failure

**Independent Test**: Merge a PR to main and verify blue-green deployment executes, switching traffic only if tests pass

## Critical Architecture Fix

**Problem Identified**: Current implementation has PM2 running backend code directly from GitHub Actions checkout directory, which gets cleaned on each deployment. This creates instability.

**Solution**: Deploy backend code to stable directories (like frontend), separate from checkout directory.

## Revised Task List

### Infrastructure Setup (New)

- [ ] T032A [US3] Create backend deployment directory structure on production server: `/opt/weatherman/blue/` and `/opt/weatherman/green/`
- [ ] T032B [US3] Update sudoers configuration at `scripts/deployment/weatherman-sudoers` to include backend deployment commands (mkdir, cp, chown for /opt/weatherman/)

### Workflow and Detection (Unchanged)

- [X] T032 [US3] Create deployment workflow file at `.github/workflows/deploy-production.yml` with push to main trigger
- [X] T033 [US3] Configure concurrency group "production-deployment" to prevent concurrent deployments
- [X] T034 [US3] Add detect-environment job that checks nginx config to determine active Blue or Green
- [X] T035 [US3] Add deploy-inactive job that runs on self-hosted runner, stops inactive environment, builds, and deploys to stable directories

### Deployment Scripts (Revised)

- [ ] T036A [US3] Create deploy-to-blue.sh script at `scripts/deployment/deploy-to-blue.sh` that:
  - Copies backend code to `/opt/weatherman/blue/`
  - Installs dependencies in stable location
  - Creates .env file in stable location
  - Copies frontend to `/var/www/weatherman/blue/`
  - Starts PM2 pointing to stable backend path

- [ ] T036B [US3] Create deploy-to-green.sh script at `scripts/deployment/deploy-to-green.sh` that:
  - Copies backend code to `/opt/weatherman/green/`
  - Installs dependencies in stable location
  - Creates .env file in stable location
  - Copies frontend to `/var/www/weatherman/green/`
  - Starts PM2 pointing to stable backend path

### PM2 Configuration (Revised)

- [ ] T037A [US3] Update PM2 Blue configuration at `pm2.blue.config.js` to use stable path: `/opt/weatherman/blue/src/server.js`
- [ ] T037B [US3] Update PM2 Green configuration at `pm2.green.config.js` to use stable path: `/opt/weatherman/green/src/server.js`

### Supporting Scripts (Unchanged)

- [X] T037C [P] [US3] Create switch-traffic.sh script at `scripts/deployment/switch-traffic.sh` for nginx upstream switching
- [X] T038 [P] [US3] Create rollback-to-blue.sh script at `scripts/deployment/rollback-to-blue.sh` for emergency rollback
- [ ] T038A [P] [US3] Create rollback-to-green.sh script at `scripts/deployment/rollback-to-green.sh` for emergency rollback (completeness)

### Health Checks and State (Revised)

- [X] T039 [US3] Add health check polling in deploy-inactive job (wait for /api/health endpoint with 2-minute timeout)
- [X] T040 [US3] Create deployment state directory `/var/lib/weatherman/state/` on production server
- [X] T041 [US3] Initialize Blue environment state file at `/var/lib/weatherman/state/blue.json` as active
- [X] T042 [US3] Initialize Green environment state file at `/var/lib/weatherman/state/green.json` as inactive
- [ ] T043 [US3] Add deployment state update logic in deploy-inactive job to track environment status (using sudo tee)
- [ ] T044 [US3] Test deployment workflow by merging to main and verifying Blue-Green switch (manual verification required)

## New Tasks Summary

**New Tasks Added**:
1. T032A - Create backend stable directories
2. T032B - Update sudoers for backend deployment
3. T036A - Revised deploy-to-blue.sh (with backend to stable location)
4. T036B - Revised deploy-to-green.sh (with backend to stable location)
5. T037A - Update PM2 Blue config to use stable path
6. T037B - Update PM2 Green config to use stable path
7. T038A - Create rollback-to-green.sh for completeness

**Tasks Renamed/Revised**:
- Old T036 split into T036A and T036B (both environments)
- Old T037 split into T037A, T037B (PM2 configs), T037C (traffic switch)
- Old T038 kept, added T038A for green rollback

**Total Phase 5 Tasks**: 19 tasks (was 13)

## Implementation Order

1. **First**: Complete infrastructure setup (T032A, T032B) - creates directories and permissions
2. **Second**: Update PM2 configs (T037A, T037B) - point to new stable paths
3. **Third**: Update deployment scripts (T036A, T036B) - copy backend to stable locations
4. **Fourth**: Complete state management fix (T043) - already in PR #10
5. **Finally**: Test end-to-end (T044)

## Changes from Original Plan

**Architecture Change**: Backend now deployed to stable directories like frontend, preventing issues with GitHub Actions checkout cleaning.

**File Locations**:
- Frontend (unchanged): `/var/www/weatherman/{blue|green}/`
- Backend (NEW): `/opt/weatherman/{blue|green}/`
- Backend code: `/opt/weatherman/{blue|green}/src/server.js`
- Backend node_modules: `/opt/weatherman/{blue|green}/node_modules/`
- Backend .env: `/opt/weatherman/{blue|green}/.env`

**Sudoers Updates Needed**:
```bash
# Backend deployment directory management
Cmnd_Alias BACKEND_DEPLOY = \
    /bin/mkdir -p /opt/weatherman/blue, \
    /bin/mkdir -p /opt/weatherman/green, \
    /usr/bin/mkdir -p /opt/weatherman/blue, \
    /usr/bin/mkdir -p /opt/weatherman/green, \
    /bin/rm -rf /opt/weatherman/blue, \
    /bin/rm -rf /opt/weatherman/green, \
    /usr/bin/rm -rf /opt/weatherman/blue, \
    /usr/bin/rm -rf /opt/weatherman/green, \
    /bin/cp -r packages/server/. /opt/weatherman/blue/, \
    /bin/cp -r packages/server/. /opt/weatherman/green/, \
    /usr/bin/cp -r packages/server/. /opt/weatherman/blue/, \
    /usr/bin/cp -r packages/server/. /opt/weatherman/green/, \
    /bin/chown -R weatherman:weatherman /opt/weatherman/blue, \
    /bin/chown -R weatherman:weatherman /opt/weatherman/green, \
    /usr/bin/chown -R weatherman:weatherman /opt/weatherman/blue, \
    /usr/bin/chown -R weatherman:weatherman /opt/weatherman/green
```

**PM2 Config Changes**:
```javascript
// Before:
script: './packages/server/src/server.js'

// After:
script: '/opt/weatherman/blue/src/server.js'  // or green
cwd: '/opt/weatherman/blue'  // or green
```

## Benefits of This Approach

1. **Stability**: Running code is isolated from checkout operations
2. **Consistency**: Backend deployed like frontend (both in stable locations)
3. **Reliability**: No risk of PM2 processes breaking during git operations
4. **Clean Architecture**: Clear separation between build/checkout and runtime environments
