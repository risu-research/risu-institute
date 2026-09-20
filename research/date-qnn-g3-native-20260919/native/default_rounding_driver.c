/* Independent control: execute original v8 MVE kernel WITHOUT the optional
 * CMSIS_NN_USE_SINGLE_ROUNDING macro. This is NOT a CMSIS-NN patch. */
#include <stdint.h>
extern int mve_kernel(const int8_t*,const int8_t*,int32_t,int32_t,int8_t*,int32_t,int32_t,int32_t,int32_t,int32_t,int32_t);
static void puts0(const char *s){__asm volatile("mov r0,#4\nmov r1,%0\nbkpt #0xab"::"r"(s):"r0","r1","memory");}
static void num(int v){char b[16];int j=0;unsigned x;if(v<0){b[j++]='-';x=(unsigned)(-v);}else x=(unsigned)v;char tmp[11];int n=0;do{tmp[n++]=(char)('0'+x%10);x/=10;}while(x);while(n)b[j++]=tmp[--n];b[j]=0;puts0(b);}
static int run(const char *tag,int x,int shift,int expected){
 int8_t a[8],b[8],out[8];int fail=0;
 for(int i=0;i<8;i++){a[i]=b[i]=(int8_t)x;out[i]=77;}
 int rc=mve_kernel(a,b,100,100,out,0,1073741824,shift,-128,127,4);
 puts0("CASE ");puts0(tag);puts0(" mve_default=");num(out[0]);puts0("\n");
 if(rc)fail=1;
 for(int i=0;i<4;i++)if(out[i]!=expected)fail=1;
 for(int i=4;i<8;i++)if(out[i]!=77)fail=1;
 return fail;
}
int main(void){int e=0;
 e+=run("DEFAULT_SHIFT14_100",100,14,127);
 e+=run("DEFAULT_SHIFT15_100",100,15,127);
 e+=run("DEFAULT_SHIFT15_81",81,15,127);
 e+=run("DEFAULT_SHIFT15_82",82,15,127);
 if(e){puts0("DEFAULT_ROUNDING_CONTROL_FAIL\n");return 3;}
 puts0("DEFAULT_ROUNDING_CONTROL_PASS\n");return 0;
}
