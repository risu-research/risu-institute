#!/usr/bin/env python3
"""Source-pattern *audit*, not static verification of the Zephyr program. Fail closed on changed evidence."""
import json, pathlib, re, sys
p=pathlib.Path(sys.argv[1]); out=pathlib.Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
read=lambda n:(p/n).read_text()
driver=read('charger_bq24190.c'); binding=read('ti,bq24190.yaml'); sample=read('sample_main.c'); alt=read('charger_bq25713.c')
checks={
 'bq24190_optional_gpio_binding': bool(re.search(r'^  ce-gpios:\s*\n\s+type:\s*phandle-array',binding,re.M)) and not bool(re.search(r'^  ce-gpios:\s*\n(?:.*\n){0,3}\s+required:\s*true',binding,re.M)),
 'bq24190_gpio_enable_is_conditional': all(x in driver for x in ('config->ce_gpio.port != NULL','gpio_pin_set_dt(&config->ce_gpio, 1)','gpio_pin_set_dt(&config->ce_gpio, 0)','return -ENOTSUP;')),
 'bq25713_uses_register_inhibit': all(x in alt for x in ('static int bq25713_charge_enable','BQ25713_REG_CO0_INHIBIT','bq25713_update8(dev, BQ25713_REG_CO0_LOW')),
 'sample_accepts_no_software_charge_enable': 'if (ret == -ENOTSUP)' in sample and 'assuming auto charge enable' in sample,
 'binding_explicitly_attests_physical_TS_wiring': False,
}
assert all(v for k,v in checks.items() if k != 'binding_explicitly_attests_physical_TS_wiring'),checks
rows=[]
for driver_name in ('bq24190','bq25713'):
 for actuator_available in (False,True):
  for temp_sensor in (False,True):
   for drift_bound_proven in (False,True):
    for physical_TS_attested in (False,True):
     if not actuator_available:decision='NOT_ENFORCEABLE'
     elif not temp_sensor:decision='NO_SOFTWARE_TEMPERATURE_OBSERVATION'
     elif not drift_bound_proven:decision='NO_EFFECT_TIME_BOUND'
     else:decision='CONDITIONAL_SOFTWARE_ENFORCEMENT'
     hardware=('CONDITIONAL_HARDWARE_THERMISTOR' if physical_TS_attested else 'HARDWARE_THERMISTOR_UNVERIFIED')
     rows.append({'driver':driver_name,'software_actuator_config':actuator_available,'independent_temp_sensor':temp_sensor,'externally_certified_drift':drift_bound_proven,'TS_wiring_independently_attested':physical_TS_attested,'application_30C_decision':decision,'manufacturer_window_status':hardware})
report={'evidence_checks':checks,'configs':rows,'warning':'SOURCE PATTERN AUDIT ONLY. No Zephyr build, electronic TS circuit, calibrated sensor, physical drift certificate, or actuator response verified.'}
(out/'source_contract_gate.json').write_text(json.dumps(report,indent=2))
from collections import Counter
print('SOURCE_PATTERN_GATE_PASS',sum(v for k,v in checks.items() if k!='binding_explicitly_attests_physical_TS_wiring'),'of',len(checks)-1)
print('ABSTRACT_CONFIG_CLASSIFICATION',json.dumps(Counter(r['application_30C_decision'] for r in rows),sort_keys=True))
print('IMPORTANT: DTS binding does not attest physical thermistor wiring; missing ce-gpios is legal, and the driver then returns ENOTSUP for software charge control.')
