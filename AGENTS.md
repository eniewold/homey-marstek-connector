# Agent Instructions

## Scope
These instructions apply to the entire repository.

## Project Overview
- This project is a Homey app (SDK v3) that connects to Marstek Venus battery systems through local UDP APIs and cloud endpoints.
- The entry point is `app.js`; device-specific logic lives under `drivers/`; shared helpers are inside `lib/`; translations and capability labels reside in `locales/`.
- App metadata, flow cards, and capability definitions are maintained in `.homeycompose`, do not apply these definitions in `app.json` since those definitions are populated here during build.

## Tooling & Environment
- Use Node.js 16+ when running tooling locally (matches Homey CLI requirements and Athom lint rules).
- Install dependencies with `npm install`. Do not upgrade dependency versions unless the task requires it.
- Run `npm run lint` before submitting changes to ensure ESLint (Athom config) passes.
- When building the Homey app, use `homey run build` and `homey run validate` to check for problems.
- When working on Homey-specific functionality, prefer using the Homey CLI (`homey app run --remote`) if available in your environment (requires docker).
- Publishing to the Homey App store is done through the `homey run publish` command; note that this requires some user interaction and is not suitable for automation.

## Coding Standards
- Use modern JavaScript (ES2019+) syntax that is compatible with Homey SDK v3.
- Use CommonJS standard for Javascript modules and definities.
- When adding comments to any source code files, format them using valid JSDoc syntax.
- Keep logging concise; prefer Homey's logging facilities where available and guard verbose logging behind debug flags/settings.
- Preserve existing asynchronous patterns—await promises and avoid blocking I/O in the app lifecycle methods.

## File & Directory Guidelines
- `app.json`: Keep versioning consistent. If you change user-facing behavior, consider whether the version number should be incremented and whether release notes (README) need updates.
- `locales/`: Add or update translation keys in every available language file when introducing new user-facing strings. Keys should remain consistent across languages (see https://apps.developer.homey.app/the-basics/app/internationalization)
- `drivers/*`: Driver modules should export Homey driver/device classes with clear separation between pairing logic and runtime device behavior.
- `lib/`: Shared utilities should remain side-effect free. Document exported functions with JSDoc and keep them reusable across drivers.
- `assets/`: Optimize images before replacing them and maintain original dimensions and file types referenced in configuration files.
- `.homeycompose/`: Contains metadata, flow, capabilities for devices and drivers.

## Documentation Expectations
- Update `README.md` when altering setup steps, features, or prerequisites.
- Note significant behavioral changes in `readme.txt` or other user-facing docs if applicable.

## Testing & Validation
- At minimum, run `npm run lint` for JavaScript changes. Include additional relevant Homey CLI validation commands when possible.
- Manual validation of device pairing or capability behavior should be described in PR notes when automated tests are not feasible.

## Git & PR Guidance
- Write descriptive commit messages summarizing the change.
- Keep diffs focused; prefer multiple commits if you touch unrelated areas.
- Ensure all instructions above are satisfied before marking work as complete.