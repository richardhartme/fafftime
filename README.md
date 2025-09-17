# Ultra Cycling Faff Time Analyser

Ultra Cycling Faff Time Analyser helps riders understand where their time went during long events. Drop in a Garmin FIT file to get a React-powered dashboard with route visualisation, faff/stop detection, and detailed ride metrics – all handled locally in the browser using the official Garmin FIT SDK.

Use the tool live at [https://fafftime.com](https://fafftime.com)

> 🤖 Built with a good mix of elbow grease, [Claude Code](https://claude.ai/code), and [OpenAI Codex](https://openai.com/codex/).

## Screenshot

![Fafftime Analyser Screenshot](src/assets/images/screenshot.png)

## Features

- **React UI** with drag‑and‑drop FIT upload and instant feedback
- **Garmin FIT decoding** via `@garmin/fitsdk`, running entirely client-side
- **Activity summary** covering elapsed vs moving time and total distance (km + miles)
- **Faff period detection** for configurable time thresholds (2 minutes through 2+ hours)
- **Recording gap analysis** so paused/logging gaps are highlighted alongside slow periods
- **Leaflet maps** showing the full route plus mini-maps for every faff/gap segment

## Getting Started

### Prerequisites

- Node.js 18+ (needed for the toolchain and Vitest)
- A modern browser (Chrome, Firefox, Edge, Safari) for running the UI

### Local Setup

```bash
npm install
npm start        # launches the webpack dev server on http://localhost:3000

# optional helpers
npm run dev      # rebuild on change without serving
npm run build    # production bundle in dist/
npm test         # Vitest suite against the exported analysis API
```

## Using the App

1. Launch the dev server (or open [fafftime.com](https://fafftime.com)).
2. Drag a `.fit` file onto the drop zone or use the picker button.
3. The dashboard analyses the file locally and shows:
   - Summary cards for start/end, duration, stopped vs moving time, and total distance.
   - The main Leaflet map with the full activity trace (toggled overlays keep faff periods visible).
   - A breakdown of faff periods and recording gaps, each with mini-maps and Google Maps links.
4. Use the sidebar controls to tweak faff thresholds and the timestamp gap tolerance; the UI re-runs the analysis instantly.
5. Explore mini-maps with the “Show activity route” toggle to overlay the entire ride for context.

## Project Structure

```
src/
├─ core/          # FIT decoding + data analysis (framework agnostic)
├─ types/         # Shared TypeScript definitions
├─ ui/
│  ├─ App.tsx     # React application shell and UI composition
│  └─ map-manager.ts  # Leaflet helpers shared by React components
├─ utils/         # Misc helpers (GPS conversion, analytics tracking, constants)
├─ assets/        # Icons, screenshots, example FIT payloads
├─ main.tsx       # React entry point (render <App />)
├─ main.ts        # Re-exports analysis helpers for Vitest
├─ index.html     # HtmlWebpackPlugin template with Leaflet + GA bootstrapping
└─ styles.css     # Shared styling imported into the React bundle

tests/
└─ main.test.ts   # Vitest suite hitting the exported core analysis API
```

## Tech Stack

- **UI**: React 18 + TypeScript
- **Bundler**: Webpack 5, `ts-loader`, `html-webpack-plugin`, `copy-webpack-plugin`
- **Mapping**: Leaflet + OpenStreetMap tiles (loaded from CDN)
- **Analysis**: Pure TypeScript modules in `src/core/` using `@garmin/fitsdk`
- **Testing**: Vitest with JSDOM for exercising the non-React logic

## Contributing & Testing

1. Create a branch, run `npm install`, and make your changes.
2. Keep TypeScript happy (`npm run dev` is handy while editing).
3. Run `npm test` before opening a PR – the suite focuses on the exported analysis helpers.
4. Attach screenshots or explain UI-visible changes in your PR description.

## License

MIT License. Garmin FIT SDK usage is governed by the Flexible and Interoperable Data Transfer (FIT) Protocol License.
