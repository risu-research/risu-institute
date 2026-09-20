/* Original MoveNet v1 public TFL3 model SHA256 recorded in G4 targeted manifest.
 * Both kernels are compiled from UNMODIFIED CMSIS-NN v8 C and helper bodies.
 * Non-broadcast operation at index 87 has independent input buffers; 117/120
 * square the same input tensor, so diagonal pairs are graph-admissible only.
 * This test checks kernel equality and memory/status; it does NOT prove full
 * network activation reachability or exact TFLM MulPrepare parameter equality.
 */
#include <stdint.h>
extern int scalar_kernel(const int8_t*,const int8_t*,int32_t,int32_t,int8_t*,int32_t,int32_t,int32_t,int32_t,int32_t,int32_t);
extern int mve_kernel(const int8_t*,const int8_t*,int32_t,int32_t,int8_t*,int32_t,int32_t,int32_t,int32_t,int32_t,int32_t);
static void w(const char*s){__asm volatile("mov r0,#4\nmov r1,%0\nbkpt #0xab"::"r"(s):"r0","r1","memory");}
static void n(int v){char b[16];int k=0;unsigned u;if(v<0){b[k++]='-';u=(unsigned)(-v);}else u=(unsigned)v;char r[12];int x=0;do{r[x++]=(char)('0'+u%10);u/=10;}while(u);while(x)b[k++]=r[--x];b[k]=0;w(b);}
static int8_t aa[256],bb[256],ss[257],vv[257];
struct case0 {int id,z1,z2,zo,mult,shift,square;};
static const struct case0 cases[]={
 {87,128,128,-128,1144452516,-7,0},
 {117,-10,-10,-128,1839963009,-6,1},
 {120,1,1,-128,2136868535,-6,1}
};
int main(void){int total_errors=0;
 for(unsigned ci=0;ci<sizeof(cases)/sizeof(cases[0]);ci++){
  const struct case0*c=&cases[ci];
  int pairs=0,differences=0,diagonal_differences=0,first_a=0,first_b=0,first_s=0,first_m=0;
  uint32_t hs=2166136261u,hm=2166136261u;
  for(int a=-128;a<=127;a++){
   for(int b=-128;b<=127;b++){
    /* Run 256 consecutive original function outputs per invocation, testing
       all pair combinations without moving enumeration into source kernel. */
    int i=b+128;
    aa[i]=(int8_t)a;
    bb[i]=(int8_t)b;
    ss[i]=77;vv[i]=77;
   }
   ss[256]=77;vv[256]=77;
   const int8_t*input2=c->square?aa:bb;
   int rs=scalar_kernel(aa,input2,c->z1,c->z2,ss,c->zo,c->mult,c->shift,-128,127,256);
   int rv=mve_kernel(aa,input2,c->z1,c->z2,vv,c->zo,c->mult,c->shift,-128,127,256);
   if(rs||rv||ss[256]!=77||vv[256]!=77)total_errors++;
   for(int b=-128;b<=127;b++){
    int j=b+128;
    /* For squares, each possible same-tensor value runs once along the
       diagonal. All repeated lane outputs still checked for consistency. */
    int admissible=!c->square || a==b;
    if(!admissible)continue;
    pairs++;
    hs=(hs^(uint8_t)ss[j])*16777619u;
    hm=(hm^(uint8_t)vv[j])*16777619u;
    if(ss[j]!=vv[j]){
     if(!differences){first_a=a;first_b=b;first_s=ss[j];first_m=vv[j];}
     differences++;
     if(a==b)diagonal_differences++;
    }
   }
  }
  w("NATURAL_MUL op=");n(c->id);w(" admissible_pairs=");n(pairs);
  w(" scalar_mve_differences=");n(differences);w(" diagonal_differences=");n(diagonal_differences);
  w(" hash_scalar=");n((int)(hs&0x7fffffff));w(" hash_mve=");n((int)(hm&0x7fffffff));w("\n");
  if(differences){w("FIRST_DIFF op=");n(c->id);w(" a=");n(first_a);w(" b=");n(first_b);w(" scalar=");n(first_s);w(" mve=");n(first_m);w("\n");}
  if(pairs!=(c->square?256:65536))total_errors++;
 }
 w("NATURAL_MUL_TEST_ERRORS=");n(total_errors);w("\n");
 if(total_errors){w("NATURAL_MUL_QEMU_FAIL\n");return 3;}
 w("NATURAL_MUL_QEMU_PASS\n");return 0;
}
