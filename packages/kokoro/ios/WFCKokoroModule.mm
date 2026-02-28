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

static double KokoroNowMs(void) {
  return CFAbsoluteTimeGetCurrent() * 1000.0;
}

static NSInteger KokoroEstimateSentenceCount(NSString *text) {
  if (text.length == 0) {
    return 0;
  }
  NSInteger count = 0;
  for (NSUInteger i = 0; i < text.length; ++i) {
    unichar c = [text characterAtIndex:i];
    if (c == '.' || c == '!' || c == '?' || c == '\n') {
      count++;
    }
  }
  return MAX((NSInteger)1, count);
}

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
    double speakStartMs = KokoroNowMs();
    if (!self->_tts) {
      reject(@"NO_MODEL", @"Call loadModel first", nil);
      return;
    }
    NSInteger textLength = text.length;
    NSInteger sentenceCount = KokoroEstimateSentenceCount(text);
    NSLog(@"[Kokoro][Benchmark] speak request text_len=%ld sentences=%ld speed=%.2f",
          (long)textLength, (long)sentenceCount, speed);

    // sherpa-onnx handles G2P + chunking + inference in one call
    double generateStartMs = KokoroNowMs();
    const SherpaOnnxGeneratedAudio *audio =
      SherpaOnnxOfflineTtsGenerate(self->_tts, text.UTF8String, 0, (float)speed);
    double generateMs = KokoroNowMs() - generateStartMs;

    if (!audio || audio->n == 0) {
      SherpaOnnxDestroyOfflineTtsGeneratedAudio(audio);
      NSLog(@"[Kokoro][Benchmark] speak failed generate_ms=%.2f total_ms=%.2f",
            generateMs, KokoroNowMs() - speakStartMs);
      reject(@"TTS_ERROR", @"Audio generation failed or returned empty", nil);
      return;
    }

    double audioMs = (audio->sample_rate > 0)
      ? (1000.0 * (double)audio->n / (double)audio->sample_rate)
      : 0.0;
    double rtf = (audioMs > 0.0) ? (generateMs / audioMs) : -1.0;
    NSLog(@"[Kokoro][Benchmark] infer generate_ms=%.2f samples=%d sample_rate=%d audio_ms=%.2f rtf=%.3f",
          generateMs, audio->n, audio->sample_rate, audioMs, rtf);

    NSURL *tmpURL = [NSURL fileURLWithPath:
      [NSTemporaryDirectory() stringByAppendingPathComponent:@"kokoro_out.wav"]];
    double wavStartMs = KokoroNowMs();
    [self writeWAV:audio->samples count:audio->n sampleRate:audio->sample_rate toURL:tmpURL];
    double wavMs = KokoroNowMs() - wavStartMs;
    NSLog(@"[Kokoro][Benchmark] wav write_ms=%.2f path=%@", wavMs, tmpURL.path);
    SherpaOnnxDestroyOfflineTtsGeneratedAudio(audio);

    dispatch_async(dispatch_get_main_queue(), ^{
      double mainQueueStartMs = KokoroNowMs();
      NSError *sessionErr = nil;
      AVAudioSession *session = [AVAudioSession sharedInstance];
      [session setCategory:AVAudioSessionCategoryPlayback
               withOptions:AVAudioSessionCategoryOptionDefaultToSpeaker
                     error:&sessionErr];
      [session setActive:YES error:nil];

      NSError *err = nil;
      double playerInitStartMs = KokoroNowMs();
      self->_player = [[AVAudioPlayer alloc] initWithContentsOfURL:tmpURL error:&err];
      double playerInitMs = KokoroNowMs() - playerInitStartMs;
      self->_player.volume = 1.0;
      if (err) {
        NSLog(@"[Kokoro][Benchmark] playback init_error player_init_ms=%.2f total_ms=%.2f error=%@",
              playerInitMs, KokoroNowMs() - speakStartMs, err.localizedDescription);
        reject(@"PLAY_ERROR", err.localizedDescription, err);
        return;
      }

      double playStartMs = KokoroNowMs();
      BOOL didPlay = [self->_player play];
      double playCallMs = KokoroNowMs() - playStartMs;
      double mainQueueMs = KokoroNowMs() - mainQueueStartMs;
      double totalMs = KokoroNowMs() - speakStartMs;
      double ttfaProxyMs = generateMs + wavMs + playerInitMs + playCallMs;
      NSLog(@"[Kokoro][Benchmark] playback player_init_ms=%.2f play_call_ms=%.2f main_queue_ms=%.2f did_play=%s",
            playerInitMs, playCallMs, mainQueueMs, didPlay ? "true" : "false");
      NSLog(@"[Kokoro][Benchmark] speak done total_ms=%.2f ttfa_proxy_ms=%.2f",
            totalMs, ttfaProxyMs);
      resolve(nil);
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
