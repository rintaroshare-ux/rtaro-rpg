"""Original multi-part score renderer. Requires libfluidsynth, TimGM6mb.sf2, numpy and ffmpeg.
No existing game melodies/MIDI/recordings. SoundFont is a build-time instrument library only.
Runtime uses rendered Ogg files, not browser oscillators. See docs/MUSIC.md for credits.
"""
from pathlib import Path
import ctypes as C,ctypes.util,math,subprocess,wave,tempfile
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
# id, tempo, tonic, minor, lead GM program, original motif (scale degrees), progression
PIECES=[
 ('title',92,60,False,11,[0,2,4,6,4,1,3,2],[0,5,3,4]),
 ('field',112,62,False,73,[0,1,4,2,5,4,1,0],[0,3,1,4]),
 ('airport',120,65,False,10,[2,4,3,1,0,2,5,4],[0,4,5,3]),
 ('sky',108,67,False,73,[4,6,7,5,2,4,1,3],[0,2,3,4]),
 ('oslo',84,62,False,46,[0,4,2,1,5,3,2,0],[0,5,1,4]),
 ('office',104,57,True,11,[0,2,1,4,3,5,2,1],[0,3,5,4]),
 ('battle',152,62,True,80,[0,0,2,4,3,1,5,4],[0,5,3,4]),
 ('elite',144,64,True,56,[4,2,0,3,1,5,4,6],[0,2,5,4]),
 ('boss',156,59,True,60,[0,4,1,5,2,6,3,4],[0,5,1,4]),
 ('final',136,60,True,48,[0,6,4,2,5,1,3,0],[0,3,5,4]),
 ('shop',118,65,False,11,[2,0,4,1,3,2,5,1],[0,1,4,0]),
 ('emotion',72,60,False,0,[0,2,1,4,3,1,0,2],[0,5,3,4]),
 ('victory',132,67,False,56,[0,2,4,7,6,4,5,7],[0,3,4,0]),
 ('ending',96,65,False,73,[0,4,6,5,3,2,4,7],[0,3,5,4]),
 ('defeat',68,57,True,0,[4,3,2,0,1,2,1,0],[0,5,3,0]),
]
lib=C.CDLL(ctypes.util.find_library('fluidsynth'))
def fn(name,result,args):
 f=getattr(lib,name);f.restype=result;f.argtypes=args;return f
ptr=C.c_void_p; I=C.c_int; F=C.c_float; D=C.c_double; S=C.c_char_p
settings_new=fn('new_fluid_settings',ptr,[]);setnum=fn('fluid_settings_setnum',I,[ptr,S,D]);setint=fn('fluid_settings_setint',I,[ptr,S,I]);synth_new=fn('new_fluid_synth',ptr,[ptr]);load=fn('fluid_synth_sfload',I,[ptr,S,I]);program=fn('fluid_synth_program_change',I,[ptr,I,I]);on=fn('fluid_synth_noteon',I,[ptr,I,I,I]);off=fn('fluid_synth_noteoff',I,[ptr,I,I]);write=fn('fluid_synth_write_float',I,[ptr,I,ptr,I,I,ptr,I,I]);delete=fn('delete_fluid_synth',None,[ptr]);delete_settings=fn('delete_fluid_settings',None,[ptr]);control=fn('fluid_synth_cc',I,[ptr,I,I,I])
RATE=22050;outdir=ROOT/'public/audio';outdir.mkdir(exist_ok=True)
def render(piece):
 key,bpm,tonic,minor,lead,motif,prog=piece;bars=8 if key in ('victory','defeat') else 24 if key in ('title','emotion') else 32
 scale=[0,2,3,5,7,8,10] if minor else [0,2,4,5,7,9,11]
 pitch=lambda degree,octave=0:tonic+scale[degree%7]+12*(degree//7+octave)
 beat=60/bpm;length=bars*4*beat;events=[]
 def note(ch,n,t,d,v):
  events.extend([(t,1,ch,n,v),(t+d,0,ch,n,0)])
 for cycle in range(2):
  base=cycle*length
  for bar in range(bars):
   t=base+bar*4*beat;degree=prog[(bar//2)%len(prog)];section=(bar//8)%4
   # Strings/pad triads, genuine harmonic voice-leading and arpeggiated harp.
   for chord in [degree,degree+2,degree+4]:note(2,pitch(chord),t,3.8*beat,38+(bar%2)*4)
   for b in range(4):
    note(3,pitch(degree,-2)+(7 if b==2 else 0),t+b*beat,.8*beat,76 if b%2==0 else 58)
    note(4,pitch(degree+[0,2,4,2][b],1),t+(b+.5)*beat,.42*beat,37)
   # A/A'/B/C phrasing: original motif, answer phrase, register and rhythmic variation.
   for step in range(8):
    m=motif[(step+(bar%2)*3)%8]
    if section==1:m=m+(1 if step<4 else -1)
    elif section==2:m=motif[7-step]+2
    elif section==3:m=m+(2 if step%3==0 else 0)
    if bar%4==3 and step>=6:m=([1,0] if bar%8==7 else [5,4])[step-6]
    if step==7 and bar%2==0:continue
    note(0,pitch(m,1),t+step*.5*beat,(.8 if step in (2,6) else .43)*beat,78 if step%2==0 else 66)
   if section>=1:
    for b in (0,2):note(1,pitch(degree+([4,2] if section==2 else [2,4])[b//2],1),t+(b+.25)*beat,1.45*beat,42)
   if key not in ('emotion','defeat'):
    for step in range(8):note(9,42 if step%2 else 44,t+step*.5*beat,.1,34 if step%2 else 45)
    for b in (0,2):note(9,36,t+b*beat,.12,72)
    for b in (1,3):note(9,38,t+b*beat,.12,58)
    if bar%8==7:
     for j in range(4):note(9,[45,47,48,49][j],t+(3+j*.25)*beat,.15,57)
 events.sort();settings=settings_new();setnum(settings,b'synth.sample-rate',RATE);setnum(settings,b'synth.gain',.7);setnum(settings,b'synth.reverb.room-size',.3);setnum(settings,b'synth.reverb.level',.18);setint(settings,b'synth.chorus.active',0);s=synth_new(settings)
 if load(s,b'/usr/share/sounds/sf2/TimGM6mb.sf2',1)<0:raise RuntimeError('SoundFont unavailable')
 for ch,patch in [(0,lead),(1,68 if minor else 71),(2,48),(3,33),(4,46)]:program(s,ch,patch);control(s,ch,10,[40,90,64,64,85][ch])
 chunks=[];at=0
 def audio(n):
  if n<=0:return
  l=np.empty(n,np.float32);r=np.empty(n,np.float32);write(s,n,l.ctypes.data,0,1,r.ctypes.data,0,1);chunks.append(np.column_stack([l,r]))
 for t,kind,ch,n,v in events:
  pos=round(t*RATE)
  if pos>round(length*2*RATE):break
  audio(pos-at);at=pos
  if kind:on(s,ch,n,v)
  else:off(s,ch,n)
 audio(round(length*2*RATE)-at);data=np.concatenate(chunks)[round(length*RATE):round(length*2*RATE)];delete(s);delete_settings(settings)
 data=np.tanh(data*1.1);peak=np.max(np.abs(data));data*=.82/max(peak,.1);data=np.round(data*2047)/2047
 if key in ('victory','defeat'):data[-int(RATE*.6):]*=np.linspace(1,0,int(RATE*.6))[:,None]
 with tempfile.TemporaryDirectory() as temp:
  wav=Path(temp)/'track.wav'
  with wave.open(str(wav),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(RATE);w.writeframes((np.clip(data,-1,1)*32767).astype('<i2').tobytes())
  subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-c:a','libvorbis','-q:a','1',str(outdir/(key+'.ogg'))],check=True)
 print(key,round(length,2),len(data),flush=True)
if __name__=='__main__':
 import sys
 for p in PIECES:
  if len(sys.argv)==1 or p[0] in sys.argv[1:]:render(p)
