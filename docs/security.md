# Security

## Credentials and identity

PostgreSQL credentials are serialized and encrypted with Fernet authenticated encryption using backend-only `CONNECTION_ENCRYPTION_KEY`. Responses contain only host, database, username, SSL mode, and status; passwords, decrypted configuration, and raw URLs are never returned or logged. Deletion cascades catalog snapshots, drafts, and BYOD history and explicitly removes connection-keyed verified examples. Audit records retain only identifiers and safe status metadata.

Application encryption is not an enterprise vault. The entire dataset must be re-encrypted to rotate the key; losing the key makes credentials unrecoverable. Mature deployments should use a managed secret store/KMS. `AUTH_SIGNING_KEY` signs browser-bound anonymous workspace sessions. These sessions are not account authentication, recovery, organization membership, MFA, or revocation infrastructure; use an external identity provider for a true multi-user deployment.

## Network and SSRF controls

Only PostgreSQL on port 5432 is accepted. DNS and literal IPs are checked at validation and again immediately before connection. Unless `ALLOW_PRIVATE_DATABASE_HOSTS=true`, localhost, loopback, RFC1918, IPv6 private/loopback, link-local (including `169.254.169.254`), reserved, multicast, and unspecified addresses are rejected. Connections use short timeouts and SSL modes `require`, `verify-ca`, or `verify-full`.

DNS rebinding and provider/network behavior can still create residual risk because the database driver resolves the hostname after the application check. Production platforms should additionally restrict outbound network policy. Render can reach only public databases in the supported configuration; database providers may require allow-listing Render outbound IPs, which can depend on the Render plan. Localhost and private VPC databases are unsupported.

## SQL and data exposure

Generated SQL is untrusted. QueryMindAI enforces one PostgreSQL SELECT or WITH…SELECT, rejects comments, additional statements, DDL/DML/COPY/admin commands and selected unsafe functions, checks parsed table references against the saved catalog, caps SQL length and LIMIT, and never executes during generation. Approval executes the exact server-stored draft only after revalidation, in `SET TRANSACTION READ ONLY` with a local statement timeout and rollback. A dedicated database role remains the primary boundary.

Read-only detection checks direct table grants and `default_transaction_read_only`, but inherited roles and unusual privilege arrangements prevent a guarantee. An inconclusive result produces a warning. Prompts contain bounded schema names/types/relationships and may include verified SQL examples; they never contain credentials or row data. Results are returned to the browser but not persisted in history.

Current limitations: no rate limiting, account authentication, enterprise vault, private network connector, SSH/VPN, row/column policy engine, guaranteed DNS pinning, or guaranteed read-only detection.

## Private database roadmap

Planned, not implemented: `Customer Database → QueryMind Connector running inside customer network → outbound TLS connection → QueryMindAI Cloud`. This would avoid publicly exposing a database. No customer-side connector exists in this branch.
