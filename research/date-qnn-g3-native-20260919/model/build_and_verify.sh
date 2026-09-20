#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p results/model
ORIGINAL_SCHEMA=tflm/tensorflow/compiler/mlir/lite/schema/schema.fbs
SCHEMA=results/model/schema_flatc2.fbs
MODEL=model/quantized_mul_adversarial.json
flatc --version | tee results/model/flatc_version.txt
git -C tflm rev-parse HEAD | tee results/model/tflm_commit.txt
[[ "$(cat results/model/tflm_commit.txt)" = 0ee39f5fc6629b7403166d325da374f01d890cf1 ]]
sha256sum "$ORIGINAL_SCHEMA" "$MODEL" > results/model/model_sources_sha256.txt
python3 - <<'PY'
from pathlib import Path
p=Path('tflm/tensorflow/compiler/mlir/lite/schema/schema.fbs');s=p.read_text()
assert s.count(' (deprecated)')==6
Path('results/model/schema_flatc2.fbs').write_text(s.replace(' (deprecated)',''))
print('NORMALIZATION_DEPRECATED_ENUM_ANNOTATIONS',s.count(' (deprecated)'))
PY
sha256sum "$SCHEMA" >> results/model/model_sources_sha256.txt
flatc -b --strict-json -o results/model "$SCHEMA" "$MODEL"
[[ -f results/model/quantized_mul_adversarial.tflite ]]
flatc -t --raw-binary --strict-json -o results/model "$SCHEMA" -- results/model/quantized_mul_adversarial.tflite
python3 - <<'PY'
from pathlib import Path
import json
p=Path('results/model/quantized_mul_adversarial.tflite'); b=p.read_bytes()
assert b[4:8]==b'TFL3' and len(b)>150
m=json.loads(Path('results/model/quantized_mul_adversarial.json').read_text())
assert m['version']==3 and len(m['subgraphs'])==1
s=m['subgraphs'][0];assert s['inputs']==[0,1] and s['outputs']==[2]
assert len(s['operators'])==1 and s['operators'][0]['builtin_options_type']=='MulOptions'
for t,scale,zp in zip(s['tensors'],[.5,.5,2**-16],[-100,-100,0]):
 assert t['type'] in ('INT8',9) and t['shape']==[4]
 # Flatc 2.0 JSON pretty printer rounds binary float scales; exact float32
 # bits are checked by the real interpreter before the model is invoked.
 assert abs(t['quantization']['scale'][0]-scale)<3e-7
 assert t['quantization']['zero_point']==[zp]
print('GENUINE_TFLITE_FLATBUFFER_ROUNDTRIP_PASS bytes',len(b))
PY
sha256sum results/model/quantized_mul_adversarial.tflite >> results/model/model_sources_sha256.txt
printf 'BUILD_OFFICIAL_TFLM_LIBRARY\n'
set +e
(cd tflm && make -f tensorflow/lite/micro/tools/make/Makefile -j4 microlite) > results/model/tflm_make.log 2>&1
rc=$?
set -e
if [[ $rc -ne 0 ]];then tail -90 results/model/tflm_make.log; echo "TFLM_LIBRARY_BUILD_FAILED=$rc";exit 31;fi
find tflm -name 'libtensorflow-microlite.a' -print | tee results/model/archive_path.txt
LIB=$(head -1 results/model/archive_path.txt)
[[ -f "$LIB" ]]
DL=tflm/tensorflow/lite/micro/tools/make/downloads
printf 'COMPILE_MODEL_INTERPRETER_WITH_OFFICIAL_LIBRARY_AND_MATCHED_ABI\n'
# Mandatory ABI match. TFLM's microlite Makefile defines TF_LITE_STATIC_MEMORY.
# Without it, TfLiteNode::user_data is read at the wrong offset in our driver,
# producing fabricated parameter values despite a successful original Prepare.
g++ -std=c++17 -O2 -DTF_LITE_STATIC_MEMORY -I tflm -I "$DL" -I "$DL/flatbuffers/include" -I "$DL/gemmlowp" -I "$DL/kissfft" -I "$DL/ruy" model/interpreter_run.cc "$LIB" -lm -pthread -o results/model/run_real_tflm
set +e
results/model/run_real_tflm results/model/quantized_mul_adversarial.tflite >results/model/interpreter_output.log 2>&1
rc=$?
set -e
cat results/model/interpreter_output.log
printf 'INTERPRETER_EXIT=%s\n' "$rc" | tee results/model/interpreter_exit.txt
[[ $rc -eq 0 ]]
grep -Fq 'ACTUAL_TFLM_MUL_PREPARE m=1073741824 shift=15 offsets=100,100,0 activation=-128,127' results/model/interpreter_output.log
grep -Fq 'EXACT_BINARY_QUANTIZATION_SCALES_PASS' results/model/interpreter_output.log
grep -Fq 'ACTUAL_TFLM_REFERENCE_INVOKE_OUTPUT 127 127 127 127' results/model/interpreter_output.log
grep -Fq 'ACTUAL_TFLM_MODEL_PREPARE_AND_REFERENCE_INVOKE_PASS' results/model/interpreter_output.log
printf 'G3_GENUINE_MODEL_REAL_PREPARE_PASS\n'
