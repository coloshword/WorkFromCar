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
  });

  NSString *result = @"YAYYYYY";
  resolve(result);
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeWhisperSpecJSI>(params);
}

@end