# Intact re-upload requirements

The next archive must retain directory paths and must not include build caches or dependency folders.

From the parent directory of the repository:

```bash
zip -r nagarik-watch-intact.zip nagarik-watch \
  -x '*/node_modules/*' '*/.next/*' '*/.turbo/*' '*/dist/*' '*/coverage/*' '*/.git/*'
```

Validate before upload:

```bash
unzip -t nagarik-watch-intact.zip
unzip -l nagarik-watch-intact.zip | head -50
```

The listing must contain paths similar to:

```text
nagarik-watch/apps/web/lib/auth/index.ts
nagarik-watch/apps/web/app/[locale]/layout.tsx
nagarik-watch/apps/web/app/[locale]/page.tsx
nagarik-watch/apps/web/app/api/auth/[...all]/route.ts
nagarik-watch/apps/admin/src/payload.config.ts
```

Do not use a file manager action that selects every file inside the repository and then compresses them without the parent folder; that is how directory information is lost.
