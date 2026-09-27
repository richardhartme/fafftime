# CLAUDE.md

This file contains project-specific information for Claude Code to help with development tasks.

## Project Overview

**Fafftime Analyser** - Ultra Cycling analysis tool for finding periods where time was spent stopped instead of riding. Analyzes Garmin FIT files to identify slow/stopped periods during ultra-cycling events.

## Development Commands

### Build & Development
- `npm run build` - Production build
- `npm run dev` - Development server with hot reload
- `npm run serve` - Development server with hot reload (alias for dev)
- `npm start` - Development server with hot reload (alias for dev)
- `npm run preview` - Preview production build locally

### Testing
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ui` - Run tests with UI interface

### Deployment
- `npm run deploy` - Build and deploy to production
- `npm run deploy:production` - Build and deploy to production (alias)

## Project Structure

- `src/` - TypeScript/React source code
- `src/main.tsx` - React entry point
- `index.html` - HTML template (root directory)
- `src/core/` - Core business logic
- `src/ui/` - React UI components
- `src/components/ui/` - shadcn/ui components (created when first added via the shadcn CLI)
- `src/lib/` - Shared utilities (clsx/tailwind-merge helpers)
- `src/utils/` - Utility functions
- `src/types/` - TypeScript type definitions
- `src/assets/` - Static assets (data, icons, images)
- `src/site.webmanifest` - Web app manifest (copied to `dist/` by vite-plugin-static-copy)
- `components.json` - shadcn/ui configuration
- Uses Vite for bundling and dev server
- Vitest for testing (tests are colocated as `src/**/*.test.ts`)
- TypeScript for type safety

## Key Technologies

- **TypeScript** - Main language
- **React** - UI framework
- **Vite** - Build tool and dev server
- **Vitest** - Testing framework
- **Tailwind CSS** - Utility-first CSS framework
- **PostCSS** - CSS processing tool
- **shadcn/ui** - UI component library
- **class-variance-authority** - Component variant utility
- **clsx** + **tailwind-merge** - className merging utilities
- **tailwindcss-animate** - Tailwind animation plugin
- **@garmin/fitsdk** - Garmin FIT file parsing
- **Leaflet** - Maps library (loaded via CDN, not npm)
- **leaflet-polylinedecorator** - Leaflet plugin for polyline arrows (loaded via CDN)
- **FontAwesome** - Icon library

## Code Quality

When making changes:
- Use TypeScript for type safety
- Follow React best practices and existing component patterns
- Use Tailwind CSS for styling
- Follow existing code patterns and conventions
- Order methods in a top-down fashion
- Run `npm test` to ensure all tests pass
- Test coverage is tracked via `npm run test:coverage`

## Styling

The project uses Tailwind CSS for styling. Styles are configured via:
- `tailwind.config.js` - Tailwind configuration
- `postcss.config.js` - PostCSS configuration
- `src/tailwind.css` - Main CSS file with Tailwind imports

## Deployment

`deploy.sh` builds the app and rsyncs `dist/` to production (fafftime.com). There is no staging environment, so verify changes locally with `npm run build && npm run preview` before deploying.