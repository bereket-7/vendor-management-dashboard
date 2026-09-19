# API contracts

Frontend–backend contracts for the NestJS API paired with this starter.

| Document                                                                                     | Domain                                     |
| -------------------------------------------------------------------------------------------- | ------------------------------------------ |
| [identity-groups.md](./identity-groups.md)                                                     | Admin identity groups CRUD                 |
| [vms.md](./vms.md)                                                                             | VMS / procurement stubs                    |
| [members-360.md](./members-360.md)                                                             | Member 360 gaps                            |
| [work-queue-gaps.md](./work-queue-gaps.md)                                                     | Work queue / TPA-TPV gaps                  |
| [backend-gaps-members-providers-tpa.md](./backend-gaps-members-providers-tpa.md)               | Backend work needed by Members, Providers, TPA/TPV |

Monorepo inventory of all feature endpoints (maturity tiers, env flags, DTO summaries): [`docs/api/dashboard-endpoints.md`](../../../../docs/api/dashboard-endpoints.md).

## NestJS CORS (when backend is ready)

Configure the NestJS app to allow the Next.js frontend origin:

- **Allowed origin:** `NEXT_PUBLIC_APP_URL` (e.g. `http://localhost:3000` in dev, production URL in prod)
- **Credentials:** `true` (session cookies)
- **Methods:** `GET`, `POST`, `PATCH`, `DELETE`, `OPTIONS`
- **Headers:** `Content-Type`, `Authorization`, cookie headers as required by Better Auth

Trusted origins for Better Auth should include the same frontend URL.
