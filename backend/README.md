# README

This README would normally document whatever steps are necessary to get the
application up and running.

Things you may want to cover:

* Ruby version

* System dependencies

* Configuration

* Database creation

* Database initialization

* How to run the test suite

* Services (job queues, cache servers, search engines, etc.)

* Deployment instructions

* ...

## API rate limits

Rails controller limits apply across API controllers by client IP, before authentication:

- Reads (GET/HEAD): 300 per minute.
- Writes: 60 per minute, shared across POST/PATCH/PUT/DELETE.
- Login: additionally 10 attempts per 3 minutes.
- Signup: additionally 10 attempts per hour.

Rejected requests return JSON with status 429 and a conservative `Retry-After` delay
in seconds. `/up` health checks and CORS OPTIONS preflights are exempt.
Limits use Rails.cache (currently MemoryStore), so counters are per process and
reset on restarts. Multiple workers or replicas have independent counters. Use a
shared cache before relying on fleet-wide enforcement. These limits reduce API
abuse; they do not replace infrastructure-level DDoS protection.
