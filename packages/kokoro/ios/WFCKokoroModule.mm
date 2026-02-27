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

    NSFileManager *fm = [NSFileManager defaultManager];
    NSArray<NSString *> *expectedFiles = @[@"model.onnx", @"voices.bin", @"tokens.txt", @"espeak-ng-data"];
    NSLog(@"[Kokoro] modelDir: %@", modelDir);
    for (NSString *f in expectedFiles) {
      NSString *path = [modelDir stringByAppendingPathComponent:f];
      BOOL exists = [fm fileExistsAtPath:path];
      NSLog(@"[Kokoro] %@: %@ @ %@", f, exists ? @"EXISTS" : @"MISSING", path);
    }

    SherpaOnnxOfflineTtsKokoroModelConfig kokoro = {};
    NSString *modelPath   = [modelDir stringByAppendingPathComponent:@"model.onnx"];
    NSString *voicesPath  = [modelDir stringByAppendingPathComponent:@"voices.bin"];
    NSString *tokensPath  = [modelDir stringByAppendingPathComponent:@"tokens.txt"];
    NSString *dataDir     = [modelDir stringByAppendingPathComponent:@"espeak-ng-data"];
    kokoro.model    = [modelPath UTF8String];
    kokoro.voices   = [voicesPath UTF8String];
    kokoro.tokens   = [tokensPath UTF8String];
    kokoro.data_dir = [dataDir UTF8String];
    kokoro.length_scale = 1.0;

    NSLog(@"[Kokoro] model:    %s", kokoro.model);
    NSLog(@"[Kokoro] voices:   %s", kokoro.voices);
    NSLog(@"[Kokoro] tokens:   %s", kokoro.tokens);
    NSLog(@"[Kokoro] data_dir: %s", kokoro.data_dir);

    SherpaOnnxOfflineTtsModelConfig model_cfg = {};
    model_cfg.kokoro = kokoro;
    model_cfg.num_threads = 4;
    model_cfg.provider = "cpu";

    SherpaOnnxOfflineTtsConfig cfg = {};
    cfg.model = model_cfg;
    cfg.max_num_sentences = 2;

    NSLog(@"[Kokoro] Calling SherpaOnnxCreateOfflineTts...");
    self->_tts = SherpaOnnxCreateOfflineTts(&cfg);
    NSLog(@"[Kokoro] SherpaOnnxCreateOfflineTts returned: %s", self->_tts ? "non-null" : "NULL");
    self->_tts ? resolve(@YES)
               : reject(@"load_failed", @"SherpaOnnxCreateOfflineTts returned NULL", nil);
  });
}

- (void)speak:(NSString *)text speed:(double)speed
      resolve:(RCTPromiseResolveBlock)resolve
       reject:(RCTPromiseRejectBlock)reject {
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    if (!self->_tts) {
      reject(@"NO_MODEL", @"Call loadModel first", nil);
      return;
    }
    // sherpa-onnx handles G2P + chunking + inference in one call
    const SherpaOnnxGeneratedAudio *audio =
      SherpaOnnxOfflineTtsGenerate(self->_tts, text.UTF8String, 0, (float)speed);

    if (!audio || audio->n == 0) {
      SherpaOnnxDestroyOfflineTtsGeneratedAudio(audio);
      reject(@"TTS_ERROR", @"Audio generation failed or returned empty", nil);
      return;
    }

    NSURL *tmpURL = [NSURL fileURLWithPath:
      [NSTemporaryDirectory() stringByAppendingPathComponent:@"kokoro_out.wav"]];
    [self writeWAV:audio->samples count:audio->n sampleRate:audio->sample_rate toURL:tmpURL];
    SherpaOnnxDestroyOfflineTtsGeneratedAudio(audio);

    dispatch_async(dispatch_get_main_queue(), ^{
      NSError *sessionErr = nil;
      AVAudioSession *session = [AVAudioSession sharedInstance];
      [session setCategory:AVAudioSessionCategoryPlayback
               withOptions:AVAudioSessionCategoryOptionDefaultToSpeaker
                     error:&sessionErr];
      [session setActive:YES error:nil];

      NSError *err = nil;
      self->_player = [[AVAudioPlayer alloc] initWithContentsOfURL:tmpURL error:&err];
      self->_player.volume = 1.0;
      err ? reject(@"PLAY_ERROR", err.localizedDescription, err) : ([self->_player play], resolve(nil));
    });
  });
}

- (void)stop:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  dispatch_async(dispatch_get_main_queue(), ^{
    [self->_player stop];
    resolve(nil);
  });
}

// float32 → int16 WAV (24000 Hz mono, which is Kokoro's output sample rate)
- (void)writeWAV:(const float *)samples count:(int)n sampleRate:(int)sr toURL:(NSURL *)url {
  uint32_t dataSize = n * 2;  // 16-bit = 2 bytes/sample
  NSMutableData *wav = [NSMutableData dataWithCapacity:44 + dataSize];
  uint32_t u32; uint16_t u16;
  [wav appendBytes:"RIFF" length:4];  u32 = 36 + dataSize; [wav appendBytes:&u32 length:4];
  [wav appendBytes:"WAVEfmt " length:8]; u32 = 16; [wav appendBytes:&u32 length:4];
  u16 = 1;  [wav appendBytes:&u16 length:2];  // PCM
  u16 = 1;  [wav appendBytes:&u16 length:2];  // mono
  u32 = sr; [wav appendBytes:&u32 length:4];  // sample rate
  u32 = sr * 2; [wav appendBytes:&u32 length:4]; // byte rate
  u16 = 2;  [wav appendBytes:&u16 length:2];  // block align
  u16 = 16; [wav appendBytes:&u16 length:2];  // bits/sample
  [wav appendBytes:"data" length:4];  u32 = dataSize; [wav appendBytes:&u32 length:4];
  for (int i = 0; i < n; i++) {
    float s = fmaxf(-1.0f, fminf(1.0f, samples[i]));
    int16_t pcm = (int16_t)(s * 32767.0f);
    [wav appendBytes:&pcm length:2];
  }
  [wav writeToURL:url atomically:YES];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeKokoroSpecJSI>(params);
}

@end
