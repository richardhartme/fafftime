# Work Log

- Made the analysis column the single home for the activity summary, faff overview, map, and per-period cards.
- Restyled the summary cards so activity and faff insights use the same icon-driven layout.
- Moved the moving vs stopped progress bar into the faff summary itself to keep aggregate metrics together.
- Adjusted the sidebar to show the parsed FIT filename with an "Analyse Another FIT File" action that reopens the uploader on demand.
- Extracted an `UploadPanel` wrapper so the dropzone and loaded-file summary share one component with self-contained visibility state.
