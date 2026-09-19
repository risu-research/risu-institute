#!/usr/bin/env python3
"""Vendor diode *model* corner sweeps; not manufacturer limits or safety qualification."""
import csv, hashlib, itertools, re, subprocess, sys
from pathlib import Path
BASE=Path(__file__).resolve().parent
MODEL=Path(sys.argv[1]).resolve()
assert MODEL.is_file() and 'DI_BZX84C5V1' in MODEL.read_text()
OUT=BASE/'results'/'vendor_corners';OUT.mkdir(parents=True,exist_ok=True)
row=re.compile(r'^\s*0\s+([-+\d.Ee]+)\s+([-+\d.Ee]+)\s*$',re.M)
rows=[]
for vin,ru,rd,sink,temp in itertools.product((4.35,10.2,28.0),(8645,9555),(9500,10500),(0,25e-6),(-40,27,125)):
 tag=f'vin{str(vin).replace(".","p")}_ru{ru}_rd{rd}_i{int(sink*1e6)}u_t{temp}'
 deck=OUT/(tag+'.cir')
 deck.write_text(f'''Nominal diode vendor MODEL electrical input corner; not production qualification
Vbus vin 0 {vin}
Rupper vin ce {ru}
Roriginal ce 0 {rd}
Rinternal_typ ce 0 285000
Ice_assumed ce 0 {sink}
.include "{MODEL.as_posix()}"
Xz 0 ce DI_BZX84C5V1
.temp {temp}
.op
.print op v(ce) i(Vbus)
.end
''')
 proc=subprocess.run(['ngspice','-b',str(deck)],capture_output=True,text=True,timeout=10)
 text=proc.stdout+'\n'+proc.stderr
 (OUT/(tag+'.log')).write_text(text)
 if proc.returncode:raise RuntimeError(tag+' ngspice failure '+text[-400:])
 chunks=text.split('Index')
 matches=list(row.finditer(chunks[-1])) if len(chunks)>1 else []
 if not matches:raise ValueError(tag+' unexpected simulator output: '+text[-400:])
 vce=float(matches[-1].group(1)); input_cur=abs(float(matches[-1].group(2)))
 iz=(vin-vce)/ru-vce/rd-vce/285000-sink
 rows.append({'VIN_V':vin,'Rupper_ohm':ru,'R8_ohm':rd,'hypothesized_sink_A':sink,'TEMP_C_VENDOR_MODEL_ONLY':temp,'VCE_V':vce,'source_current_A':input_cur,'zener_current_from_KCL_A':iz,'VCE_logic_high_model':int(vce>=1.4),'VCE_under_abs7_model':int(vce<=7)})
assert len(rows)==72
with (OUT/'results.csv').open('w',newline='') as f:
 w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
for vin in (4.35,10.2,28.0):
 a=[r for r in rows if r['VIN_V']==vin]
 assert len(a)==24
 print('MODEL_CORNER',vin,'VCE_MIN',min(r['VCE_V'] for r in a),'VCE_MAX',max(r['VCE_V'] for r in a),'ZENER_I_MAX',max(r['zener_current_from_KCL_A'] for r in a))
 assert all(1.4 <=r['VCE_V'] <=6 for r in a),(vin,[r for r in a if not 1.4<=r['VCE_V']<=6][:5])
print('VENDOR_MODEL_CORNERS_PASS',len(rows),'original_model_sha256',hashlib.sha256(MODEL.read_bytes()).hexdigest(),'MODEL_ONLY_NOT_QUALIFICATION')
