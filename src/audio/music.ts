import {scores,midiHz,type TrackId} from './scores';
const PREF_KEY='rtaro.audio.v1';
/** One shared Web Audio transport. Scene switches cannot stack music players. */
class Music {
 private context:AudioContext|null=null;
 private master:GainNode|null=null;
 private bus:GainNode|null=null;
 private readonly voices=new Set<AudioScheduledSourceNode>();
 private timer:ReturnType<typeof setInterval>|null=null;
 private nextTime=0;private step=0;private noise:AudioBuffer|null=null;
 private desired:TrackId='title';private muted=false;private volume=.4;
 private finished=false;
 private initialized=false;private unavailable=false;
 get track():TrackId{return this.desired;}
 get contextState():string{return this.context?.state??'locked';}
 get enabled():boolean{return !this.muted;}
 get level():number{return this.volume;}
 get supported():boolean{return !this.unavailable;}
 init():void{
  if(this.initialized)return;this.initialized=true;
  try{const p=JSON.parse(localStorage.getItem(PREF_KEY)??'null');if(p&&typeof p.enabled==='boolean')this.muted=!p.enabled;if(p&&typeof p.volume==='number'&&Number.isFinite(p.volume))this.volume=Math.max(0,Math.min(1,p.volume));}catch{/* Optional preferences must not prevent play. */}
  document.addEventListener('pointerdown',()=>{void this.unlock();});
  document.addEventListener('keydown',()=>{void this.unlock();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){this.stopTransport();void this.context?.suspend().catch(()=>{});}else if(!this.muted)void this.unlock();});
 }
 async unlock():Promise<void>{
  if(this.unavailable||this.muted)return;
  try{
   if(!this.context){
    const Context=window.AudioContext;
    if(!Context){this.unavailable=true;this.notify();return;}
    this.context=new Context();this.master=this.context.createGain();const limiter=this.context.createDynamicsCompressor();
    this.master.gain.value=this.volume*.55;this.master.connect(limiter);limiter.connect(this.context.destination);
    this.noise=this.context.createBuffer(1,Math.floor(this.context.sampleRate*.1),this.context.sampleRate);
    const samples=this.noise.getChannelData(0);let seed=314159;
    for(let i=0;i<samples.length;i++){seed=(seed*1664525+1013904223)>>>0;samples[i]=(seed/4294967296*2-1)*(1-i/samples.length);}
   }
   await this.context.resume();
   if(!this.muted&&!document.hidden&&!this.timer&&!this.finished&&this.context.state==='running')this.startTransport();
   this.notify();
  }catch{this.unavailable=true;this.stopTransport();this.notify();}
 }
 setTrack(track:TrackId):void{if(track===this.desired)return;this.desired=track;this.finished=false;this.stopTransport();if(this.context?.state==='running'&&!this.muted&&!document.hidden)this.startTransport();this.notify();}
 async toggle():Promise<void>{
  if(!this.context&&!this.unavailable){this.muted=false;this.persist();await this.unlock();return;}
  this.muted=!this.muted;if(!this.muted)this.finished=false;this.persist();if(this.muted)this.stopTransport();else await this.unlock();this.notify();
 }
 setVolume(value:number):void{this.volume=Math.max(0,Math.min(1,Number.isFinite(value)?value:.4));if(this.master&&this.context)this.master.gain.setTargetAtTime(this.volume*.55,this.context.currentTime,.03);this.persist();this.notify();}
 private persist():void{try{localStorage.setItem(PREF_KEY,JSON.stringify({enabled:!this.muted,volume:this.volume}));}catch{/* Game save is separate. */}}
 private notify():void{window.dispatchEvent(new Event('rtaro-audio'));}
 private startTransport():void{
  if(!this.context||!this.master)return;
  this.bus=this.context.createGain();this.bus.gain.value=0;this.bus.connect(this.master);this.bus.gain.linearRampToValueAtTime(1,this.context.currentTime+.04);
  this.finished=false;this.step=0;this.nextTime=this.context.currentTime+.06;
  this.timer=setInterval(()=>this.schedule(),50);this.schedule();
 }
 private stopTransport():void{
  if(this.timer){clearInterval(this.timer);this.timer=null;}
  const ctx=this.context,bus=this.bus;this.bus=null;
  if(ctx&&bus){bus.gain.cancelScheduledValues(ctx.currentTime);bus.gain.setTargetAtTime(0,ctx.currentTime,.008);setTimeout(()=>bus.disconnect(),60);}
  for(const voice of this.voices){try{voice.stop((ctx?.currentTime??0)+.03);}catch{/* Already ended. */}}this.voices.clear();
 }
 private schedule():void{
  const ctx=this.context;if(!ctx||!this.bus||this.muted||document.hidden)return;
  const score=scores[this.desired],duration=60/score.bpm/2;
  // A throttled browser must not queue a backlog of old notes.
  if(this.nextTime<ctx.currentTime)this.nextTime=ctx.currentTime+.03;
  while(this.nextTime<ctx.currentTime+.15){
   if(!score.loop&&this.step>=score.notes.length){this.finished=true;if(this.timer)clearInterval(this.timer);this.timer=null;return;}
   const i=this.step%score.notes.length,note=score.notes[i],root=score.roots[Math.floor(i/8)%score.roots.length];
   if(note)this.tone(note,this.nextTime,duration*.79,'square',.09);
   if(i%2===0)this.tone(root+(i%4===2?12:0),this.nextTime,duration*1.5,'triangle',.16);
   if(i%2===1)this.tone(root+12+[0,7,12,7][Math.floor(i/2)%4],this.nextTime,duration*.7,'triangle',.065);
   if(score.drums){
    if(i%4===0)this.kick(this.nextTime);
    if(i%4===2)this.hiss(this.nextTime,.052,.075);
    else if(i%2===1)this.hiss(this.nextTime,.025,.025);
   }
   this.nextTime+=duration;this.step++;
  }
 }
 private trackVoice(voice:AudioScheduledSourceNode):void{this.voices.add(voice);voice.onended=()=>{this.voices.delete(voice);voice.disconnect();};}
 private tone(note:number,time:number,duration:number,type:OscillatorType,volume:number):void{
  const ctx=this.context;if(!ctx||!this.bus)return;
  const voice=ctx.createOscillator(),gain=ctx.createGain();voice.type=type;voice.frequency.value=midiHz(note);gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(volume,time+.006);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);voice.connect(gain);gain.connect(this.bus);this.trackVoice(voice);voice.start(time);voice.stop(time+duration+.02);voice.addEventListener('ended',()=>gain.disconnect(),{once:true});
 }
 private hiss(time:number,duration:number,volume:number):void{
  const ctx=this.context;if(!ctx||!this.bus||!this.noise)return;const source=ctx.createBufferSource(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();source.buffer=this.noise;filter.type='highpass';filter.frequency.value=1800;gain.gain.setValueAtTime(volume,time);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);source.connect(filter);filter.connect(gain);gain.connect(this.bus);this.trackVoice(source);source.start(time);source.stop(time+duration);source.addEventListener('ended',()=>{gain.disconnect();filter.disconnect();},{once:true});
 }
 private kick(time:number):void{
  const ctx=this.context;if(!ctx||!this.bus)return;const source=ctx.createOscillator(),gain=ctx.createGain();source.frequency.setValueAtTime(110,time);source.frequency.exponentialRampToValueAtTime(35,time+.11);gain.gain.setValueAtTime(.18,time);gain.gain.exponentialRampToValueAtTime(.0001,time+.12);source.connect(gain);gain.connect(this.bus);this.trackVoice(source);source.start(time);source.stop(time+.13);source.addEventListener('ended',()=>gain.disconnect(),{once:true});
 }
}
export const music=new Music();
export function setupAudioControls():void{
 music.init();const button=document.createElement('button');button.id='sound-toggle';button.type='button';
 const volume=document.createElement('input');volume.type='range';volume.min='0';volume.max='1';volume.step='.05';volume.value=String(music.level);volume.setAttribute('aria-label','音楽の音量');
 const ui=document.createElement('div');ui.id='audio-controls';ui.append(button,volume);document.body.append(ui);
 const render=()=>{button.textContent=!music.supported?'♪ 音楽非対応':!music.enabled?'♪ 音楽 OFF':music.contextState!=='running'?'♪ 音楽を開始':'♪ 音楽 ON';button.setAttribute('aria-pressed',String(music.enabled));};
 button.addEventListener('pointerdown',e=>e.stopPropagation());button.addEventListener('keydown',e=>e.stopPropagation());button.addEventListener('click',()=>{void music.toggle();button.blur();});volume.addEventListener('input',()=>music.setVolume(Number(volume.value)));volume.addEventListener('keydown',e=>e.stopPropagation());window.addEventListener('rtaro-audio',render);render();
}
