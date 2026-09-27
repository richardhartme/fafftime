# Testing Guide

This project uses **Vitest** with a **jsdom** environment. Tests are written in TypeScript and live next to the code they cover.

## Running Tests

```bash
npm test                # Run the suite (watches for changes in an interactive terminal)
npm run test:watch      # Explicit watch mode
npm run test:coverage   # Run with V8 coverage; reports are written to coverage/
npm run test:ui         # Open the Vitest UI (requires @vitest/ui, which is not installed by default)
```

To run a single file or filter by test name:

```bash
npx vitest run src/core/data-analyzer.test.ts
npx vitest run -t "findTimestampGaps"
```

## Test Structure

Tests are colocated with their source files and picked up by the `src/**/*.test.ts` pattern in `vitest.config.js`:

| Test file | Covers |
| --- | --- |
| `src/main.test.ts` | The exported analysis API in `src/main.ts` (timestamp gaps, slow periods, formatting helpers) |
| `src/core/analysis.test.ts` | `buildAnalysisResult` and `calculateSlowPeriodStatistics` |
| `src/core/data-analyzer.test.ts` | Slow period and recording gap detection helpers |
| `src/core/fit-parser.test.ts` | `decodeFitFile` and `extractActivityTimes` (with `@garmin/fitsdk` mocked) |
| `src/utils/gps-utils.test.ts` | Semicircle → degree conversion and GPS helpers |
| `src/utils/time-utils.test.ts` | Duration formatting and time range matching |

### Configuration

- `vitest.config.js` sets up the jsdom environment, global test APIs, the `@` → `src/` alias, and coverage settings.
- There is no global setup file. Any mocks are declared in the test file that needs them.

## Coverage

Coverage focuses on the pure analysis pipeline (`src/core/`) and utilities (`src/utils/`). The React UI (`src/ui/`) and the Leaflet map integration have no automated tests at the moment. Check them manually with `npm run dev`, or use the **Load example FIT file** button, which loads `src/assets/data/GreatBritishEscapades2025.fit`.

## Writing Tests

Put new tests beside the module they cover, named `<module>.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

import { formatDuration } from './time-utils';

describe('formatDuration', () => {
  it('formats hours, minutes and seconds', () => {
    expect(formatDuration(7322)).toBe('2h 2m 2s');
  });
});
```

### Mocking

Use `vi.mock` inside the test file. For an example, see how `src/core/fit-parser.test.ts` mocks `@garmin/fitsdk` to control what the decoder returns:

```typescript
vi.mock('@garmin/fitsdk', () => ({
  Stream: { fromByteArray: vi.fn() },
  Decoder: class {
    read() {
      return { messages: {}, errors: [] };
    }
  },
}));
```

Leaflet is loaded from a CDN at runtime and is not available under jsdom. Code that touches the global `L` needs a stub (for example `vi.stubGlobal('L', ...)`).

## Best Practices

- **Test pure functions first.** The analysis modules in `src/core/` and `src/utils/` take plain data and return plain data, so they are the easiest to test.
- **Use descriptive names**, e.g. `it('returns null when no GPS coordinates are provided')` rather than `it('handles edge case')`.
- **Cover edge cases** such as empty record arrays, missing GPS data, zero durations, and gaps exactly at the threshold.
- **Keep tests independent.** Reset mocks in `beforeEach` with `vi.clearAllMocks()` when a file shares mock state.
- **Export new analysis helpers through `src/main.ts`** if they are part of the public analysis API, and add matching cases to `src/main.test.ts`.

## Future Testing Goals

- [ ] Component tests for the React UI (e.g. with `@testing-library/react`)
- [ ] Integration test that runs the bundled example FIT file through the full pipeline
- [ ] Performance tests for large FIT files
- [ ] E2E tests using Playwright
