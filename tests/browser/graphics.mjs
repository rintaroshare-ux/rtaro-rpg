// Retain the existing npm test:browser entry point; Phase 1 extends this regression suite.
await import('./phase1.mjs');
await import('./recovery.mjs');
await import('./formation-audio.mjs');
