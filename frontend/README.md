# Frontend Starter

This folder is reserved for the ReactJS classroom UI.

Recommended frontend choice:

- UI library: ReactJS
- Build/dev tool: Vite
- Styling: simple app-specific CSS or a restrained component system

Vite is not a replacement for ReactJS. It is only the fast local build tool used to run and package the ReactJS app.

## Day 1 Launch

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

Day 1 automation validates:

- Browser title.
- Current URL.
- Main heading.
- Navigation landmarks.
- Screenshot capture.

Recommended first pages:

- `/login`
- `/home`
- `/products`
- `/products/:id`
- `/cart`
- `/checkout`
- `/orders`
- `/profile`
- `/admin/products`
- `/admin/orders`

Keep labels, roles, and stable `data-testid` values intentional so students can compare good and brittle locator strategies.
