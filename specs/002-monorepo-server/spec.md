# Feature Specification: Monorepo Architecture with Server Component

**Feature Branch**: `002-monorepo-server` \
**Created**: 2025-12-19 \
**Status**: Approved \
**Testing Required**: Yes - All server endpoints and services must have integration and unit tests \
**Input**: User description: "Modify this single app to a monorepo structure, and add a second package to the monorepo which will be a server component. The server component will manage the proxying to the weather service, and proxying to a local service for clothing predictions, based on user profile and weather condations. Update the front end app to call the local service for clothing predictions, instead of returning fixed clothing options."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Backend Weather Proxying (Priority: P1)

The frontend application requests weather data through the server component instead of calling the weather API directly. The server component acts as a proxy, handling API credentials securely and managing rate limiting.

**Why this priority**: This establishes the core server infrastructure and removes API credential exposure from the frontend. It's the foundation for all server-based functionality and must work before any other server features can be added.

**Independent Test**: Can be fully tested by making a weather request from the frontend, which routes through the server proxy to the weather API and returns the same weather data format the frontend currently expects. Delivers immediate security value by removing API keys from the frontend bundle.

**Acceptance Scenarios**:

1. **Given** the frontend needs current weather data, **When** it requests weather for a location, **Then** the server receives the request, calls the weather API with stored credentials, and returns weather data to the frontend
2. **Given** multiple rapid weather requests occur, **When** the server processes them, **Then** the server properly manages rate limiting to stay within weather API limits
3. **Given** the weather API returns an error, **When** the server receives it, **Then** the server forwards an appropriate error response to the frontend
4. **Given** the weather API is unavailable, **When** the server attempts to connect, **Then** the server returns a timeout error to the frontend within 5 seconds

---

### User Story 2 - Dynamic Clothing Recommendations Service (Priority: P2)

The server component hosts a clothing recommendation service that generates personalized outfit suggestions based on user profile data, current weather conditions, and the user's voice prompt context, replacing the hardcoded recommendations in the frontend.

**Why this priority**: This is the key value-add of the server component, providing intelligent, personalized recommendations. Depends on P1 infrastructure but delivers the main business value of dynamic, context-aware recommendations.

**Independent Test**: Can be tested by sending a request with user profile (age, gender), weather data (temperature, precipitation, wind), and optional user prompt (captured voice input) to the server's recommendation endpoint and receiving back a customized clothing recommendation that differs based on all inputs including contextual clues from the prompt.

**Acceptance Scenarios**:

1. **Given** the frontend has weather data and user profile, **When** it requests clothing recommendations from the server, **Then** the server analyzes both inputs and returns age-appropriate, weather-suitable clothing suggestions
2. **Given** the same weather conditions with different profiles, **When** requesting recommendations, **Then** the server returns noticeably different recommendations tailored to each profile's age and gender characteristics
3. **Given** a user says "What should I wear to the playground today?", **When** the frontend sends this prompt along with profile and weather data, **Then** the server tailors recommendations for active outdoor play (e.g., sneakers instead of dress shoes, comfortable clothes)
4. **Given** a user says "I'm going to a birthday party", **When** the frontend sends this prompt with weather data, **Then** the server suggests more presentable clothing appropriate for the occasion while still considering weather
5. **Given** a user provides a vague prompt like "What should I wear?", **When** the server receives it, **Then** the server generates general recommendations based on weather and profile without specific activity context

---

### User Story 3 - Monorepo Package Management (Priority: P3)

The codebase is structured as a monorepo with separate packages for the frontend application and server component, allowing independent development, testing, and deployment while sharing common code and configurations.

**Why this priority**: This is the structural foundation that enables the other stories, but provides minimal direct user value. It's critical infrastructure but the user doesn't experience it directly.

**Independent Test**: Can be tested by running frontend and server packages independently with their own development commands, verifying shared code is accessible to both packages, and confirming that changes to one package don't require rebuilding the other unless shared code changes.

**Acceptance Scenarios**:

1. **Given** a developer clones the repository, **When** they run the root install command, **Then** dependencies for both frontend and server packages are installed correctly
2. **Given** the monorepo structure is set up, **When** starting the frontend package, **Then** it runs independently on its own port without requiring the server to be running (for development purposes)
3. **Given** the monorepo structure is set up, **When** starting the server package, **Then** it runs independently and can be tested via direct API calls
4. **Given** shared code exists in a common package, **When** either frontend or server imports it, **Then** the code is accessible without duplication

---

### Edge Cases

- What happens when the server component is down but the frontend is running?
- How does the system handle network connectivity issues between frontend and server?
- What happens when the clothing recommendation service takes longer than expected to respond?
- How does the system behave during server deployment when the server is temporarily unavailable?
- What happens if the server and frontend are running different versions of shared code?
- How does the system handle concurrent requests from multiple frontend users?
- What happens when the weather API rate limit is exceeded at the server level?
- How does the system respond when user profile data is missing or incomplete in the recommendation request?
- What happens if the frontend caches old weather data but the server has newer data?
- How does the system handle unclear or ambiguous voice prompts (e.g., "I need clothes")?
- What happens when the user prompt contains context that contradicts weather conditions (e.g., "beach day" when it's snowing)?
- How does the system respond when no voice prompt is provided (user just wants general recommendations)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST restructure the codebase into a monorepo with separate packages for frontend and server
- **FR-002**: Server component MUST provide an endpoint for proxying weather API requests from the frontend
- **FR-003**: Server component MUST store weather API credentials securely on the server side
- **FR-004**: Server component MUST handle weather API authentication when making proxied requests
- **FR-005**: Frontend MUST send weather requests to the server component instead of directly to the weather API
- **FR-006**: Server component MUST return weather data in the same format the frontend currently expects
- **FR-007**: Server component MUST provide an endpoint for generating clothing recommendations based on user profile, weather data, and optional voice prompt
- **FR-008**: Frontend MUST send user profile, weather data, and captured voice prompt to the server's recommendation endpoint
- **FR-009**: Server recommendation service MUST generate age-appropriate clothing suggestions based on user profile age
- **FR-010**: Server recommendation service MUST generate gender-specific clothing suggestions based on user profile gender
- **FR-011**: Server recommendation service MUST consider temperature data when generating recommendations
- **FR-012**: Server recommendation service MUST consider precipitation data when generating recommendations
- **FR-013**: Server recommendation service MUST consider wind conditions when generating recommendations
- **FR-014**: Server recommendation service MUST analyze voice prompt for contextual clues (activities, occasions, locations) to tailor recommendations
- **FR-015**: Server recommendation service MUST handle missing or empty voice prompts gracefully by generating general recommendations
- **FR-016**: Frontend MUST remove hardcoded clothing recommendation logic and use server responses instead
- **FR-017**: Server component MUST handle errors from the weather API and return appropriate error responses
- **FR-018**: Server component MUST implement timeout handling for weather API requests (5 second maximum)
- **FR-019**: Server component MUST implement rate limiting to prevent exceeding weather API quotas
- **FR-020**: Monorepo MUST allow independent installation of dependencies for each package
- **FR-021**: Monorepo MUST allow independent development and testing of each package
- **FR-022**: Monorepo MUST support running both frontend and server simultaneously for full-stack development
- **FR-023**: Server component MUST validate incoming request data before processing

### Testing Requirements

- **TR-001**: All server API endpoints MUST have integration tests using Supertest to verify request/response contracts
- **TR-002**: Weather proxy service MUST have unit tests covering successful responses, error handling, timeout scenarios, and rate limiting
- **TR-003**: Recommendation service MUST have unit tests covering all user profiles, weather conditions, and voice prompt scenarios
- **TR-004**: Ollama service MUST have unit tests with mocked responses to verify prompt generation and response parsing
- **TR-005**: Request validators MUST have unit tests verifying validation logic for valid and invalid inputs
- **TR-006**: Integration tests MUST verify frontend-to-server communication for both weather and recommendation endpoints
- **TR-007**: Frontend services MUST have updated tests to work with server API instead of direct API calls
- **TR-008**: End-to-end test MUST verify complete workflow: voice input → frontend → server → Ollama/fallback → response → voice output
- **TR-009**: Tests MUST verify graceful fallback when Ollama service is unavailable
- **TR-010**: Tests MUST verify offline functionality with Service Worker caching of server responses

### Key Entities

- **Monorepo Structure**: Workspace containing multiple packages (frontend, server) with shared configurations and dependencies, organized under a common root with package management
- **Server Component**: Backend service providing API endpoints for weather proxying and clothing recommendations, handling API credentials, business logic, and data processing
- **Weather Proxy Endpoint**: Server API endpoint accepting location data from frontend, calling weather API with server credentials, and returning weather data in frontend-compatible format
- **Clothing Recommendation Endpoint**: Server API endpoint accepting user profile (age, gender), weather conditions (temperature, precipitation, wind), and optional voice prompt context, generating personalized clothing suggestions using recommendation logic, and returning structured recommendation data
- **Frontend Package**: Client-side React application making requests to server endpoints instead of external APIs, capturing voice prompts, displaying recommendations received from server
- **User Profile Data**: Request payload containing age and gender information sent from frontend to server for personalized recommendations
- **Voice Prompt Context**: User's captured voice input (e.g., "What should I wear to the playground?") sent from frontend to server, analyzed for contextual clues about activities, occasions, or locations to tailor recommendations beyond just weather conditions
- **Weather Data Payload**: Structured data exchanged between components containing temperature, precipitation, wind, and conditions

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Frontend receives weather data through server proxy with no increase in response time compared to direct API calls (excluding network overhead between frontend and server)
- **SC-002**: Clothing recommendations from server differ appropriately based on different user profiles with same weather conditions 100% of the time
- **SC-003**: Server component handles 100 concurrent requests without degradation in response time
- **SC-004**: Server properly enforces weather API rate limits preventing any quota overages
- **SC-005**: Frontend receives clothing recommendations from server in under 2 seconds
- **SC-006**: Weather API credentials are never exposed in frontend code or network requests visible to users
- **SC-007**: Developers can start frontend and server packages independently with single commands
- **SC-008**: Clothing recommendations from server are measurably more varied and contextually appropriate than previous hardcoded recommendations (validated through test cases)

## Assumptions

- The existing frontend application structure will remain largely unchanged except for API call modifications
- The server component will run as a separate process, typically on localhost during development
- Weather API credentials are available for server-side configuration
- The clothing recommendation algorithm will use an external AI service
- Both frontend and server will be deployed to environments where they can communicate over HTTP
- The monorepo will use npm workspaces for workspace management
- The server component will be stateless and not require a database for initial implementation
- CORS configuration will be handled appropriately for frontend-server communication
- The same Node.js version can be used for both frontend build tooling and server runtime
- Rate limiting can be implemented with simple in-memory counters (no distributed rate limiting needed initially)
- User profile data structure will remain consistent with existing frontend implementation
- Weather data format from the current API will remain stable or the server can adapt to changes without frontend modifications
- The frontend will make authenticated requests to the server (if authentication is added later)

## Scope

### In Scope

- Converting single-app structure to monorepo with separate frontend and server packages
- Creating server component with Express or similar framework
- Implementing weather API proxy endpoint on server
- Moving weather API credentials from frontend to server
- Implementing clothing recommendation service on server
- Creating recommendation endpoint that accepts profile and weather data
- Updating frontend to call server endpoints instead of weather API directly
- Updating frontend to request clothing recommendations from server
- Removing hardcoded clothing recommendation logic from frontend
- Basic error handling and timeout management in server component
- Rate limiting for weather API calls at server level
- Development workflow setup for running both packages

### Out of Scope

- Database integration for storing recommendations or user data
- User authentication or authorization between frontend and server
- Caching layer for weather data (beyond existing frontend caching)
- Advanced machine learning models for clothing recommendations
- Server deployment configuration or infrastructure as code
- Load balancing or horizontal scaling of server component
- Monitoring, logging, or observability infrastructure
- API versioning or backward compatibility strategies
- GraphQL or advanced API patterns (REST endpoints sufficient)
- Server-side rendering of React application
- Real-time communication (WebSockets, Server-Sent Events)
- Recommendation personalization based on user history
- A/B testing framework for recommendation algorithms
- Shared component library between frontend and server (beyond utility functions)
- Automated deployment pipelines
- Multi-region or CDN deployment strategies

## Dependencies

- npm workspaces for monorepo management (built into npm 7+)
- Server framework (Express.js or similar Node.js HTTP framework)
- HTTP client library for server-to-weather-API communication
- Existing weather API access and credentials
- CORS handling middleware for server
- Request validation library for server endpoints
- The existing frontend React application and its dependencies
- Node.js runtime environment compatible with both frontend build tools and server

## Constraints

- Server component adds network latency between frontend and weather API (frontend → server → weather API instead of frontend → weather API)
- Monorepo structure may increase initial repository complexity for new developers
- Server component becomes a single point of failure for both weather data and recommendations
- Rate limiting must balance between responsive user experience and API quota management
- Clothing recommendation logic must be maintainable without data science expertise
- Server component must handle the same load as the frontend without becoming a bottleneck
- Changes to weather API format require server updates but should not require frontend changes
- Development workflow requires running both frontend and server processes simultaneously
