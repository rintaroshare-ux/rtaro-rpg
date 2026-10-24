export const ATB_TIME_BASE_MS = 45000;
export interface AtbActor { id: string; speed: number; alive: boolean; queued: boolean }
/** Receives simulation time only. No rendering, timers, DOM or random numbers. */
export class AtbClock {
  private readonly gauges = new Map<string, number>();
  value(id: string): number { return this.gauges.get(id) ?? 0; }
  set(id: string, value: number): void { this.gauges.set(id, Math.max(0, Math.min(1, value))); }
  advance(deltaMs: number, actors: readonly AtbActor[], paused = false): void {
    const elapsed = Number.isFinite(deltaMs) ? Math.max(0, deltaMs) : 0;
    for (const actor of actors) {
      if (!actor.alive) { this.set(actor.id, 0); continue; }
      if (!paused && !actor.queued) this.set(actor.id, this.value(actor.id) + elapsed * Math.max(1, actor.speed) / ATB_TIME_BASE_MS);
    }
  }
}
