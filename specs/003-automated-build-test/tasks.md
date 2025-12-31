# Tasks: Automated Build and Test Workflows

**Input**: Design documents from `/specs/003-automated-build-test/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are NOT explicitly requested in this infrastructure feature. Tasks focus on workflow implementation and validation.

**Organization**: Tasks are grouped by user story (P1-P4) to enable independent implementation and testing of each CI/CD capability.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Workflows**: `.github/workflows/` (GitHub Actions standard)
- **Reusable actions**: `.github/actions/`
- **Deployment scripts**: `scripts/deployment/`
- **Testing scripts**: `scripts/testing/`
- **Post-deployment tests**: `packages/*/tests/post-deployment/`
- **Configuration**: Root-level PM2 configs, Vitest configs

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and workflow directory structure

- [X] T001 Create GitHub Actions workflow directory structure at `.github/workflows/`
- [X] T002 Create GitHub Actions reusable actions directory at `.github/actions/`
- [X] T003 [P] Create deployment scripts directory at `scripts/deployment/`
- [X] T004 [P] Create testing scripts directory at `scripts/testing/`
- [X] T005 [P] Create post-deployment test directories at `packages/frontend/tests/post-deployment/` and `packages/backend/tests/post-deployment/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core testing and coverage configuration that ALL user stories depend on

**⚠️ CRITICAL**: No workflow implementation can begin until this phase is complete

- [X] T006 Configure Vitest coverage thresholds (80%) in `packages/frontend/vitest.config.js`
- [X] T007 Configure Vitest coverage thresholds (80%) in `packages/backend/vitest.config.js`
- [X] T008 [P] Update frontend package.json with test coverage script: `"test": "vitest --coverage"`
- [X] T009 [P] Update backend package.json with test coverage script: `"test": "vitest --coverage"`
- [X] T010 Add ESLint configuration for production code checks (no console.log) in root `eslint.config.js`
- [X] T011 Create PM2 Blue environment configuration at `pm2.blue.config.js` with port 3001, cluster mode
- [X] T012 Create PM2 Green environment configuration at `pm2.green.config.js` with port 3002, cluster mode

**Checkpoint**: Foundation ready - workflow implementation can now begin in parallel

---

## Phase 3: User Story 1 - Continuous Integration on Code Push (Priority: P1) 🎯 MVP

**Goal**: Automatically run lint, test, and build checks on every feature branch push with 10-minute timeout

**Independent Test**: Push code to a feature branch and verify CI workflow runs automatically, reporting pass/fail status within 10 minutes

### Implementation for User Story 1

- [X] T013 [P] [US1] Create CI workflow file at `.github/workflows/ci.yml` with push trigger on all branches except main
- [X] T014 [P] [US1] Add lint job to CI workflow using ubuntu-latest runner with 10-minute timeout
- [X] T015 [P] [US1] Add frontend test job to CI workflow with coverage reporting and artifact upload
- [X] T016 [P] [US1] Add backend test job to CI workflow with coverage reporting and artifact upload
- [X] T017 [P] [US1] Add build job to CI workflow that depends on lint and test jobs
- [X] T018 [US1] Add bundle size check to build job (frontend < 300KB per constitution)
- [X] T019 [US1] Configure job-level timeouts (10 minutes) and workflow-level concurrency in CI workflow
- [X] T020 [US1] Add Node.js setup with npm cache to all CI jobs for faster execution
- [X] T021 [US1] Test CI workflow by pushing to a feature branch and verifying all jobs execute successfully

**Checkpoint**: At this point, developers get automated feedback on every push to feature branches

---

## Phase 4: User Story 2 - Pre-Merge Quality Gates (Priority: P2)

**Goal**: Enforce quality standards (branch naming, coverage, commits) before allowing PR merge to main

**Independent Test**: Create a pull request with failing tests or invalid branch name and verify merge is blocked

### Implementation for User Story 2

- [ ] T022 [P] [US2] Create PR quality gate workflow file at `.github/workflows/pr-quality-gate.yml` with pull_request trigger
- [ ] T023 [P] [US2] Add branch name validation job to PR workflow (must match spec/N/task/N-description format)
- [ ] T024 [P] [US2] Add deployment status check job using GitHub API to block PR if deployment in progress
- [ ] T025 [US2] Add CI workflow reuse in PR workflow to run all quality checks
- [ ] T026 [P] [US2] Add conventional commit validation job to check commit message format
- [ ] T027 [US2] Add GPG signature verification job to ensure all commits are signed
- [ ] T028 [US2] Add aggregate coverage calculation job that downloads artifacts and checks 80% threshold
- [ ] T029 [US2] Add PR comment action that posts coverage summary table to pull request
- [ ] T030 [US2] Configure GitHub branch protection rules for main branch requiring all status checks
- [ ] T031 [US2] Test PR workflow by creating a pull request and verifying all gates enforce correctly

**Checkpoint**: At this point, only quality-verified code can reach main branch

---

## Phase 5: User Story 3 - Automated Deployment on Merge (Priority: P3)

**Goal**: Deploy to production using blue-green pattern with zero downtime and automatic rollback on failure

**Independent Test**: Merge a PR to main and verify blue-green deployment executes, switching traffic only if tests pass

### Implementation for User Story 3

- [ ] T032 [US3] Create deployment workflow file at `.github/workflows/deploy-production.yml` with push to main trigger
- [ ] T033 [US3] Configure concurrency group "production-deployment" to prevent concurrent deployments
- [ ] T034 [US3] Add detect-environment job that checks nginx config to determine active Blue or Green
- [ ] T035 [US3] Add deploy-inactive job that runs on self-hosted runner, stops inactive environment, builds, and starts with PM2
- [ ] T036 [US3] Create deploy-to-green.sh script at `scripts/deployment/deploy-to-green.sh` for PM2 deployment
- [ ] T037 [P] [US3] Create switch-traffic.sh script at `scripts/deployment/switch-traffic.sh` for nginx upstream switching
- [ ] T038 [P] [US3] Create rollback-to-blue.sh script at `scripts/deployment/rollback-to-blue.sh` for emergency rollback
- [ ] T039 [US3] Add health check polling in deploy-inactive job (wait for /health endpoint with 2-minute timeout)
- [ ] T040 [US3] Create deployment state directory `/var/lib/weatherman/state/` on production server
- [ ] T041 [US3] Initialize Blue environment state file at `/var/lib/weatherman/state/blue.json` as active
- [ ] T042 [US3] Initialize Green environment state file at `/var/lib/weatherman/state/green.json` as inactive
- [ ] T043 [US3] Add deployment state update logic in deploy-inactive job to track environment status
- [ ] T044 [US3] Test deployment workflow by merging to main and verifying Blue-Green switch (manual verification required)

**Checkpoint**: At this point, merges to main automatically deploy with zero downtime

---

## Phase 6: User Story 4 - Post-Deployment Validation (Priority: P4)

**Goal**: Run comprehensive tests on Green environment before traffic switch, with automatic rollback on failure

**Independent Test**: Deploy to Green with intentionally failing test and verify traffic stays on Blue with rollback

### Implementation for User Story 4

- [ ] T045 [P] [US4] Create smoke test script at `scripts/testing/smoke-tests.sh` for 30-second health checks
- [ ] T046 [P] [US4] Create performance baseline script at `scripts/testing/performance-baseline.sh` to capture metrics
- [ ] T047 [P] [US4] Create performance comparison script at `scripts/testing/compare-performance.sh` with 20% threshold check
- [ ] T048 [US4] Create post-deployment test orchestration script at `scripts/testing/run-post-deployment-tests.sh`
- [ ] T049 [US4] Add post-deployment-tests job to deploy workflow that runs smoke, integration, and performance tests
- [ ] T050 [US4] Configure 15-minute timeout for post-deployment-tests job
- [ ] T051 [P] [US4] Create frontend post-deployment smoke tests at `packages/frontend/tests/post-deployment/smoke.test.js`
- [ ] T052 [P] [US4] Create backend post-deployment integration tests at `packages/backend/tests/post-deployment/integration.test.js`
- [ ] T053 [US4] Add switch-traffic job to deploy workflow that runs only if tests pass
- [ ] T054 [US4] Add nginx reload step in switch-traffic job with verification
- [ ] T055 [US4] Update deployment state files to mark environments active/inactive after traffic switch
- [ ] T056 [US4] Add rollback job to deploy workflow that runs on failure, stops Green, and updates state
- [ ] T057 [US4] Add GitHub deployment status creation in switch-traffic and rollback jobs
- [ ] T058 [US4] Test post-deployment validation by deploying with performance regression and verifying rollback

**Checkpoint**: All user stories should now be independently functional - full CI/CD pipeline complete

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Enhancements that improve the overall CI/CD system

- [ ] T059 [P] Add workflow status badges to README.md for CI and deployment workflows
- [ ] T060 [P] Create scheduled comprehensive test workflow at `.github/workflows/scheduled-comprehensive.yml` for nightly runs
- [ ] T061 [P] Add manual workflow dispatch triggers to all workflows for on-demand execution
- [ ] T062 [P] Create coverage trend tracking by storing historical coverage data as artifacts
- [ ] T063 [P] Add Lighthouse PWA score check to CI workflow per constitution requirement
- [ ] T064 [P] Add accessibility testing (axe-core) to CI workflow per constitution requirement
- [ ] T065 [P] Create reusable action for Node.js setup at `.github/actions/setup-node/action.yml`
- [ ] T066 [P] Create reusable action for test execution at `.github/actions/run-tests-with-coverage/action.yml`
- [ ] T067 [P] Create reusable action for coverage threshold check at `.github/actions/check-coverage-threshold/action.yml`
- [ ] T068 Update quickstart.md with actual workflow file examples and troubleshooting steps
- [ ] T069 Document self-hosted runner setup process in quickstart.md production deployment section
- [ ] T070 Add nginx configuration example to quickstart.md for Blue-Green upstream setup
- [ ] T071 Validate all workflow YAML files with GitHub Actions linter (actionlint)
- [ ] T072 Test complete CI/CD pipeline end-to-end: feature branch → PR → merge → deployment → rollback

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Foundational - No dependencies on other stories
  - User Story 2 (P2): Can start after Foundational - Uses US1 CI workflow but independently testable
  - User Story 3 (P3): Can start after Foundational - Independent blue-green infrastructure
  - User Story 4 (P4): Depends on User Story 3 completion (needs deployment workflow to exist)
- **Polish (Phase 7)**: Depends on all user stories being complete for comprehensive testing

### User Story Dependencies

- **User Story 1 (P1)** - CI on feature branches: No dependencies, foundation only
- **User Story 2 (P2)** - PR quality gates: Logically depends on US1 (reuses CI workflow) but can be developed in parallel
- **User Story 3 (P3)** - Blue-green deployment: No dependencies, independent infrastructure
- **User Story 4 (P4)** - Post-deployment validation: **BLOCKS on US3** (extends deployment workflow)

### Within Each User Story

- US1: All workflow job definitions can be written in parallel
- US2: Branch validation, deployment check, and commit validation can run in parallel
- US3: Deployment scripts can be written in parallel after workflow structure is defined
- US4: Test scripts can be written in parallel, orchestration depends on scripts

### Parallel Opportunities

**Setup Phase (T001-T005)**: All 5 tasks can run in parallel (different directories)

**Foundational Phase (T006-T012)**:
- T006-T009 can run in parallel (different config files)
- T010 runs independently
- T011-T012 can run in parallel (different PM2 configs)

**User Story 1 (T013-T021)**:
- T013-T017 can run in parallel (different job definitions in same file, but different sections)
- T014-T016 marked [P]: lint, frontend test, backend test jobs are independent
- T018-T020 are enhancements to existing jobs (sequential)

**User Story 2 (T022-T031)**:
- T023-T024, T026 marked [P]: branch validation, deployment check, commit validation are independent jobs
- T022, T025, T027-T030 are sequential workflow construction

**User Story 3 (T032-T044)**:
- T037-T038 marked [P]: traffic switch and rollback scripts are independent
- T036-T038 scripts can all be developed in parallel after workflow structure exists
- T040-T042 state file initialization can run in parallel

**User Story 4 (T045-T058)**:
- T045-T047 marked [P]: smoke, performance baseline, and comparison scripts are independent
- T051-T052 marked [P]: frontend and backend post-deployment tests are independent
- All test scripts (T045-T047, T051-T052) can be developed in parallel

**Polish Phase (T059-T072)**: All tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1 (CI Workflow)

```bash
# Launch all independent CI job definitions together:
Task T014 [P]: "Add lint job to CI workflow"
Task T015 [P]: "Add frontend test job to CI workflow"
Task T016 [P]: "Add backend test job to CI workflow"

# These jobs are defined in the same file but operate on different code
# and can be written/tested independently
```

---

## Parallel Example: User Story 4 (Post-Deployment Tests)

```bash
# Launch all test script development together:
Task T045 [P]: "Create smoke test script"
Task T046 [P]: "Create performance baseline script"
Task T047 [P]: "Create performance comparison script"
Task T051 [P]: "Create frontend post-deployment tests"
Task T052 [P]: "Create backend post-deployment tests"

# These scripts are completely independent and can be developed in parallel
```

---

## Implementation Strategy

### MVP First (User Story 1 Only - CI on Feature Branches)

1. Complete Phase 1: Setup (T001-T005) - 5 tasks
2. Complete Phase 2: Foundational (T006-T012) - 7 tasks (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (T013-T021) - 9 tasks
4. **STOP and VALIDATE**: Push to feature branch, verify CI runs, tests execute, coverage reports
5. **MVP DELIVERED**: Developers now have automated CI feedback

**Total MVP Tasks**: 21 tasks

### Incremental Delivery (Add Stories Sequentially)

1. **Foundation + US1** (21 tasks) → Developers get CI feedback
2. **Add US2** (10 tasks) → PRs now have quality gates → **Deploy to team**
3. **Add US3** (13 tasks) → Automatic deployments with blue-green → **Deploy to production**
4. **Add US4** (14 tasks) → Post-deployment validation and rollback → **Production-grade CI/CD**
5. **Add Polish** (14 tasks) → Enhanced monitoring, badges, documentation → **Complete system**

### Parallel Team Strategy

With multiple developers after Foundational phase completes:

1. **Team completes Setup + Foundational together** (12 tasks)
2. **Then split work**:
   - **Developer A**: User Story 1 (CI workflow) - 9 tasks
   - **Developer B**: User Story 2 (PR gates) + User Story 3 start - 10 + 7 tasks
   - **Developer C**: Deployment scripts for US3 - 6 tasks
3. **Developer A** helps with **User Story 4** after US3 completes - 14 tasks
4. **All developers** work on **Polish** tasks in parallel - 14 tasks

---

## Task Summary

### Total Task Count: 72 tasks

**By Phase**:
- Phase 1 (Setup): 5 tasks
- Phase 2 (Foundational): 7 tasks
- Phase 3 (US1 - CI): 9 tasks
- Phase 4 (US2 - PR Gates): 10 tasks
- Phase 5 (US3 - Deployment): 13 tasks
- Phase 6 (US4 - Post-Deploy Validation): 14 tasks
- Phase 7 (Polish): 14 tasks

**By User Story**:
- US1 (P1 - CI): 9 tasks - **MVP Core**
- US2 (P2 - PR Gates): 10 tasks
- US3 (P3 - Deployment): 13 tasks
- US4 (P4 - Validation): 14 tasks

**Parallel Opportunities**: 28 tasks marked [P] can run in parallel within their phases

**MVP Scope**: Phases 1 + 2 + 3 = 21 tasks delivers basic CI functionality

**Production-Ready**: Phases 1-6 = 58 tasks delivers complete blue-green CI/CD pipeline

### Format Validation

✅ All tasks follow checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`
✅ All user story tasks have [US1-US4] labels
✅ All parallelizable tasks marked with [P]
✅ All tasks include exact file paths
✅ Tasks organized by user story for independent implementation

---

## Notes

- **[P] tasks** = different files or independent workflow jobs, no dependencies
- **[Story] label** maps task to specific user story for traceability
- Each user story should be independently testable after its phase completes
- Commit after each task or logical group of parallel tasks
- Stop at any checkpoint to validate story independently
- **Critical Path**: Setup → Foundational → US1 → US2 → US3 → US4 (US4 blocks on US3)
- **Parallel Path**: US1 and US2 can be developed concurrently after Foundational
- **MVP Fast Track**: Complete Setup + Foundational + US1 for basic CI (21 tasks, ~2-3 days)
- **Self-Hosted Runner Setup** is a separate operational task performed by DevOps, documented in quickstart.md but not included in task list (infrastructure prerequisite)
