/* Minimal SMT-LIB2 runner. Compile against a pinned libz3.so (4.13.3.0).
   Uses the same Z3_eval_smtlib2_string API as the independently audited
   offline experiment. All log output and failure states are preserved. */
#include <stdio.h>
#include <stdlib.h>
typedef void *Z3_context;
typedef void *Z3_config;
extern Z3_config Z3_mk_config(void);
extern Z3_context Z3_mk_context(Z3_config);
extern void Z3_del_context(Z3_context);
extern void Z3_del_config(Z3_config);
extern const char *Z3_eval_smtlib2_string(Z3_context,const char*);
int main(int argc,char **argv) {
  if(argc!=2) {fprintf(stderr,"usage: z3_smt_driver query.smt2\n");return 2;}
  FILE*f=fopen(argv[1],"rb");if(!f){perror("open");return 2;}
  if(fseek(f,0,SEEK_END)){perror("seek");return 2;}
  long n=ftell(f);rewind(f);
  char*b=malloc((size_t)n+1);
  if(!b||fread(b,1,(size_t)n,f)!=(size_t)n){perror("read");return 2;}
  fclose(f);b[n]=0;
  Z3_config c=Z3_mk_config();Z3_context z=Z3_mk_context(c);Z3_del_config(c);
  fprintf(stderr,"Z3_QUERY_BYTES %ld\n",n);fflush(stderr);
  const char *result=Z3_eval_smtlib2_string(z,b);
  if(!result){fprintf(stderr,"Z3_NULL_RESULT\n");return 1;}
  puts(result);fflush(stdout);
  Z3_del_context(z);free(b);return 0;
}
