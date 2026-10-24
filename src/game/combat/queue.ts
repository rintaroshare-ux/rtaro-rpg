/** FIFO with one reservation per combatant; dequeue releases the reservation. */
export class ActionQueue<T> {
  private readonly entries: { actor: string; action: T }[] = [];
  has(actor: string): boolean { return this.entries.some(entry => entry.actor === actor); }
  enqueue(actor: string, action: T): boolean {
    if (this.has(actor)) return false;
    this.entries.push({ actor, action }); return true;
  }
  cancel(actor: string): boolean {
    const index=this.entries.findIndex(entry=>entry.actor===actor);
    if(index<0)return false;
    this.entries.splice(index,1);return true;
  }
  shift(): T | undefined { return this.entries.shift()?.action; }
  snapshot():T[]{return this.entries.map(entry=>structuredClone(entry.action));}
  clear(): void { this.entries.length = 0; }
  get length(): number { return this.entries.length; }
}
