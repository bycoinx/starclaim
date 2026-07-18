# Web Catalog and Worker Pipeline

The commercial catalog and astronomy catalog have separate repository entry
points but share normalized star coordinate contracts.

## Commercial catalog

`StarRepository.loadAll()` deduplicates concurrent full loads and commits its
cache atomically. Normalization removes duplicate identities. `CatalogProvider`
assigns a monotonically increasing request id to every query; a response can
update Zustand only while it remains the newest request.

## Astronomy catalog

`StarRepository.loadAstronomyCatalog()` lazily loads the HYG pipeline so its CSV
parser and worker do not enter the startup bundle. The loader provides:

- fetch timeout and external abort support;
- a 64 MiB response guard;
- normalized record limits from 1 to 120,000;
- a versioned and request-correlated worker protocol;
- parser timeout with guaranteed worker termination;
- row validation, duplicate removal, and parse statistics;
- canonical ICRS/J2000 coordinates;
- an embedded four-star fallback for network or parser failures.

Caller cancellation propagates as `AbortError` and never masquerades as a
successful fallback. Status callbacks distinguish fetching, parsing, ready,
and fallback stages.
