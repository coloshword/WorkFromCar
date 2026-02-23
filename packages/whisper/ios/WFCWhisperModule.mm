#import "WFCWhisperModule.h"
#import <WFCWhisperSpec/WFCWhisperSpec.h>
#include "include/whisper.h"   // from HEADER_SEARCH_PATHS

@interface WFCWhisperModule () <NativeWhisperSpec>
@end

@implementation WFCWhisperModule {
  struct whisper_context *_ctx;
}

RCT_EXPORT_MODULE(WFCWhisper)

- (void)loadModel:(NSString *)modelPath
          resolve:(RCTPromiseResolveBlock)resolve
           reject:(RCTPromiseRejectBlock)reject {
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    struct whisper_context_params params = whisper_context_default_params();
    params.use_gpu = YES;
    struct whisper_context *ctx = whisper_init_from_file_with_params(
      modelPath.UTF8String, params
    );
    if (ctx != NULL) {
      if (self->_ctx) whisper_free(self->_ctx);
      self->_ctx = ctx;
      resolve(@YES);
    } else {
      reject(@"load_failed", @"whisper_init_from_file returned NULL", nil);
    }
  });
}

- (void)pcmBufferToText:(NSArray<NSNumber *> *)pcmBuffer
              resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject {
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    struct whisper_full_params wparams = whisper_full_default_params(WHISPER_SAMPLING_GREEDY);
    wparams.print_progress = false;
    wparams.print_timestamps = false;
    wparams.print_special = false;
    wparams.print_realtime = false;
    wparams.language = "en";
    wparams.no_timestamps = true;
    wparams.n_threads = 8;
    if (self->_ctx == NULL) {
      // need to load model first
      reject(
        @"NO_MODEL",
        @"You need to load the model first",
        nil
      );
      return;
    }
    // convert pcmBuffer to float array
    float *buffer = (float *)malloc(sizeof(float) * pcmBuffer.count);
    if (buffer == NULL) {
      reject(@"MALLOC_ERROR", @"Failed to allocate PCM buffer", nil);
      return;
    }
    for (NSInteger i = 0; i < pcmBuffer.count; i++) {
      // f is just telling us that this is a float, not a double 
      buffer[i] = [pcmBuffer[i] floatValue] / 32768.0f;
    }
    // call whisper full
    int transcriptionResult = whisper_full(
      self->_ctx,
      wparams,
      buffer,
      (int)pcmBuffer.count
    );
    if (transcriptionResult != 0) {
      free(buffer);
      reject(
        @"WHISPER_ERROR",
        @"whisper_full returned an error",
        nil
     );
      return;
    }
    // get the transcription result 
    int nSegments = whisper_full_n_segments(self->_ctx);
    NSMutableString *transcription = [NSMutableString string];
    for (int i = 0; i < nSegments; i++) {
      const char *segmentText = whisper_full_get_segment_text(self->_ctx, i);
      if (segmentText == NULL) continue;
      NSString *s = [NSString stringWithUTF8String: segmentText];
      if (s == nil) continue;
      [transcription appendString: s];
    }
    free(buffer);
    resolve(transcription);
  });
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeWhisperSpecJSI>(params);
}

@end
