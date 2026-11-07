# Bliss App backend consolidation

The deployed Node backend in `bliss_connect/backend` is the canonical API and
MongoDB destination. The Flutter app should use that backend through
`BLISS_API_BASE_URL`; it should not run a separate `bliss_app/backend` service.
The app inbox now reads conversations and messages from the canonical API, and
customer messages/replies are bridged to the staff inbox.

## Data mapping

| Bliss App source collection | Bliss Connect destination |
| --- | --- |
| `customer_accounts` | `BlissCommunicationUser` |
| `profiles` | `Candidate` |
| `conversations` | `inbox_conversations` |
| `messages` | `inbox_messages` |
| `device_tokens` | `PushToken` |

Notification history is not migrated: the old communication backend did not
persist it. Its demo dashboard values, seeded inbox conversations, and in-memory
communities, channels, calls, presence, reports, and templates are not durable
records and are not imported.

## Safe migration

Back up both databases first. Set `BLISS_APP_MONGO_URI` to the old backend's
MongoDB URI and `MONGO_URI` (or `MONGODB_URI`) to the main backend's URI in the
local environment. Do not put either URI in source control.

Run a read-only preview:

```powershell
node scripts/migrate_bliss_app_data.js
```

Review the `created`, `matched`, `skipped`, and `conflicts` counts. Accounts
with conflicting email/phone identities, invalid legacy password hashes, or
incomplete required fields are skipped rather than overwritten. Resolve those
cases before applying. To import the eligible records:

```powershell
node scripts/migrate_bliss_app_data.js --apply
```

The script uses stable source-derived IDs and upserts, so reruns do not create
duplicate imported records. It never deletes or modifies the source database.
An account's Bliss App scrypt password hash is retained in a private legacy
field; the main backend verifies it at login, upgrades it to the main bcrypt
hash after a successful login, and removes the legacy hash. Google accounts
continue using Google sign-in.

Do not retire or remove the old backend's files until the dry-run and applied
migration counts have been reviewed and the main backend has been verified
against the affected user flows.
