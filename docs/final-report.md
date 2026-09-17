# Final Report — SBIMS

Smart Butchery Inventory Management System
Final-year project · Supervisor: Mr. Alinani Simukanga
Team: Josiphiah Simbaya, Goodson Mwenso Jr.

> **To be completed near submission.** Skeleton below.

## 1. Introduction

_[What the system is, who it is for, what it delivers — weight-based stock, a
cashier Android app, a management web dashboard, real-time deduction, wastage
tracking, reports.]_

## 2. Tools and technologies

| Tool | Purpose |
|---|---|
| Node.js + Express | Backend framework (REST API) |
| `mysql2` | MySQL driver / query layer |
| `jsonwebtoken` + `bcrypt` | Token auth (API + dashboard), password hashing, roles |
| MySQL 8 | Database |
| HTML / CSS / JavaScript | Web dashboard (standalone, calls the API) |
| Android Studio + Java + Retrofit + Gradle | Android POS app |
| npm | Backend package management |
| Jest _(or similar)_ | Automated testing |
| Postman | API testing (collection kept in the repo) |
| Git & GitHub | Version control, issues, pull requests |
| VS Code | IDE for the backend / web |
| draw.io | Diagrams |

## 3. Architecture summary

_[One paragraph: three tiers, one Node.js/Express backend, two clients over
REST. Reference `architecture.md`.]_

## 4. Contribution table

| Member | Area | Issues | What they built | Commits |
|---|---|---|---|---|
| Goodson Mwenso Jr. | Backend | `backend` label | REST API, domain model, MySQL schema, auth, stock/sale/wastage/report logic, tests | _fill in_ |
| Josiphiah Simbaya | Web dashboard + Android app + coordination + docs | `web`, `android`, `docs` | Management dashboard, Android POS app, documentation set | _fill in_ |

_(Commit counts: `git shortlog -sn` near submission.)_

## 5. Challenges and how we handled them

_[e.g. weight-based stock and atomic deduction; concurrency on a single cut;
splitting three deliverables across two people; keeping the API contract stable
between backend and clients.]_

## 6. Conclusion

_[What was delivered against the objectives in `problem-statement.md`; what is
left for future work — barcode scanning, connected weighing scale, expiry alerts,
multi-branch.]_
