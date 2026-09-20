ENTRY(reset_handler)
MEMORY { FLASH (rx) : ORIGIN = 0x00000000, LENGTH = 512K
 RAM (rwx) : ORIGIN = 0x21000000, LENGTH = 4M }
SECTIONS {
 .vectors 0x00000000 : { KEEP(*(.vectors)) } > FLASH
 .text : { *(.text*) *(.rodata*) . = ALIGN(4); } > FLASH
 .data : { __data_start = .; *(.data*) . = ALIGN(4); __data_end = .; } > RAM AT > FLASH
 __data_load = LOADADDR(.data);
 .bss (NOLOAD) : { __bss_start = .; *(.bss*) *(COMMON) . = ALIGN(4); __bss_end = .; } > RAM
 /DISCARD/ : { *(.comment*) *(.note*) *(.ARM.exidx*) *(.ARM.extab*) }
}
