# Testing Post-Deployment Validation (T058)

This document provides instructions for testing the post-deployment validation system with intentional failures to verify rollback functionality.

## Overview

The post-deployment validation system runs automatically after each deployment to ensure:
1. Smoke tests pass (basic health checks)
2. Frontend integration tests pass
3. Backend integration tests pass
4. Performance is within acceptable thresholds (< 20% regression)

If any tests fail, the system automatically rolls back the deployment, keeping traffic on the active (stable) environment.

## Test Scenario 1: Successful Deployment

### Steps:
1. Make a simple code change (e.g., update a comment)
2. Commit and push to a feature branch
3. Create a pull request
4. Merge the PR to `main`
5. Monitor the deployment workflow

### Expected Results:
- ✅ Deploy-inactive job succeeds
- ✅ Post-deployment-tests job succeeds (all 5 phases pass)
- ✅ Switch-traffic job succeeds
- ✅ Nginx reloads successfully
- ✅ Deployment state files updated
- ✅ GitHub deployment status created
- ✅ Traffic is now on the newly deployed environment

### Verification:
```bash
# Check active environment
curl http://weatherman.zwarg.com/api/health

# Check deployment state
cat /var/lib/weatherman/state/blue.json
cat /var/lib/weatherman/state/green.json
```

## Test Scenario 2: Performance Regression Detection

### Steps:
1. Artificially introduce a performance bottleneck:
   ```javascript
   // In packages/server/src/routes/recommendations.js
   app.post('/api/recommendations', async (req, res) => {
     // Add artificial delay to simulate performance regression
     await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay

     // ... rest of code
   });
   ```

2. Commit with message: `test: add artificial delay for performance regression testing`
3. Create PR and merge to `main`
4. Monitor the deployment workflow

### Expected Results:
- ✅ Deploy-inactive job succeeds
- ✅ Post-deployment-tests phases 1-4 succeed
- ❌ Post-deployment-tests phase 5 fails (performance comparison > 20% threshold)
- ⏭️ Switch-traffic job skipped
- ✅ Rollback job runs
- ✅ Failed environment is stopped
- ✅ Deployment state marked as "failed"
- ✅ GitHub deployment failure status created
- ✅ Traffic remains on the active (stable) environment

### Verification:
```bash
# Check that active environment is still running
curl http://weatherman.zwarg.com/api/health

# Check PM2 processes - inactive should be deleted
npx pm2 list

# Check deployment state - should show failure
cat /var/lib/weatherman/state/green.json  # (or blue, depending on which was inactive)

# Verify response time is still good
time curl http://weatherman.zwarg.com/api/health
```

## Test Scenario 3: Integration Test Failure

### Steps:
1. Introduce a breaking change in the API:
   ```javascript
   // In packages/server/src/routes/health.js
   app.get('/api/health', (req, res) => {
     // Return wrong status to fail integration tests
     res.status(500).json({ status: 'error' });
   });
   ```

2. Commit with message: `test: break health endpoint for rollback testing`
3. Create PR and merge to `main`
4. Monitor the deployment workflow

### Expected Results:
- ✅ Deploy-inactive job succeeds (deployment completes)
- ❌ Post-deployment-tests phase 1 fails (smoke tests detect unhealthy status)
- ⏭️ Subsequent test phases skipped
- ⏭️ Switch-traffic job skipped
- ✅ Rollback job runs
- ✅ Traffic remains on active environment

### Verification:
```bash
# Active environment should still return healthy status
curl http://weatherman.zwarg.com/api/health
# Should return: {"status":"ok",...}

# Check workflow logs in GitHub Actions
gh run list --workflow=deploy-production.yml
gh run view <run-id>
```

## Test Scenario 4: Frontend Bundle Size Violation

### Steps:
1. Add a large dependency to frontend:
   ```bash
   cd packages/frontend
   npm install --save lodash moment chart.js three
   npm run build
   ```

2. Commit and merge to `main`
3. Monitor the deployment workflow

### Expected Results:
- ✅ Deploy-inactive job succeeds
- ❌ Post-deployment-tests phase 2 fails (frontend bundle size > 300KB)
- ✅ Rollback job runs
- ✅ Traffic remains on active environment

## Test Scenario 5: Manual Rollback

### Steps:
1. After a successful deployment, manually trigger a rollback:
   ```bash
   # Identify the currently active environment
   ACTIVE_ENV=$(grep -oP 'proxy_pass\s+http://localhost:\K\d+' /etc/nginx/sites-enabled/weatherman | head -1)

   if [ "$ACTIVE_ENV" == "3001" ]; then
     ROLLBACK_TO="blue"
   else
     ROLLBACK_TO="green"
   fi

   # Execute rollback
   sudo bash scripts/deployment/switch-traffic.sh "$ROLLBACK_TO"
   sudo systemctl reload nginx
   ```

### Expected Results:
- ✅ Nginx configuration updated
- ✅ Traffic switched to previous environment
- ✅ Both environments still running

## Monitoring and Debugging

### View Deployment Logs
```bash
# View post-deployment test results
ls -la /tmp/post-deployment-tests-*

# View specific phase logs
cat /tmp/post-deployment-tests-green-*/phase-1.log  # Smoke tests
cat /tmp/post-deployment-tests-green-*/phase-2.log  # Frontend tests
cat /tmp/post-deployment-tests-green-*/phase-3.log  # Backend tests
cat /tmp/post-deployment-tests-green-*/phase-4.log  # Performance baseline
cat /tmp/post-deployment-tests-green-*/phase-5.log  # Performance comparison
```

### View PM2 Processes
```bash
npx pm2 list
npx pm2 logs weatherman-blue
npx pm2 logs weatherman-green
```

### View Nginx Configuration
```bash
sudo cat /etc/nginx/sites-enabled/weatherman
sudo nginx -t
sudo systemctl status nginx
```

### View Deployment State
```bash
cat /var/lib/weatherman/state/blue.json
cat /var/lib/weatherman/state/green.json
```

## Cleanup After Testing

### Revert Test Changes
After testing with intentional failures, revert the test changes:

```bash
git revert <commit-sha>
git push origin main
```

### Clear Old Test Results
```bash
rm -rf /tmp/post-deployment-tests-*
rm -f /tmp/performance-baseline-*.json
```

## Success Criteria

The post-deployment validation system is working correctly if:

1. ✅ Successful deployments switch traffic automatically
2. ✅ Performance regressions > 20% trigger rollback
3. ✅ Integration test failures trigger rollback
4. ✅ Bundle size violations trigger rollback
5. ✅ Rollback leaves traffic on the stable environment
6. ✅ Deployment state files accurately reflect environment status
7. ✅ GitHub deployment statuses are created correctly
8. ✅ All PM2 processes remain healthy after rollback

## Troubleshooting

### Issue: Tests timeout after 15 minutes
**Cause**: Post-deployment test suite is taking too long
**Solution**:
- Check for network issues
- Verify external API connectivity
- Review performance baseline capture (may be slow)

### Issue: Rollback job doesn't run
**Cause**: `if: failure()` condition not met
**Solution**:
- Check that post-deployment-tests job actually failed
- Review workflow syntax for rollback job
- Verify job dependencies are correct

### Issue: Performance comparison always fails
**Cause**: No baseline exists for active environment
**Solution**:
- Run performance baseline capture manually on active environment:
  ```bash
  bash scripts/testing/performance-baseline.sh blue 3001 /tmp/performance-baseline-blue.json
  ```

### Issue: Nginx reload fails
**Cause**: Invalid nginx configuration
**Solution**:
- Test configuration before deployment:
  ```bash
  sudo nginx -t
  ```
- Review switch-traffic.sh script for syntax errors
- Check nginx error logs:
  ```bash
  sudo tail -f /var/log/nginx/error.log
  ```

## Additional Resources

- [Deployment Scripts README](../../scripts/deployment/README.md)
- [GitHub Actions Workflows](.github/workflows/)
- [Data Model](./data-model.md)
- [Quickstart Guide](./quickstart.md)
