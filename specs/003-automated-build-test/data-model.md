# Data Model: Automated Build and Test Workflows

**Feature**: 003-automated-build-test
**Date**: 2025-12-30

## Overview

This document defines the data structures and state models for the automated build, test, and deployment system. These models represent workflow execution state, test results, deployment environments, and quality metrics.

---

## 1. Build Workflow

Represents a complete execution of build and test processes.

### Fields

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `workflow_id` | string | GitHub Actions workflow run ID | Unique, format: numeric string |
| `trigger_source` | enum | What triggered the workflow | One of: `push`, `pull_request`, `workflow_dispatch`, `schedule` |
| `branch` | string | Git branch name | Non-empty |
| `commit_sha` | string | Git commit hash | 40-char hex string |
| `commit_message` | string | Git commit message | Max 500 chars |
| `author` | string | Commit author (username) | GitHub username format |
| `start_time` | timestamp | Workflow start time (ISO 8601) | UTC |
| `end_time` | timestamp | Workflow end time (ISO 8601) | UTC, >= start_time |
| `duration_seconds` | integer | Total execution time | >= 0, <= 600 (10 min timeout) |
| `status` | enum | Workflow result | One of: `pending`, `running`, `succeeded`, `failed`, `cancelled`, `timed_out` |
| `timeout_reason` | string | Why workflow timed out (if applicable) | Optional, present if status=`timed_out` |
| `jobs` | Job[] | List of jobs in this workflow | At least 1 job |

### Relationships

- **Has Many**: Test Results (via `workflow_id`)
- **Has One**: Code Coverage Report (via `workflow_id`)
- **Has Many**: Build Artifacts (via `workflow_id`)

### State Transitions

```
pending → running → [succeeded | failed | cancelled | timed_out]
```

### Example

```json
{
  "workflow_id": "1234567890",
  "trigger_source": "pull_request",
  "branch": "003-automated-build-test",
  "commit_sha": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
  "commit_message": "feat(ci): add GitHub Actions workflows",
  "author": "developer",
  "start_time": "2025-12-30T10:00:00Z",
  "end_time": "2025-12-30T10:08:45Z",
  "duration_seconds": 525,
  "status": "succeeded",
  "jobs": [
    {
      "job_id": "lint",
      "status": "succeeded",
      "duration_seconds": 120
    },
    {
      "job_id": "test-frontend",
      "status": "succeeded",
      "duration_seconds": 300
    }
  ]
}
```

---

## 2. Job

Represents a single job within a workflow (e.g., lint, test, build).

### Fields

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `job_id` | string | GitHub Actions job ID | Unique within workflow |
| `job_name` | string | Human-readable job name | Non-empty |
| `runner_type` | enum | Where job executed | One of: `github-hosted`, `self-hosted` |
| `status` | enum | Job result | One of: `pending`, `running`, `succeeded`, `failed`, `skipped` |
| `start_time` | timestamp | Job start time (ISO 8601) | UTC |
| `end_time` | timestamp | Job end time (ISO 8601) | UTC, >= start_time |
| `duration_seconds` | integer | Job execution time | >= 0 |
| `logs_url` | string | URL to job logs | GitHub Actions logs URL |

---

## 3. Test Result

Represents the outcome of individual test cases.

### Fields

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `test_id` | string | Unique test identifier | Format: `{suite}/{file}/{test_name}` |
| `workflow_id` | string | Associated workflow run | Foreign key to Build Workflow |
| `test_suite` | enum | Test category | One of: `unit`, `integration`, `e2e`, `post-deployment` |
| `test_name` | string | Human-readable test name | Non-empty |
| `file_path` | string | Test file location | Relative path from repo root |
| `duration_ms` | integer | Test execution time in milliseconds | >= 0 |
| `status` | enum | Test result | One of: `passed`, `failed`, `skipped`, `flaky` |
| `error_message` | string | Error message if failed | Optional, present if status=`failed` |
| `stack_trace` | string | Stack trace if failed | Optional, present if status=`failed` |
| `retry_count` | integer | Number of retries (for flaky tests) | >= 0, default 0 |

### Relationships

- **Belongs To**: Build Workflow (via `workflow_id`)

### Example

```json
{
  "test_id": "frontend/components/WeatherCard/WeatherCard.test.jsx/renders temperature correctly",
  "workflow_id": "1234567890",
  "test_suite": "unit",
  "test_name": "renders temperature correctly",
  "file_path": "packages/frontend/src/components/WeatherCard/WeatherCard.test.jsx",
  "duration_ms": 45,
  "status": "passed",
  "retry_count": 0
}
```

---

## 4. Code Coverage Report

Represents analysis of code execution during tests.

### Fields

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `workflow_id` | string | Associated workflow run | Foreign key to Build Workflow, unique |
| `package_name` | string | Package/module name | One of: `frontend`, `backend` |
| `total_lines` | integer | Total lines of code | > 0 |
| `covered_lines` | integer | Lines executed during tests | >= 0, <= total_lines |
| `line_coverage_pct` | float | Percentage of lines covered | 0.0 - 100.0 |
| `total_branches` | integer | Total conditional branches | >= 0 |
| `covered_branches` | integer | Branches executed | >= 0, <= total_branches |
| `branch_coverage_pct` | float | Percentage of branches covered | 0.0 - 100.0 |
| `total_functions` | integer | Total functions | >= 0 |
| `covered_functions` | integer | Functions executed | >= 0, <= total_functions |
| `function_coverage_pct` | float | Percentage of functions covered | 0.0 - 100.0 |
| `total_statements` | integer | Total statements | > 0 |
| `covered_statements` | integer | Statements executed | >= 0, <= total_statements |
| `statement_coverage_pct` | float | Percentage of statements covered | 0.0 - 100.0 |
| `overall_coverage_pct` | float | Average coverage across metrics | 0.0 - 100.0 |
| `meets_threshold` | boolean | Whether coverage >= 80% | true if overall_coverage_pct >= 80 |
| `low_coverage_files` | FileCoverage[] | Files below 80% coverage | Sorted by coverage ascending |

### Relationships

- **Belongs To**: Build Workflow (via `workflow_id`)

### Validation Rules

- `meets_threshold` must be true for PR merge to be allowed
- `overall_coverage_pct >= 80.0` for quality gate to pass

### Example

```json
{
  "workflow_id": "1234567890",
  "package_name": "frontend",
  "total_lines": 5000,
  "covered_lines": 4200,
  "line_coverage_pct": 84.0,
  "total_branches": 800,
  "covered_branches": 680,
  "branch_coverage_pct": 85.0,
  "total_functions": 400,
  "covered_functions": 330,
  "function_coverage_pct": 82.5,
  "total_statements": 5500,
  "covered_statements": 4510,
  "statement_coverage_pct": 82.0,
  "overall_coverage_pct": 83.4,
  "meets_threshold": true,
  "low_coverage_files": []
}
```

---

## 5. Build Artifact

Represents compiled outputs, test reports, logs, and deployable packages.

### Fields

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `artifact_id` | string | GitHub Actions artifact ID | Unique |
| `workflow_id` | string | Associated workflow run | Foreign key to Build Workflow |
| `artifact_name` | string | Human-readable name | Non-empty |
| `artifact_type` | enum | Artifact category | One of: `build_output`, `test_report`, `coverage_report`, `logs`, `deployable` |
| `size_bytes` | integer | Artifact size | >= 0 |
| `created_at` | timestamp | Upload time (ISO 8601) | UTC |
| `expires_at` | timestamp | Expiry time (ISO 8601) | UTC, 90 days after created_at |
| `download_url` | string | Artifact download URL | GitHub API URL |

### Relationships

- **Belongs To**: Build Workflow (via `workflow_id`)

---

## 6. Deployment Environment

Represents a production environment instance (Blue or Green).

### Fields

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `environment_id` | string | Environment identifier | One of: `blue`, `green` |
| `status` | enum | Environment state | One of: `active`, `inactive`, `deploying`, `failed`, `healthy`, `unhealthy` |
| `deployed_commit_sha` | string | Currently deployed commit | 40-char hex string |
| `deployed_at` | timestamp | Deployment time (ISO 8601) | UTC |
| `pm2_process_id` | string | PM2 app name | One of: `weatherman-blue`, `weatherman-green` |
| `port` | integer | HTTP port | 3001 (blue) or 3002 (green) |
| `traffic_routing_state` | enum | Is receiving traffic? | One of: `active`, `inactive` |
| `last_health_check` | timestamp | Most recent health check (ISO 8601) | UTC |
| `health_check_status` | enum | Health status | One of: `passing`, `failing`, `unknown` |
| `deployment_workflow_id` | string | Associated deployment workflow | Foreign key to Build Workflow |
| `post_deployment_test_results` | TestResult[] | Post-deploy test outcomes | Empty if not yet run |
| `performance_metrics` | PerformanceMetrics | Performance baseline | Required for Green before traffic switch |

### State Transitions

```
inactive → deploying → [active | failed]
active → inactive (when traffic switched away)
```

### Validation Rules

- Only one environment can have `traffic_routing_state = active` at a time
- Environment must have `status = healthy` and all post_deployment_test_results `status = passed` before traffic can be switched to it
- Performance regression check: `green.performance_metrics` must not be >20% worse than `blue.performance_metrics`

### Example

```json
{
  "environment_id": "green",
  "status": "healthy",
  "deployed_commit_sha": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
  "deployed_at": "2025-12-30T10:30:00Z",
  "pm2_process_id": "weatherman-green",
  "port": 3002,
  "traffic_routing_state": "inactive",
  "last_health_check": "2025-12-30T10:45:00Z",
  "health_check_status": "passing",
  "deployment_workflow_id": "1234567891",
  "post_deployment_test_results": [
    {
      "test_id": "smoke/api/health-check",
      "status": "passed",
      "duration_ms": 150
    }
  ],
  "performance_metrics": {
    "avg_response_time_ms": 85,
    "p95_response_time_ms": 200,
    "requests_per_second": 1200,
    "error_rate_pct": 0.01
  }
}
```

---

## 7. Performance Metrics

Represents performance baseline for an environment.

### Fields

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `environment_id` | string | Associated environment | One of: `blue`, `green` |
| `captured_at` | timestamp | Measurement time (ISO 8601) | UTC |
| `avg_response_time_ms` | float | Average API response time | >= 0 |
| `p95_response_time_ms` | float | 95th percentile response time | >= avg_response_time_ms |
| `p99_response_time_ms` | float | 99th percentile response time | >= p95_response_time_ms |
| `requests_per_second` | float | Request throughput | >= 0 |
| `error_rate_pct` | float | Percentage of failed requests | 0.0 - 100.0 |
| `cpu_usage_pct` | float | Average CPU utilization | 0.0 - 100.0 |
| `memory_usage_mb` | float | Average memory usage | >= 0 |

### Validation Rules

- For Green environment to pass performance check:
  - `green.avg_response_time_ms <= blue.avg_response_time_ms * 1.20` (max 20% slower)
  - `green.error_rate_pct <= blue.error_rate_pct * 1.20` (max 20% more errors)
  - `green.requests_per_second >= blue.requests_per_second * 0.80` (min 80% throughput)

---

## 8. Quality Gate

Represents configurable rules that must pass before code can be merged.

### Fields

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `gate_id` | string | Gate identifier | Unique, format: lowercase-kebab |
| `gate_name` | string | Human-readable name | Non-empty |
| `gate_type` | enum | Category of check | One of: `test`, `coverage`, `lint`, `build`, `security` |
| `required_for_merge` | boolean | Blocks PR merge if failed | Default: true |
| `threshold_value` | float | Minimum passing value (if applicable) | Optional, e.g., 80.0 for coverage |
| `status` | enum | Current gate status | One of: `pending`, `running`, `passed`, `failed` |
| `last_evaluated_at` | timestamp | Most recent check time (ISO 8601) | UTC |
| `failure_message` | string | Why gate failed (if applicable) | Optional, present if status=`failed` |

### Example

```json
{
  "gate_id": "frontend-coverage",
  "gate_name": "Frontend Code Coverage >= 80%",
  "gate_type": "coverage",
  "required_for_merge": true,
  "threshold_value": 80.0,
  "status": "passed",
  "last_evaluated_at": "2025-12-30T10:08:45Z"
}
```

---

## Entity Relationship Diagram

```
┌──────────────────┐
│ Build Workflow   │
│ - workflow_id    │◄───┐
│ - status         │    │
│ - duration       │    │
└────────┬─────────┘    │
         │              │
         │ 1:N          │ 1:1
         ▼              │
    ┌──────────────┐    │
    │ Test Result  │    │
    │ - test_id    │    │
    │ - status     │    │
    └──────────────┘    │
                        │
         │              │
         │ 1:1          │
         ▼              │
┌─────────────────────┐ │
│ Code Coverage Report│ │
│ - overall_pct       │─┘
│ - meets_threshold   │
└─────────────────────┘

┌──────────────────────┐
│ Deployment Environment│
│ - environment_id     │
│ - status             │
│ - traffic_routing    │
└──────┬───────────────┘
       │
       │ 1:1
       ▼
┌─────────────────────┐
│ Performance Metrics │
│ - avg_response_time │
│ - error_rate        │
└─────────────────────┘
```

---

## Storage Mechanisms

### GitHub Actions Metadata
- **Build Workflow**, **Job**, **Build Artifact**: Stored in GitHub Actions run metadata (accessible via API)
- **Retention**: 90 days (GitHub default for workflow runs and artifacts)

### Test Reports (JSON Files)
- **Test Result**, **Code Coverage Report**: Stored as JSON artifacts uploaded during workflow runs
- **Retention**: 90 days
- **Format**: Vitest JSON reporter output, c8 coverage JSON summary

### Deployment State (Production Server)
- **Deployment Environment**, **Performance Metrics**: Stored in JSON files on production server at `/var/lib/weatherman/state/`
- **Retention**: Indefinite (manual cleanup)
- **Access**: Read/write by self-hosted runner user and deployment scripts

### Quality Gate Status
- **Quality Gate**: Stored in GitHub branch protection rules and workflow status checks
- **Retention**: Per GitHub's status check retention policy

---

## Summary

This data model provides complete coverage of:
- ✅ Workflow execution tracking (Build Workflow, Job)
- ✅ Test result storage (Test Result, Code Coverage Report)
- ✅ Deployment state management (Deployment Environment, Performance Metrics)
- ✅ Quality enforcement (Quality Gate)
- ✅ Blue-green deployment logic (Environment state transitions, performance comparison)

All entities support the functional requirements from the spec, including 80% coverage threshold, 10/15-minute timeouts, 20% performance regression detection, and concurrent deployment blocking.
