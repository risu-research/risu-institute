/* RFC 8439 section 2.1.1: a freestanding, four-word quarter-round workload.
 * Inputs and outputs live on an external word-addressable memory interface. */
typedef unsigned int u32;
#define IN ((volatile u32 *)0x1000u)
#define OUT ((volatile u32 *)0x1100u)
static inline u32 rotl(u32 x, unsigned k) { return (x << k) | (x >> (32u-k)); }
void _start(void) {
    u32 a=IN[0], b=IN[1], c=IN[2], d=IN[3];
    a+=b; d^=a; d=rotl(d,16);
    c+=d; b^=c; b=rotl(b,12);
    a+=b; d^=a; d=rotl(d,8);
    c+=d; b^=c; b=rotl(b,7);
    OUT[0]=a; OUT[1]=b; OUT[2]=c; OUT[3]=d;
    OUT[4]=0x600dfeedu;
    for(;;) { __asm__ volatile ("nop"); }
}
