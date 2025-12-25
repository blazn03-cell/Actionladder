# EAS CI (short)

This repository includes a GitHub Actions workflow for Expo Application Services (EAS):

- Workflow path: `.github/workflows/eas-build.yml`
- Mobile build docs: `mobile-app/BUILD_INSTRUCTIONS_COMPLETE.md`

Quick: set `EAS_TOKEN` (and `GOOGLE_SERVICE_ACCOUNT_JSON` if using Play Console) in repository Secrets, then trigger the workflow from Actions or push a `v*` tag.
