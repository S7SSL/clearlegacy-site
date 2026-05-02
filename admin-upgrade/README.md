# Admin dashboard upgrade

Drop-in replacement for `worker/src/handlers/admin.ts` plus a small addition
to `worker/src/kv.ts`. Ships three improvements in one push:

1. **Visual polish** — topbar, stats strip (leads / paid-this-month / revenue /
   ready / failed), colored status badges, hover rows, clustered action
   buttons, flash banners after actions.
2. **Delete** — new `POST /admin/delete?ref=X` permanently removes a lead
   record from KV *and* deletes the associated PDF from R2. Two-step
   confirmation on the client.
3. **Amend & Regenerate** — new `GET /admin/amend?ref=X` renders the
   questionnaire as pretty-printed JSON in a textarea with client-side
   parse validation. `POST /admin/amend?ref=X` persists the edit and
   optionally re-renders the PDF + re-emails the customer. Replaces the
   manual `wrangler kv get/put` dance.

## Files

- `admin.ts.new` — replaces `worker/src/handlers/admin.ts` (whole file)
- `kv.ts.patch` — appends `deleteLead()` to `worker/src/kv.ts`
- `apply.sh` — applies both changes, with .bak backups
- `restore.sh` — rolls back using the .bak files

## To apply

```
cd clearlegacy-site
bash admin-upgrade/apply.sh
git diff worker/src/handlers/admin.ts worker/src/kv.ts   # eyeball
cd worker && npx wrangler deploy
```

Then visit https://api.clearlegacy.co.uk/admin — you should see the new
topbar, stats strip, and per-row **Amend** / **Delete** buttons.

## To roll back

```
bash admin-upgrade/restore.sh
cd worker && npx wrangler deploy
```

## What didn't change

- Routing in `worker/src/index.ts` (already wildcards `/admin/*`)
- Auth (`ADMIN_PASSWORD` Basic Auth — same as before)
- Data schemas (`types.ts`)
- Any customer-facing flow

## Post-apply checklist

- [ ] Dashboard loads at `/admin` with no console errors
- [ ] Amend button on Samara's row → shows her questionnaire JSON
- [ ] Save & Regenerate triggers a fresh email within ~20s
- [ ] Delete button shows two confirm dialogs; bogus test record nukes cleanly
- [ ] (Later) rotate `ADMIN_PASSWORD` from dev placeholder `test-admin-pass-26-04`
