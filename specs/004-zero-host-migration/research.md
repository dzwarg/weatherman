# Research: Zero-Host Cloud Hosting Providers

**Date**: 2026-04-03
**Spec**: 004-zero-host-migration

---

## Research Objective

Identify zero-host (free tier) hosting providers that support:
1. Static site hosting (for React PWA frontend)
2. Serverless functions or equivalent backend compute (for Express.js API)

---

## Provider Comparison

### Vercel

| Aspect | Details |
|--------|---------|
| **Static Hosting** | Unlimited sites, 100GB bandwidth/month |
| **Serverless Functions** | ✅ Serverless + Edge Functions |
| **Free Tier Limits** | 100 hours serverless execution/month, 10s timeout per function |
| **Best For** | Next.js/React projects |

**Pros**:
- Zero-config deployment
- Excellent Next.js/React support
- Built-in image optimization
- Instant rollbacks

**Cons**:
- Serverless execution time limits (10s free, 60s pro)
- 100 hours/month can fill quickly with API calls

---

### Netlify

| Aspect | Details |
|--------|---------|
| **Static Hosting** | Unlimited sites, 100GB bandwidth/month |
| **Serverless Functions** | ✅ Netlify Functions + Edge Functions |
| **Free Tier Limits** | 300 build mins, 125K function calls/month |
| **Best For** | Jamstack sites (Gatsby, Hugo, Astro, React) |

**Pros**:
- Git-connected deploys
- Built-in forms, identity, edge middleware
- Generous function call limits
- Excellent developer experience

**Cons**:
- Cold start latency on serverless functions
- Limited execution time on free tier

---

### Cloudflare Pages + Workers

| Aspect | Details |
|--------|---------|
| **Static Hosting** | 500 builds/month, unlimited bandwidth |
| **Serverless Functions** | ✅ Cloudflare Workers (edge compute) |
| **Free Tier Limits** | 100K requests/day to Workers |
| **Best For** | Performance-critical, API-heavy apps |

**Pros**:
- No time-based limits (requests only)
- Edge execution (near-instant cold starts)
- Global CDN with 200+ data centers
- Durable Objects for stateful edge computing

**Cons**:
- Workers use JavaScript/Rust (not Node.js)
- Express.js adaptation required (use Hono or Fastify instead)
- Some Node.js APIs not available

---

### Render

| Aspect | Details |
|--------|---------|
| **Static Hosting** | ✅ Free static site hosting |
| **Serverless Functions** | ⚠️ Web Services only (not true serverless) |
| **Free Tier Limits** | Services sleep after 15 min inactivity |
| **Best For** | Traditional web apps |

**Pros**:
- PostgreSQL databases available free
- Simple Node.js deployment

**Cons**:
- Sleep after 15 min (not suitable for API)
- No true serverless functions

---

## Decision: Recommended Provider

### **Primary Recommendation: Netlify**

**Rationale**:
1. Best fit for existing React PWA (Vite-based)
2. Netlify Functions support Node.js/Express.js with minimal adaptation
3. Generous free tier (125K function calls/month)
4. Built-in CI/CD from GitHub/GitLab
5. Excellent DX with instant preview deploys

### **Alternative: Cloudflare (for scale/performance)**

If performance is critical:
- Migrate Express.js to Hono.js or Fastify (for Workers compatibility)
- Use Cloudflare Workers for edge compute
- Pages for static hosting

**Trade-off**: Requires code changes to backend.

---

## Migration Strategy by Provider

### Netlify Migration Path

1. **Frontend**: Connect GitHub repo → Netlify detects Vite → Auto-deploy
2. **Backend**: Convert Express routes to Netlify Functions (`/netlify/functions/*.js`)
3. **Environment**: Use Netlify environment variables
4. **CI/CD**: Built-in (no additional configuration)

### Cloudflare Migration Path

1. **Frontend**: Connect GitHub repo → Cloudflare Pages auto-deploys
2. **Backend**: Rewrite Express → Hono.js or adapt for Workers
3. **Environment**: Use Cloudflare Workers secrets
4. **CI/CD**: GitHub Actions with Wrangler CLI

---

## Alternatives Considered

| Provider | Reason Not Selected |
|----------|---------------------|
| Vercel | Good option, but Netlify's function call limits are more generous |
| Render | Sleep mode makes it unsuitable for API backend |
| Firebase | More complex setup, Google-centric |
| AWS Amplify | Steeper learning curve, more configuration |
| Heroku | Free tier discontinued in late 2022 |

---

## Open Questions

- [ ] Does the Express.js server use any Node.js APIs incompatible with Workers?
- [ ] What are the peak API call volumes? (to validate 125K/month limit)
- [ ] Are there any required environment variables or secrets?
- [ ] Custom domain requirements?

---

## Next Steps

1. Review Express.js server for Node.js compatibility
2. Estimate API call volumes for function limits
3. Select Netlify or Cloudflare based on findings
4. Draft adaptation strategy for chosen provider
