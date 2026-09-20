/* Freestanding AN547 Cortex-M55 vector table, SRAM initialization and semihost exit. */
#include <stdint.h>
extern int main(void);
extern uint32_t __data_load,__data_start,__data_end,__bss_start,__bss_end;
__attribute__((noreturn)) void fault(void){for(;;) __asm volatile("bkpt #0");}
__attribute__((noreturn)) void reset_handler(void) {
 for(uint32_t *p=&__data_start,*q=&__data_load;p<&__data_end;)*p++=*q++;
 for(uint32_t *p=&__bss_start;p<&__bss_end;)*p++=0;
 int rc=main();
 static uint32_t block[2];block[0]=0x20026;block[1]=(uint32_t)rc;
 __asm volatile("mov r0,#0x20\n mov r1,%0\n bkpt #0xab"::"r"(block):"r0","r1","memory");
 for(;;){}
}
__attribute__((section(".vectors"),used)) const uintptr_t vectors[]={0x21010000u,(uintptr_t)reset_handler,(uintptr_t)fault,(uintptr_t)fault,(uintptr_t)fault,(uintptr_t)fault,(uintptr_t)fault,(uintptr_t)fault,(uintptr_t)fault,(uintptr_t)fault,(uintptr_t)fault,(uintptr_t)fault,(uintptr_t)fault,(uintptr_t)fault,(uintptr_t)fault,(uintptr_t)fault};
