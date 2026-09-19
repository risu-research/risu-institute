#!/usr/bin/env python3
"""Independent ngspice DC comparisons. Diodes model fetched from vendor URL, never claimed as physical test."""
import csv, hashlib, itertools, json, re, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent
OUT=ROOT/'results'/'vendor_spice';OUT.mkdir(exist_ok=True,parents=True)
MODEL=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else ROOT/'BZX84C5V1.spice.txt'
assert MODEL.is_file(), 'Original diode model required'
s=MODEL.read_text()
assert '.SUBCKT DI_BZX84C5V1' in s and 'Terminals' in s
(OUT/'model_provenance.json').write_text(json.dumps({'url':'https://www.diodes.com/spice/download/885/BZX84C5V1.spice.txt','sha256':hashlib.sha256(MODEL.read_bytes()).hexdigest(),'model_license_notice':'Vendor model as-is and not republished in research package'},indent=2)+'\n')
number=r'([-+]?(?:\d+\.?\d*|\.\d+)(?:[Ee][-+]?\d+)?)'
row_re=re.compile(r'^\s*0\s+'+number+r'\s+'+number+r'\s*$',re.M)
def one(vbus,vout,variant,permit):
 src='out' if variant=='legacy_out' else 'vin'
 r=6800 if variant=='legacy_out' else 9100
 stem=f'{variant}_VIN{str(vbus).replace(".","p")}_OUT{str(vout).replace(".","p")}_{"permit" if permit else "inactive"}'
 f=OUT/(stem+'.cir')
 text=f'''Simplified CE-node circuit, NOT vendor BQ24074 silicon model
Vbus vin 0 {vbus}
Vout out 0 {vout}
Rsource {src} ce {r}
R8_original ce 0 10000
Rinternal_TYPICAL_ONLY ce 0 285000
Iassumed_10uA ce 0 10u
'''
 if variant=='vin_zener':text+=f'.include "{MODEL.as_posix()}"\nXz 0 ce DI_BZX84C5V1\n'
 if permit:text+='Rideal_Permit_Switch ce 0 10\n'
 text+='.op\n.print op v(ce) i(Vbus)\n.end\n'
 f.write_text(text)
 run=subprocess.run(['ngspice','-b',str(f)],text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=10)
 (OUT/(stem+'.log')).write_text(run.stdout)
 if run.returncode:raise RuntimeError(stem+' failed '+run.stdout[-250:])
 tables=run.stdout.split('Index')
 if len(tables)<2:raise ValueError(stem+' missing table '+run.stdout[-300:])
 matches=list(row_re.finditer(tables[-1]))
 if not matches:raise ValueError(stem+' missing data row '+tables[-1][-400:])
 vce=float(matches[-1].group(1)); ivbus=float(matches[-1].group(2))
 return {'variant':variant,'VBUS_V':vbus,'OUT_V':vout,'permit':int(permit),'VCE_V':vce,'I_VBUS_source_signed_A':ivbus,'VIH_and_CE_operating_range':int(1.4<=vce<=6),'CE_exceeds_abs_max_7V':int(vce>7)}
def execute():
 cases=list(itertools.product((3.2,4.35,6.4,10.2,10.8,26.0,28.0),(0.0,1.6,4.4),('legacy_out','vin_unclamped','vin_zener'),(False,True)))
 rows=[one(*c) for c in cases]
 with (OUT/'ngspice_results.csv').open('w',newline='') as f:
  w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
 def find(variant,vin,vout,permit=False):
  return next(r for r in rows if r['variant']==variant and r['VBUS_V']==vin and r['OUT_V']==vout and bool(r['permit'])==permit)
 assert find('legacy_out',6.4,1.6)['VCE_V']<1.4
 assert find('vin_zener',6.4,1.6)['VCE_V']>1.4
 for vin in (3.2,4.35,6.4,10.2,10.8,26.,28.):
  q=[find('vin_zener',vin,out)['VCE_V'] for out in (0,1.6,4.4)]
  assert max(q)-min(q)<1e-8,(vin,q)
 assert find('vin_unclamped',28,0)['VCE_V']>7
 assert find('vin_zener',28,0)['VCE_V']<7
 for vin in (4.35,6.4,10.2):
  x=find('vin_zener',vin,0)
  assert 1.4<=x['VCE_V']<=6,(vin,x)
  assert find('vin_zener',vin,0,True)['VCE_V']<=.4
 summary={'ngspice_cases':len(rows),'model_sha256':hashlib.sha256(MODEL.read_bytes()).hexdigest(),'field_6p4_input_1p6_out_G21_VCE_V':find('legacy_out',6.4,1.6)['VCE_V'],'field_6p4_input_1p6_out_new_VCE_V':find('vin_zener',6.4,1.6)['VCE_V'],'VIN4p35_OUT0_new_VCE_V':find('vin_zener',4.35,0)['VCE_V'],'VIN28_OUT0_new_VCE_V':find('vin_zener',28,0)['VCE_V'],'VIN28_OUT0_unclamped_VCE_V':find('vin_unclamped',28,0)['VCE_V'],'scope':'Nominal CE equivalent with typical internal 285k, assumed 10uA; NOT full charger behavioral model, min-max process or hardware'}
 (OUT/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
 print('VENDOR_NGSPICE_PASS',len(rows),json.dumps(summary))
if __name__=='__main__':execute()
