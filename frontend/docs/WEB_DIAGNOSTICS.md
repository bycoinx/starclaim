# Web Engine Diagnostics Contract

The web rendering stack emits one privacy-safe event stream through `webDiagnostics`.
It covers renderer lifecycle, sampled telemetry, recovery decisions, performance profile
changes, catalog/worker stages, and runtime errors.

## Safety boundaries

- The in-memory buffer keeps at most 200 events.
- Telemetry is sampled every 15 seconds; quality or heap-pressure changes are immediate.
- Events use explicit field allowlists. Star rows, search input, URLs, tokens, user data,
  and error stacks are not retained.
- Transport and subscriber failures cannot stop rendering or recovery.
- Sentry receives non-error events as breadcrumbs and engine errors as exceptions.

## Access

`webDiagnostics.getEvents()` returns the bounded event list. It accepts optional `type`
and `limit` filters. `subscribe(listener)` supports temporary development tooling, while
`clear()` resets the local buffer and sampling state.
