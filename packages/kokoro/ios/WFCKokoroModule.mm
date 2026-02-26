#import "WFCKokoroModule.h"
#import <WFCKokoroSpec/WFCKokoroSpec.h>
#import <AVFoundation/AVFoundation.h>
#include "sherpa-onnx/c-api/c-api.h"

@interface WFCKokoroModule () <NativeKokoroSpec>
@end

@implementation WFCKokoroModule {
  const SherpaOnnxOfflineTts *_tts;
  AVAudioPlayer *_player;
}

RCT_EXPORT_MODULE(WFCKokoro)

- (void)loadModel:(NSString *)modelDir
          resolve:(RCTPromiseResolveBlock)resolve
           reject:(RCTPromiseRejectBlock)reject {
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    if (self->_tts) {
      SherpaOnnxDestroyOfflineTts(self->_tts);
      self->_tts = NULL;
    }

    SherpaOnnxOfflineTtsKokoroModelConfig kokoro = {};
    kokoro.model    = [[modelDir stringByAppendingPathComponent:@"model.onnx"] UTF8String];
    kokoro.voices   = [[modelDir stringByAppendingPathComponent:@"voices.bin"] UTF8String];
    kokoro.tokens   = [[modelDir stringByAppendingPathComponent:@"tokens.txt"] UTF8String];
    kokoro.data_dir = [[modelDir stringByAppendingPathComponent:@"espeak-ng-data"] UTF8String];
    kokoro.length_scale = 1.0;

    SherpaOnnxOfflineTtsModelConfig model_cfg = {};
    model_cfg.kokoro = kokoro;
    model_cfg.num_threads = 4;
    model_cfg.provider = "cpu";

    SherpaOnnxOfflineTtsConfig cfg = {};
    cfg.model = model_cfg;
    cfg.max_num_sentences = 2; // sherpa-onnx chunks internally per sentence

    self->_tts = SherpaOnnxCreateOfflineTts(&cfg);
    self->_tts ? resolve(@YES)
               : reject(@"load_failed", @"SherpaOnnxCreateOfflineTts returned NULL", nil);
  });
}

@end
