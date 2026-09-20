/* Exhaustive Arm MVE execution of the actual v8.0.0 CMSIS-NN original
 * arm_elementwise_mul_s8 C compiled twice. One research-authored valid
 * TFLite MUL model supplies m=2^30, shift=15, input offsets +100, +100.
 * This executes 65,536 input PAIRS in QEMU; not real usage prevalence. */
#include <stdint.h>
extern int scalar_kernel(const int8_t*,const int8_t*,int32_t,int32_t,int8_t*,int32_t,int32_t,int32_t,int32_t,int32_t,int32_t);
extern int mve_kernel(const int8_t*,const int8_t*,int32_t,int32_t,int8_t*,int32_t,int32_t,int32_t,int32_t,int32_t,int32_t,int32_t);
static void write0(const char*s){__asm volatile("mov r0,#4\nmov r1,%0\nbkpt #0xab"::"r"(s):"r0","r1","memory");}
static void number(int x){char b[16];int j=0;unsigned y;if(x<0){b[j++]='-';y=(unsigned)(-x);}else y=(unsigned)x;char r[11];int n=0;do{r[n++]=(char)('0'+y%10);y/=10;}while(y);while(n)b[j++]=r[--n];b[j]=0;write0(b);}
static int8_t in_a[256],in_b[256],out_s[257],out_m[257];
int main(void){int errors=0,different=0,total=0,overflow=0,first_a=0,first_b=0,first_seen=0;
 for(int a=-128;a<=127;a++){
  for(int k=0;k<256;k++){
   in_a[k]=(int8_t)a;in_b[k]=(int8_t)(k-128);
   out_s[k]=77;out_m[k]=77;
  }
  out_s[256]=77;out_m[256]=77;
  int rc_s=scalar_kernel(in_a,in_b,100,100,out_s,0,1073741824,15,-128,127,256);
  int rc_m=mve_kernel(in_a,in_b,100,100,out_m,0,1073741824,15,-128,127,256);
  if(rc_s||rc_m)errors++;
  if(out_s[256]!=77||out_m[256]!=77)errors++;
  for(int k=0;k<256;k++){
   const int b=k-128;
   const int product=(a+100)*(b+100);
   /* With this exact model, 2^30/(2^(31-15))=2^14.
    * Any nonzero signed product saturates full int8 range. The v8 MVE
    * path first shifts int32 by 16; positive products >=32768 wrap. */
   const int expected_scalar=product>0?127:(product<0?-128:0);
   const int expected_mve=product>=32768?-128:expected_scalar;
   const int mismatch=out_s[k]!=out_m[k];
   const int predicted=product>=32768;
   total++;
   different+=mismatch;
   overflow+=predicted;
   if(out_s[k]!=expected_scalar||out_m[k]!=expected_mve||mismatch!=predicted)errors++;
   if(mismatch&&!first_seen){first_a=a;first_b=b;first_seen=1;}
  }
 }
 write0("EXHAUSTIVE_NATIVE total=");number(total);
 write0(" mismatches=");number(different);
 write0(" overflow_pairs=");number(overflow);
 write0(" errors=");number(errors);write0("\n");
 write0("FIRST_NATIVE_WITNESS a=");number(first_a);write0(" b=");number(first_b);write0("\n");
 if(total!=65536||different!=4004||overflow!=4004||errors){write0("EXHAUSTIVE_NATIVE_FAIL\n");return 3;}
 write0("EXHAUSTIVE_NATIVE_PASS\n");return 0;
}
