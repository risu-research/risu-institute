/* Source-pinned CMSIS-NN v7.0.0 scalar pilot, NOT generic ISA verification. */
#include <stdint.h>
#include <assert.h>
#include "arm_nnsupportfunctions.h"
#ifndef SIZE
#define SIZE 1
#endif
/* Under CBMC each uninitialized local is an unconstrained symbolic input. */
static int32_t nd_i32(void) { int32_t x; return x; }
static int8_t nd_i8(void) { int8_t x; return x; }

/* Independent exact arithmetic specification for fixed input contract. */
static int32_t reference(int32_t v, int32_t m, int32_t s)
{
    int64_t d = (int64_t)1 << (31 - s);
    int64_t n = (int64_t)v * m + d/2;
    return (int32_t)(n >= 0 ? n/d : -((-n+d-1)/d));
}
/* Same mathematical specification, independently normalized after fixing
   multiplier to 2^29 or 2^30 and shift to -1,0,1. Unlike the first oracle
   this uses only a small signed 32-bit divisor. No assumption is made that
   the ordinary C division truncates negative values down: floor is explicit. */
static int32_t cheap_reference(int32_t v, int32_t m, int32_t s)
{
    int32_t denominator = (m == 536870912 ? (s == 1 ? 2 : (s == 0 ? 4 : 8))
                                         : (s == 1 ? 1 : (s == 0 ? 2 : 4)));
    int32_t n = v + denominator/2;
    return n >= 0 ? n/denominator : -((-n+denominator-1)/denominator);
}
#ifdef COMPOSED
/* The upstream source is cloned byte-for-byte except a mechanically audited
   replacement of five helper call sites; see run_fast.sh. No compiler/ISA
   equivalence is claimed. The helper lemma is separately PROVED first. */
static int32_t certified_ref(int32_t v, int32_t m, int32_t s)
{
    return cheap_reference(v,m,s);
}
#include "mul_composed.c"
#else
#include "arm_elementwise_mul_s8.c"
#endif
int main(void)
{
    int32_t m=nd_i32(), s=nd_i32();
    __CPROVER_assume(m==536870912 || m==1073741824);
    __CPROVER_assume(s>=-1 && s<=1);
#ifdef PROVE_FAST
    int32_t v=nd_i32();
    __CPROVER_assume(v>=-18500 && v<=18500);
    /* Two independent formulae must match THE ORIGINAL SOURCE function. */
    assert(reference(v,m,s)==cheap_reference(v,m,s));
    assert(arm_nn_requantize(v,m,s)==cheap_reference(v,m,s));
#else
    int8_t a[SIZE],b[SIZE],out[SIZE];
    int32_t o1=nd_i32(),o2=nd_i32(),out_off=nd_i32();
    __CPROVER_assume(o1>=-8 && o1<=8);
    __CPROVER_assume(o2>=-8 && o2<=8);
    __CPROVER_assume(out_off>=-8 && out_off<=8);
    for(int i=0;i<SIZE;i++){a[i]=nd_i8();b[i]=nd_i8();out[i]=0;}
    arm_cmsis_nn_status status=arm_elementwise_mul_s8(a,b,o1,o2,out,
                                   out_off,m,s,-100,100,SIZE);
    assert(status==ARM_CMSIS_NN_SUCCESS);
    for(int i=0;i<SIZE;i++){
        int32_t v=((int32_t)a[i]+o1)*((int32_t)b[i]+o2);
        int32_t expected=cheap_reference(v,m,s)+out_off;
        if(expected< -100)expected=-100;
        if(expected>100)expected=100;
#ifdef MUTANT
        if(i==0)expected^=1;
#endif
        assert((int32_t)out[i]==expected);
    }
#endif
    return 0;
}
