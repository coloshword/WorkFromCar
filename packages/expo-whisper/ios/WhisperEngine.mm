#import "WhisperEngine.h"
#import <whisper/whisper.h>
#import <signal.h>
#import <execinfo.h>
#import <mach/mach.h>
#import <mach/mach_host.h>

// Signal handler for debugging crashes
void whisper_signal_handler(int sig) {
  NSLog(@"🔧 WhisperEngine CRASH: Caught signal %d", sig);
  void *callstack[128];
  int frames = backtrace(callstack, 128);
  char **strs = backtrace_symbols(callstack, frames);
  for (int i = 0; i < frames; i++) {
    NSLog(@"🔧 WhisperEngine BACKTRACE: %s", strs[i]);
  }
  free(strs);
  signal(sig, SIG_DFL);
  raise(sig);
}

@interface WhisperEngine () {
  struct whisper_context *_ctx;
}
@end

@implementation WhisperEngine

- (NSString *)ping {
  return @"pong-from-objc";
}

// - (instancetype)initWithModelPath:(NSString *)modelPath {
//   self = [super init];
//   if (!self) return nil;

//   _ctx = whisper_init_from_file([modelPath UTF8String]);
//   if (_ctx == NULL) {
//     @throw [NSException exceptionWithName:@"WhisperInitError"
//                                 reason:@"Failed to load whisper model"
//                                 userInfo:nil];
//   }
//   return self;
// }

- (instancetype)initWithModelPath:(NSString *)modelPath {
  NSLog(@"🔧 WhisperEngine: initWithModelPath called with: %@", modelPath);
  
  // Install signal handlers for crash debugging
  signal(SIGSEGV, whisper_signal_handler);
  signal(SIGABRT, whisper_signal_handler);
  signal(SIGILL, whisper_signal_handler);
  signal(SIGFPE, whisper_signal_handler);
  signal(SIGBUS, whisper_signal_handler);
  
  self = [super init];
  if (!self) {
    NSLog(@"🔧 WhisperEngine ERROR: [super init] failed");
    return nil;
  }
  
  // Verify file exists
  NSFileManager *fileManager = [NSFileManager defaultManager];
  if (![fileManager fileExistsAtPath:modelPath]) {
    NSLog(@"🔧 WhisperEngine ERROR: Model file does not exist at path: %@", modelPath);
    return nil;
  }
  
  NSError *error = nil;
  NSDictionary *attributes = [fileManager attributesOfItemAtPath:modelPath error:&error];
  if (error) {
    NSLog(@"🔧 WhisperEngine ERROR: Failed to get file attributes: %@", error.localizedDescription);
    return nil;
  }
  
  unsigned long long fileSize = [attributes fileSize];
  NSLog(@"🔧 WhisperEngine: File size: %llu bytes (%.2f MB)", fileSize, fileSize / 1024.0 / 1024.0);
  
  if (fileSize == 0) {
    NSLog(@"🔧 WhisperEngine ERROR: Model file is empty!");
    return nil;
  }
  
  // Check available memory
  mach_port_t host_port = mach_host_self();
  vm_size_t page_size;
  vm_statistics64_data_t vm_stat;
  mach_msg_type_number_t host_size = sizeof(vm_statistics64_data_t) / sizeof(integer_t);
  
  host_page_size(host_port, &page_size);
  host_statistics64(host_port, HOST_VM_INFO64, (host_info64_t)&vm_stat, &host_size);
  
  natural_t free_memory = (natural_t)(vm_stat.free_count * page_size) / 1024 / 1024;
  NSLog(@"🔧 WhisperEngine: Free memory: %u MB", free_memory);
  
  NSLog(@"🔧 WhisperEngine: About to initialize whisper context with params...");
  const char *cPath = [modelPath UTF8String];
  NSLog(@"🔧 WhisperEngine: C string path: %s", cPath);
  
  @try {
    // Use the newer whisper_init_from_file_with_params instead of deprecated function
    struct whisper_context_params cparams = whisper_context_default_params();
    cparams.use_gpu = true; // Enable GPU if available
    
    NSLog(@"🔧 WhisperEngine: Context params - use_gpu: %d", cparams.use_gpu);
    NSLog(@"🔧 WhisperEngine: Calling whisper_init_from_file_with_params NOW...");
    
    _ctx = whisper_init_from_file_with_params(cPath, cparams);
    
    NSLog(@"🔧 WhisperEngine: whisper_init_from_file_with_params returned");
    
    if (_ctx == NULL) {
      NSLog(@"🔧 WhisperEngine ERROR: whisper_init_from_file_with_params returned NULL!");
      NSLog(@"🔧 WhisperEngine ERROR: This usually means:");
      NSLog(@"🔧 WhisperEngine ERROR:   1. Model file is corrupted");
      NSLog(@"🔧 WhisperEngine ERROR:   2. Model file format is incompatible with this whisper.cpp version");
      NSLog(@"🔧 WhisperEngine ERROR:   3. Not enough memory to load the model (need ~%llu MB)", fileSize / 1024 / 1024);
      NSLog(@"🔧 WhisperEngine ERROR:   4. Model is not a valid GGML format");
      return nil;
    }
    
    NSLog(@"🔧 WhisperEngine: whisper_init_from_file_with_params SUCCESS! Context: %p", _ctx);
  } @catch (NSException *exception) {
    NSLog(@"🔧 WhisperEngine EXCEPTION: %@", exception.name);
    NSLog(@"🔧 WhisperEngine EXCEPTION reason: %@", exception.reason);
    NSLog(@"🔧 WhisperEngine EXCEPTION callStackSymbols: %@", exception.callStackSymbols);
    return nil;
  }
  
  return self;
}

- (void)dealloc {
  if (_ctx) {
    whisper_free(_ctx);
    _ctx = NULL;
  }
}
@end