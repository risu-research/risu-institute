#!/usr/bin/env python3
"""Read-only TFL3 quantization scanner. Necessary MVE pre-shift hazard, NOT proven output mismatch.
Schema pinned to tflite-micro 0ee39f5fc6629b7403166d325da374f01d890cf1.
"""
import json,math,struct,hashlib,sys
from pathlib import Path
class FB:
 def __init__(self,d):
  self.d=d
  if d[4:8]!=b'TFL3':raise ValueError('not TFL3')
 def r(self,p,f):
  n=struct.calcsize(f)
  if p<0 or p+n>len(self.d):raise ValueError('out of bounds')
  return struct.unpack_from('<'+f,self.d,p)[0]
 def tab(self,p):
  if p is None:return None
  v=p-self.r(p,'i')
  if v<0 or v>=len(self.d):raise ValueError('bad vtable')
  return p,v
 def f(self,t,i):
  if t is None:return None
  p,v=t
  if 4+2*i>=self.r(v,'H'):return None
  a=self.r(v+4+2*i,'H')
  return p+a if a else None
 def s(self,t,i,f,default=0):
  p=self.f(t,i)
  return default if p is None else self.r(p,f)
 def ref(self,t,i):
  p=self.f(t,i)
  return self.tab(p+self.r(p,'I')) if p is not None else None
 def vec(self,t,i,f='I',refs=False):
  p=self.f(t,i)
  if p is None:return []
  q=p+self.r(p,'I');n=self.r(q,'I');z=struct.calcsize(f)
  if n>10000000 or q+4+n*z>len(self.d):raise ValueError('invalid vector')
  return [self.tab(q+4+k*z+self.r(q+4+k*z,'I')) if refs else self.r(q+4+k*z,f) for k in range(n)]
 def st(self,t,i):
  p=self.f(t,i)
  if p is None:return ''
  q=p+self.r(p,'I');n=self.r(q,'I')
  return self.d[q+4:q+4+n].decode(errors='replace')
def tensor(f,t):
 q=f.ref(t,4)
 return {'name':f.st(t,3),'type':f.s(t,1,'b'),'shape':f.vec(t,0,'i'),'scale':f.vec(q,2,'f'),'zero':f.vec(q,3,'q'),'buffer':f.s(t,2,'I')}
def qm(x):
 a,s=math.frexp(x);q=int(math.floor(a*(1<<31)+.5))
 if q==(1<<31):q//=2;s+=1
 if s<-31:return 0,0
 return q,s
def screen(data,label):
 f=FB(data);root=f.tab(f.r(0,'I'))
 codes=f.vec(root,1,refs=True);code=[(f.s(c,3,'i',f.s(c,0,'b')),f.s(c,2,'i',1)) for c in codes]
 result={'file':label,'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data),'schema':f.s(root,0,'I'),'ops':0,'mul':[]}
 for gi,g in enumerate(f.vec(root,2,refs=True)):
  ts=[tensor(f,t) for t in f.vec(g,0,refs=True)]
  for oi,op in enumerate(f.vec(g,3,refs=True)):
   result['ops']+=1
   idx=f.s(op,0,'I');name,version=code[idx]
   if name!=18:continue
   ins=f.vec(op,1,'i');outs=f.vec(op,2,'i')
   e={'graph':gi,'op':oi,'version':version,'inputs':ins,'outputs':outs,'status':'unsupported','preshift_wrap_possible':None}
   result['mul'].append(e)
   if len(ins)!=2 or len(outs)!=1 or min(ins+outs)<0 or max(ins+outs)>=len(ts):continue
   aa,bb,cc=[ts[i] for i in (ins[0],ins[1],outs[0])]
   e['tensors']=[aa,bb,cc]
   if [aa['type'],bb['type'],cc['type']]!=[9,9,9]:e['status']='not_int8';continue
   if any(len(t['scale'])!=1 or len(t['zero'])!=1 or t['scale'][0]<=0 for t in (aa,bb,cc)):e['status']='not_per_tensor_quantized';continue
   a=aa['shape'][:];b=bb['shape'][:];c=cc['shape']
   while len(a)<len(b):a=[1]+a
   while len(b)<len(a):b=[1]+b
   if a!=b or a!=c:e['status']='broadcast_or_shape_mismatch';continue
   za,zb,zc=[int(t['zero'][0]) for t in (aa,bb,cc)]
   real=aa['scale'][0]*bb['scale'][0]/cc['scale'][0]
   if not 0<real<math.inf:e['status']='invalid_ratio';continue
   mult,shift=qm(real)
   x1,x2=-128-za,127-za;y1,y2=-128-zb,127-zb
   products=(x1*y1,x1*y2,x2*y1,x2*y2)
   pre=max(shift+1,0)
   # Conservative integer range condition for original MVE v8 single-rounding vshlq_s32.
   hazard=pre>=31 and any(products) or pre<31 and (min(products)<-(1<<(31-pre)) or max(products)>((1<<31)-1)>>pre)
   e.update(status='eligible_unverified_backend',real_multiplier=real,multiplier=mult,shift=shift,
     offsets=[-za,-zb,zc],input_ranges=[[x1,x2],[y1,y2]],product_range=[min(products),max(products)],
     pre_shift=pre,preshift_wrap_possible=bool(hazard),
     caution='Range-only possible overflow; NOT a proof of output divergence, TFLM support, actual input reachability, or deployment configuration.')
 return result
if __name__=='__main__':
 for p in sys.argv[1:]:
  try:print(json.dumps(screen(Path(p).read_bytes(),str(p)),indent=2))
  except Exception as ex:print(json.dumps({'file':p,'error':repr(ex)}));sys.exit(1)
