# Web Celestial Coordinate Contract

The web renderer and catalog use one canonical coordinate model from
`src/engine/celestialCoordinates.js`.

## Canonical model

- Reference frame: ICRS
- Epoch: J2000.0
- Right ascension: `raHours` and `raDegrees` are both retained
- Declination: `decDegrees`
- Physical distance: `distanceParsec`
- Cartesian axes: `x = cos(dec) cos(ra)`, `y = sin(dec)`, `z = -cos(dec) sin(ra)`
- World scale: `0.15` renderer units per parsec

The negative Z right-ascension axis matches the mobile engine. Camera zoom and
distance conversions also live in the canonical module so renderers do not
invent their own conversion constants.

## Input compatibility

Explicit fields take precedence in this order: `raDegrees`, `raHours`, then
legacy `ra`. String `ra` values are interpreted as hours. Numeric legacy values
above 24 are interpreted as degrees; values up to 24 are interpreted as hours.
New catalog and renderer code must provide an explicit field instead of relying
on that legacy heuristic.

HYG CSV right ascension is read as hours. Star assets retain the normalized
coordinate object through `StarAssetManager` and `StarRepository`; Three.js
components consume it through `starToVector3`.
