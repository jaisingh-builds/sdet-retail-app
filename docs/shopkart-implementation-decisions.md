# ShopKart Cohort Implementation Decisions

These decisions adapt the supplied pre-capstone brief to the UST participant environment.

| Brief area | Cohort implementation |
| --- | --- |
| Application delivery | Source is supplied on the `shopkart` branch and runs through Node.js on port 8080 |
| Participant database | Local MySQL 8.x by default; PostgreSQL 14+ is also supported through `DB_DIALECT` |
| CI isolation | MySQL 8.4 and PostgreSQL 16 Testcontainers created by the GitHub-hosted runner |
| Participant Docker requirement | None |
| Database migrations | Versioned `V1__schema.sql` and `V2__seed.sql`; applied by the included migration runner |
| Automation Java | JDK 21 recommended; another project-compatible JDK may be used after build verification |
| UI | React with stable, relative-XPath-friendly markup |
| API documentation | Local Swagger UI and committed OpenAPI YAML |
| Credentials | Passwords supplied outside Git and converted to hashes during migration |
| Secret scanning | Gitleaks runs in CI; five inactive demo fingerprints inherited from older branch history are explicitly baselined in `.gitleaksignore` |

The application deliberately does not include the six participant assessment tests. It provides the stable behavior, seed data, UI contract and API contract those tests must automate.
