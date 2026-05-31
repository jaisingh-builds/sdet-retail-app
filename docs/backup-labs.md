# UST Global SDET Training Backup Labs

Use these public demo applications only as supplementary labs or backups. The primary course platform should remain **SDET Retail Automation Lab**.

## Backup App Matrix

| App | Best Use | Notes |
| --- | --- | --- |
| Sauce Labs Sample App | UI automation practice | Good for product listing, cart, and checkout-style UI flows. |
| Automation Exercise | UI and API practice | Useful for homework and mixed UI/API assignments. |
| ParaBank | Banking workflow comparison | Good for alternate business-domain practice after students know the retail app. |
| The Internet | Component-level Selenium/Playwright practice | Best for isolated components such as upload, auth, dropdowns, dynamic loading, and broken images. |
| Restful Booker | Standalone API testing | Good for request chaining, auth tokens, CRUD, and schema validation. |
| OWASP Juice Shop | Security testing only | Use during security-focused sessions, not as a general SDET app. |

## When To Use Backups

- The classroom environment cannot run Docker or local Node services.
- Students need additional homework outside the controlled app.
- A topic needs a very focused public example.
- The class needs comparison between domains such as retail and banking.
- Security testing needs a deliberately vulnerable application.

## Suggested Backup Usage By Week

| Week | Backup Option | Purpose |
| --- | --- | --- |
| Week 1 | The Internet, Sauce Labs Sample App | Locator practice, waits, forms, screenshots. |
| Week 2 | Restful Booker, Automation Exercise APIs | API basics, auth, JSON validation, CRUD. |
| Week 3 | The Internet, ParaBank | Selenium waits, Page Object Model, alternate workflows. |
| Week 4 | Restful Booker, local WireMock | Mocking and API behavior comparison. |
| Week 5 | The Internet | Debugging dynamic loading, broken images, auth, and flaky-looking components. |
| Week 6 | Sauce Labs Sample App | Framework maturity against a public UI target. |
| Week 7 | Avoid backups unless needed | Capstone should use the controlled retail app. |

## Trainer Decision Rules

- Do not make public apps mandatory for the final capstone.
- Do not depend on public apps for assessment-critical demos.
- Keep backup labs short and topic-specific.
- Prepare screenshots or recorded fallback evidence for important demos.
- Always tell students which app is primary and which app is only extra practice.

## Backup Lab Ideas

### The Internet

- Checkboxes and dropdowns: basic locators and assertions.
- File upload: profile upload practice comparison.
- Dynamic loading: explicit waits and timeout handling.
- Basic auth: browser context and credential handling.
- Broken images: visual and DOM-level validation.

### Restful Booker

- Create booking.
- Authenticate.
- Update booking.
- Fetch booking by ID.
- Delete booking.
- Validate negative scenarios for missing auth and invalid payloads.

### ParaBank

- Register/login.
- Open account.
- Transfer funds.
- Pay bill.
- Validate transaction history.

### Automation Exercise

- Register user.
- Search product.
- Add to cart.
- Checkout-style flow.
- Use API list for standalone API exercises.

### OWASP Juice Shop

- Run only in a controlled security-testing session.
- Cover passive observation, safe vulnerability discovery, and secure defect reporting.
- Avoid turning it into the main UI/API automation target.

## Backup Communication Template

Use this message when switching to a public backup:

```text
Today we are using a public demo application only for extra practice on this topic.
The main project and capstone remain on SDET Retail Automation Lab.
If this public app changes or becomes unavailable, use the provided screenshots and the local retail app equivalent.
```
