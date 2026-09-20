/* G3: genuine schema-backed model, actual MicroInterpreter and official MulPrepare.
 * The experimental FlatBuffer is research-authored, NOT a naturally found model.
 * Reference interpreter runs on host; separately source-pinned ARM MVE ELF is
 * executed in QEMU. No claim that host executes the CMSIS-NN backend. */
#include <cstdint>
#include <cstdio>
#include <fstream>
#include <iterator>
#include <vector>
#include "tensorflow/lite/micro/micro_interpreter.h"
#include "tensorflow/lite/micro/micro_mutable_op_resolver.h"
#include "tensorflow/lite/micro/kernels/mul.h"
#include "tensorflow/lite/schema/schema_generated.h"

static TfLiteStatus (*original_prepare)(TfLiteContext*,TfLiteNode*) = nullptr;
static int prepare_count=0;
static TfLiteStatus checked_prepare(TfLiteContext* context,TfLiteNode* node){
 TfLiteStatus status=original_prepare(context,node);
 if(status!=kTfLiteOk)return status;
 auto* d=static_cast<const tflite::OpDataMul*>(node->user_data);
 std::printf("ACTUAL_TFLM_MUL_PREPARE m=%d shift=%d offsets=%d,%d,%d activation=%d,%d\n",
  d->output_multiplier,d->output_shift,-d->input1_zero_point,-d->input2_zero_point,
  d->output_zero_point,d->output_activation_min,d->output_activation_max);
 if(d->output_multiplier!=1073741824||d->output_shift!=15||
    d->input1_zero_point!=-100||d->input2_zero_point!=-100||
    d->output_zero_point!=0||d->output_activation_min!=-128||d->output_activation_max!=127)
  return kTfLiteError;
 ++prepare_count; return kTfLiteOk;
}
int main(int argc,char**argv){
 if(argc!=2)return 2;
 std::ifstream f(argv[1],std::ios::binary);if(!f)return 3;
 std::vector<char> contents((std::istreambuf_iterator<char>(f)),std::istreambuf_iterator<char>());
 if(contents.size()<64)return 4;
 std::vector<uint8_t> aligned(contents.begin(),contents.end());
 if(!tflite::ModelBufferHasIdentifier(aligned.data()))return 5;
 auto* model=tflite::GetModel(aligned.data());
 if(model->version()!=TFLITE_SCHEMA_VERSION)return 6;
 tflite::MicroMutableOpResolver<1> resolver;
 TFLMRegistration registration=tflite::Register_MUL();
 original_prepare=registration.prepare;
 registration.prepare=checked_prepare;
 if(resolver.AddMul(registration)!=kTfLiteOk)return 7;
 alignas(16) uint8_t arena[32768]={};
 tflite::MicroInterpreter interp(model,resolver,arena,sizeof(arena));
 if(interp.AllocateTensors()!=kTfLiteOk)return 8;
 if(prepare_count!=1)return 9;
 auto* in0=interp.input(0);auto* in1=interp.input(1);auto*out=interp.output(0);
 if(!in0||!in1||!out||in0->type!=kTfLiteInt8||in1->type!=kTfLiteInt8||out->type!=kTfLiteInt8)return 10;
 for(int i=0;i<4;i++){in0->data.int8[i]=100;in1->data.int8[i]=100;out->data.int8[i]=0;}
 if(interp.Invoke()!=kTfLiteOk)return 11;
 std::printf("ACTUAL_TFLM_REFERENCE_INVOKE_OUTPUT %d %d %d %d\n",int(out->data.int8[0]),int(out->data.int8[1]),int(out->data.int8[2]),int(out->data.int8[3]));
 for(int i=0;i<4;i++)if(out->data.int8[i]!=127)return 12;
 std::puts("ACTUAL_TFLM_MODEL_PREPARE_AND_REFERENCE_INVOKE_PASS");
 return 0;
}
