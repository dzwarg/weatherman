# Data Model: 004-zero-host-migration

**Spec**: 004-zero-host-migration  
**Date**: 2026-04-03

## Overview

This migration does not introduce changes to the data model. All data storage remains client-side (localStorage/IndexedDB).

## Existing Data Storage

| Storage Type | Location | Purpose |
|--------------|----------|---------|
| User Profile | localStorage | Child profile, preferences |
| Weather Cache | localStorage | Cached weather data (1hr TTL) |
| App State | React state | Session data |

## Netlify Functions

Functions are stateless compute units with no persistent storage. Any state required between requests must use:

1. **Client-side storage**: localStorage, IndexedDB (existing)
2. **External services**: Not in scope for this migration

## No New Entities

This migration does not introduce new entities or modify existing data structures.
