# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Status

This is a new/empty repository named "weatherman" with no existing codebase or configuration files yet.

## Getting Started

When initializing this repository, consider adding:
- A README.md describing the project's purpose
- package.json (if Node.js/JavaScript project) or equivalent for other languages
- .gitignore file appropriate for the technology stack
- License file if open source
- Basic project structure and entry points

## Product Details

Refer to './docs/product-details.md' for comprehensive information about the Weatherman application, including its features.

When implementing features or fixing issues, ensure alignment with the product overview and update documentation to align with code when necessary.

## Technical Details

Refer to './docs/technical-details.md' for technical considerations, including mobile-first design and weather API integration.

When writing code, ensure adherence to best practices for progressive web applications (PWAs) and voice recognition technologies as described in the documentation. Update the documentation to align with code as necessary.

## Active Technologies
- JavaScript (ES2022+) with React 22+, Node 22+ (001-voice-weather-clothing)
- JavaScript ES2022+ with Node 22+ (002-monorepo-server)
- JavaScript (ES2022+), Node.js 22+ + GitHub Actions, PM2 (cluster mode), Vitest, ESLint, Coverage tools (c8/istanbul) (003-automated-build-test)
- GitHub Actions artifacts/logs (90-day retention), PM2 process state files (003-automated-build-test)

## Recent Changes
- 001-voice-weather-clothing: Added JavaScript (ES2022+) with React 22+, Node 22+

## Development Guidelines

**EVERY** code change to this repository **MUST** follow the guidelines in './docs/workflow.md' for source hygiene, including testing, committing, and code review.
