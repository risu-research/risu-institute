/* Research G3: original upstream source compiled twice; MVE is actually executed. */
#include <stdint.h>
extern int scalar_kernel(const int8_t*,const int8_t*,int32_t,int32_t,int8_t*,int32_t,int32_t,int32_t,int32_t,int32_t,int32_t);
extern int mve_kernel(const int8_t*,const int8_t*,int32_t,int32_t,int8_t*,int32_t,int32_t,int32_t,int32_t,int32_t,int32_t);
static void write0(const char *s){__asm volatile("mov r0,#4\nmov r1,%0\nbkpt #0xab"::"r"(s):"r0","r1","memory");}
static void putnum(int v){char b[16];int j=0;unsigned x;if(v<0){b[j++]='-';x=(unsigned)(-v);}else x=(unsigned)v; char tmp[11];int n=0;do{tmp[n++]=(char)('0'+x%10);x/=10;}while(x);while(n)b[j++]=tmp[--n];b[j]=0;write0(b);}
static int run(const char*label,int input,int offset,int shift,int n,int minv,int maxv,int expected_scalar,int expected_mve){
 int8_t a[8],b[8],s[8],v[8];int fail=0;
 for(int i=0;i<8;i++){a[i]=(int8_t)input;b[i]=(int8_t)input;s[i]=v[i]=(int8_t)77;}
 int rc_s=scalar_kernel(a,b,offset,offset,s,0,1073741824,shift,minv,maxv,n);
 int rc_v=mve_kernel(a,b,offset,offset,v,0,1073741824,shift,minv,maxv,n);
 write0("CASE ");write0(label);write0(" scalar=");putnum(s[0]);write0(" mve=");putnum(v[0]);write0(" n=");putnum(n);write0("\n");
 if(rc_s||rc_v)fail=1;
 for(int i=0;i<n;i++)if(s[i]!=expected_scalar||v[i]!=expected_mve)fail=1;
 for(int i=n;i<8;i++)if(s[i]!=77||v[i]!=77)fail=1;
 if(fail)write0("FAIL lane/or status/bounds\n");return fail;
}
int main(void){int errors=0;
 errors+=run("CONTROL_SHIFT14",100,100,14,4,-100,100,100,100);
 errors+=run("WITNESS_SHIFT15",100,100,15,4,-100,100,100,-100);
 errors+=run("TAIL_SHIFT15",100,100,15,5,-100,100,100,-100);
 errors+=run("BOUNDARY_SHIFT15",127,128,15,4,-100,100,100,-100);
 /* Model-matched: TFLM INT8 MUL with fused activation NONE has full INT8
  * clamp [-128,127], offsets +100, Q31 multiplier 2^30, shift +15. */
 errors+=run("TFLM_MODEL_FULL_INT8",100,100,15,4,-128,127,127,-128);
 if(errors){write0("NATIVE_MVE_RESULT_FAIL\n");return 3;}
 write0("NATIVE_MVE_RESULT_PASS\n");return 0;
}
