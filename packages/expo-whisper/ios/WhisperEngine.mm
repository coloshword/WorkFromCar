#import "WhisperEngine.h"
#import <whisper/whisper.h>
#import <signal.h>
#import <execinfo.h>
#import <mach/mach.h>
#import <mach/mach_host.h>
#import <AVFoundation/AVFoundation.h>
#include <vector>

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

// Helper function to convert audio file to 16kHz mono float32 PCM for Whisper
std::vector<float> convertAudioToWhisperFormat(NSString *filePath, NSError **error) {
  NSLog(@"🔧 Converting audio file: %@", filePath);
  
  std::vector<float> audioData;
  
  // Handle file:// URLs
  NSURL *fileURL;
  if ([filePath hasPrefix:@"file://"]) {
    fileURL = [NSURL URLWithString:filePath];
  } else {
    fileURL = [NSURL fileURLWithPath:filePath];
  }
  
  // Check if file exists
  if (![[NSFileManager defaultManager] fileExistsAtPath:[fileURL path]]) {
    if (error) {
      *error = [NSError errorWithDomain:@"WhisperEngine" 
                                   code:404 
                               userInfo:@{NSLocalizedDescriptionKey: @"Audio file not found"}];
    }
    NSLog(@"🔧 ERROR: Audio file not found at: %@", [fileURL path]);
    return audioData;
  }
  
  // Create asset
  AVAsset *asset = [AVAsset assetWithURL:fileURL];
  if (!asset) {
    if (error) {
      *error = [NSError errorWithDomain:@"WhisperEngine" 
                                   code:500 
                               userInfo:@{NSLocalizedDescriptionKey: @"Failed to create AVAsset"}];
    }
    return audioData;
  }
  
  // Get audio track
  AVAssetTrack *audioTrack = [[asset tracksWithMediaType:AVMediaTypeAudio] firstObject];
  if (!audioTrack) {
    if (error) {
      *error = [NSError errorWithDomain:@"WhisperEngine" 
                                   code:500 
                               userInfo:@{NSLocalizedDescriptionKey: @"No audio track found"}];
    }
    return audioData;
  }
  
  // Setup asset reader
  NSError *readerError = nil;
  AVAssetReader *reader = [[AVAssetReader alloc] initWithAsset:asset error:&readerError];
  if (readerError) {
    if (error) *error = readerError;
    NSLog(@"🔧 ERROR: Failed to create asset reader: %@", readerError.localizedDescription);
    return audioData;
  }
  
  // Configure output settings for 16kHz mono float32 PCM
  NSDictionary *outputSettings = @{
    AVFormatIDKey: @(kAudioFormatLinearPCM),
    AVSampleRateKey: @(16000),
    AVNumberOfChannelsKey: @(1),
    AVLinearPCMBitDepthKey: @(32),
    AVLinearPCMIsFloatKey: @(YES),
    AVLinearPCMIsBigEndianKey: @(NO),
    AVLinearPCMIsNonInterleaved: @(NO)
  };
  
  AVAssetReaderTrackOutput *output = [[AVAssetReaderTrackOutput alloc] 
                                      initWithTrack:audioTrack 
                                      outputSettings:outputSettings];
  
  [reader addOutput:output];
  
  // Start reading
  if (![reader startReading]) {
    if (error) {
      *error = [NSError errorWithDomain:@"WhisperEngine" 
                                   code:500 
                               userInfo:@{NSLocalizedDescriptionKey: @"Failed to start reading"}];
    }
    NSLog(@"🔧 ERROR: Failed to start reading");
    return audioData;
  }
  
  NSLog(@"🔧 Started reading audio samples...");
  
  // Read all samples
  while (reader.status == AVAssetReaderStatusReading) {
    CMSampleBufferRef sampleBuffer = [output copyNextSampleBuffer];
    if (!sampleBuffer) break;
    
    CMBlockBufferRef blockBuffer = CMSampleBufferGetDataBuffer(sampleBuffer);
    if (blockBuffer) {
      size_t length = CMBlockBufferGetDataLength(blockBuffer);
      float *samples = (float *)malloc(length);
      
      CMBlockBufferCopyDataBytes(blockBuffer, 0, length, samples);
      
      size_t sampleCount = length / sizeof(float);
      audioData.insert(audioData.end(), samples, samples + sampleCount);
      
      free(samples);
    }
    
    CFRelease(sampleBuffer);
  }
  
  if (reader.status == AVAssetReaderStatusFailed) {
    if (error) *error = reader.error;
    NSLog(@"🔧 ERROR: Reader failed: %@", reader.error.localizedDescription);
    return std::vector<float>();
  }
  
  NSLog(@"🔧 Audio conversion complete: %zu samples (%.2f seconds)", 
        audioData.size(), audioData.size() / 16000.0);
  
  return audioData;
}

@interface WhisperEngine () {
  struct whisper_context *_ctx;
}
@end

@implementation WhisperEngine

- (NSString *)ping {
  return @"pong-from-objc";
}

- (NSString *)transcribeFile:(NSString *)filePath {
  NSLog(@"OBJECTIVE-C: WhisperEngine: transcribeFile called with: %@", filePath);
  
  NSError *conversionError = nil;
  std::vector<float> audioData = convertAudioToWhisperFormat(filePath, &conversionError);
  
  if (conversionError) {
    NSLog(@"🔧 ERROR: Audio conversion failed: %@", conversionError.localizedDescription);
    return [NSString stringWithFormat:@"Error: %@", conversionError.localizedDescription];
  }
  
  if (audioData.empty()) {
    NSLog(@"🔧 ERROR: No audio data after conversion");
    return @"Error: No audio data";
  }
  
  NSLog(@"🔧 Audio converted successfully: %zu samples", audioData.size());
  struct whisper_full_params params = whisper_full_default_params(WHISPER_SAMPLING_GREEDY);
  params.print_progress = false;
  params.print_special = false;
  params.print_realtime = false;
  params.print_timestamps = false;
  params.translate = false;
  params.language = "en";
  params.n_threads = 4;
  if (whisper_full(_ctx, params, audioData.data(), (int)audioData.size()) != 0) {
      return @"Error: Transcription failed";
  }

  NSMutableString *result = [NSMutableString string];
  int n_segments = whisper_full_n_segments(_ctx);
  for (int i = 0; i < n_segments; ++i) {
      const char *text = whisper_full_get_segment_text(_ctx, i);
      [result appendString:[NSString stringWithUTF8String:text]];
  }

  NSString *transcription = [NSString stringWithFormat:@"%@", result];
  return transcription;
}

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
    struct whisper_context_params cparams = whisper_context_default_params();
    
    #if TARGET_OS_SIMULATOR
    cparams.use_gpu = false;
    NSLog(@"🔧 WhisperEngine: Running on SIMULATOR - GPU disabled");
    #else
    cparams.use_gpu = false; // set to use true when we fix the issue of the gpu
    NSLog(@"🔧 WhisperEngine: Running on DEVICE - GPU enabled");
    #endif
    
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