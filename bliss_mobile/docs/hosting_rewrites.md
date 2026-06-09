Hosting rewrite rules to support path-based deep links (/candidate-form)

Netlify

Add a `_redirects` file in the `build/web` (or publish) folder:

```
/*    /index.html   200
```

Or in `netlify.toml`:

```
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  force = true
```

Render (Static Sites)

In Render static site settings use the "Redirects" file or add a `render.yaml` with a rewrite rule, or configure the service to serve `index.html` for unknown paths. Example `render.yaml` snippet:

```
services:
  - type: static
    name: frontend
    staticPublishPath: build/web
    routes:
      - type: rewrite
        source: "/(.*)"
        destination: "/index.html"
```

Firebase Hosting

In `firebase.json`:

```
"hosting": {
  "public": "build/web",
  "rewrites": [
    {
      "source": "**",
      "destination": "/index.html"
    }
  ]
}
```

Vercel

Add a `vercel.json`:

```
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Cloudflare Pages

Add `_redirects` file same as Netlify or use `workers` to rewrite to index.html. Example `_redirects`:

```
/*    /index.html   200
```

Checks to run

- Visit `https://<your-frontend>/candidate-form?candidateId=TEST` in a browser — it should return your `index.html` and the app should parse `candidateId` from query params.
- Confirm `build/web/main.dart.js` contains `/candidate-form` route (app compiled routes). This repo already contains that.

If you'd like, I can add an automated check script that requests the frontend path and verifies `index.html` is served (already performed once).