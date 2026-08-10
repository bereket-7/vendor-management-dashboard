# Tilla VMS — Product information architecture

Dual-sided enterprise procurement Vendor Management System.

## Audiences

| Side          | Base path | Roles                                                                     |
| ------------- | --------- | ------------------------------------------------------------------------- |
| Buyer admin   | `/admin`  | admin, procurement_manager, buyer, ap_finance, compliance_officer, viewer |
| Vendor portal | `/vendor` | vendor_admin, vendor_bidder, vendor_finance, vendor_viewer                |

Post-login: vendor roles → `/vendor`, otherwise → `/admin`.

Dev overrides:

- `NEXT_PUBLIC_DEV_ADMIN=true` — buyer admin ABAC
- `NEXT_PUBLIC_DEV_VENDOR=true` — vendor portal ABAC (takes precedence)
- `NEXT_PUBLIC_USE_MOCK` — defaults on unless set to `"false"`

## Buyer navigation

- **Overview:** Dashboard
- **Procurement:** Vendors, Onboarding, Categories, Sourcing
- **Governance:** Contracts, Documents, Compliance, Performance
- **Finance:** Purchase orders, Invoices, Approvals, Reports
- **System:** Users, Roles, Groups, Settings

## Vendor navigation

- **Overview:** Dashboard
- **Company:** Profile, Onboarding, Documents, Team
- **Commerce:** Opportunities, Contracts, Purchase orders, Invoices, Notifications

## Lifecycle

`invite → onboard → qualify → active → (RFX → contract → PO → invoice) → scorecard`

## Module layout

```
src/features/admin/features/{dashboard,vendors,onboarding,...}/
src/features/vendor/features/{dashboard,profile,...}/
src/features/shared/vms/   # types, mock-store, api, queries, StatusBadge
```

See [api-contracts/vms.md](./api-contracts/vms.md) for NestJS cutover contracts.
