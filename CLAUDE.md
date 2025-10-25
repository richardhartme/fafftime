# CLAUDE.md

This file contains project-specific information for Claude Code to help with development tasks.

## Project Overview

**Fafftime Analyser** - Ultra Cycling analysis tool for finding periods where time was spent stopped instead of riding. Analyzes Garmin FIT files to identify slow/stopped periods during ultra-cycling events.

## Development Commands

### Build & Development
- `npm run build` - Production build
- `npm run dev` - Development build with watch
- `npm run serve` - Development server with hot reload
- `npm start` - Alias for serve

### Testing
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ui` - Run tests with UI interface

### Deployment
- `npm run deploy` - Deploy to staging
- `npm run deploy:staging` - Deploy to staging
- `npm run deploy:production` - Deploy to production
- `npm run build:deploy` - Build and deploy to staging
- `npm run build:deploy:production` - Build and deploy to production

## Project Structure

- `src/` - TypeScript/React source code
- `src/main.ts` - Main entry point
- `src/main.tsx` - React entry point
- `src/index.html` - HTML template
- `src/core/` - Core business logic
- `src/ui/` - React UI components
- `src/utils/` - Utility functions
- `src/types/` - TypeScript type definitions
- Uses Webpack for bundling
- Vitest for testing
- TypeScript for type safety

## Key Technologies

- **TypeScript** - Main language
- **React** - UI framework
- **Webpack** - Module bundler and dev server
- **Vitest** - Testing framework
- **Tailwind CSS** - Utility-first CSS framework
- **PostCSS** - CSS processing tool
- **@garmin/fitsdk** - Garmin FIT file parsing
- **Leaflet** - Maps library
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

The project has automated deployment scripts (`deploy.sh`) for both staging and production environments. Always test changes in staging before production deployment.