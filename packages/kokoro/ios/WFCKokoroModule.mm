#import "WFCKokoroModule.h"
#import <WFCKokoroSpec/WFCKokoroSpec.h>
#import <AVFoundation/AVFoundation.h>
#include <atomic>
#include "sherpa-onnx/c-api/c-api.h"

@interface WFCKokoroModule () <NativeKokoroSpec>
@end

@implementation WFCKokoroModule {
  const SherpaOnnxOfflineTts *_tts;
  AVAudioPlayer *_player;
  AVAudioEngine *_engine;
  AVAudioPlayerNode *_playerNode;
  AVAudioFormat *_streamFormat;
  std::atomic<bool> _stopRequested;
  std::atomic<bool> _playbackStarted;
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

typedef struct {
  __unsafe_unretained WFCKokoroModule *module;
  int32_t sampleRate;
  double speakStartMs;
  int32_t chunkCount;
  int64_t chunkSamples;
} KokoroStreamContext;

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
    cfg.max_num_sentences = 1;

    NSLog(@"[Kokoro] Calling SherpaOnnxCreateOfflineTts...");
    self->_tts = SherpaOnnxCreateOfflineTts(&cfg);
    NSLog(@"[Kokoro] SherpaOnnxCreateOfflineTts returned: %s", self->_tts ? "non-null" : "NULL");
    self->_tts ? resolve(@YES)
               : reject(@"load_failed", @"SherpaOnnxCreateOfflineTts returned NULL", nil);
  });
}

- (void)enqueueAudioChunk:(NSData *)chunk sampleRate:(int32_t)sampleRate speakStartMs:(double)speakStartMs {
  dispatch_async(dispatch_get_main_queue(), ^{
    if (self->_stopRequested.load() || !self->_playerNode || !self->_streamFormat) {
      return;
    }

    AVAudioFrameCount frameCount = (AVAudioFrameCount)(chunk.length / sizeof(float));
    if (frameCount == 0) {
      return;
    }

    AVAudioPCMBuffer *buffer = [[AVAudioPCMBuffer alloc] initWithPCMFormat:self->_streamFormat
                                                              frameCapacity:frameCount];
    if (!buffer) {
      NSLog(@"[Kokoro][Benchmark] failed to allocate AVAudioPCMBuffer");
      return;
    }
    buffer.frameLength = frameCount;
    memcpy(buffer.floatChannelData[0], chunk.bytes, chunk.length);
    [self->_playerNode scheduleBuffer:buffer completionHandler:nil];

    if (!self->_playbackStarted.load()) {
      NSError *engineErr = nil;
      if (!self->_engine.isRunning) {
        [self->_engine startAndReturnError:&engineErr];
      }

      if (engineErr) {
        NSLog(@"[Kokoro][Benchmark] playback engine_start_error=%@", engineErr.localizedDescription);
        return;
      }

      [self->_playerNode play];
      self->_playbackStarted.store(true);
      NSLog(@"[Kokoro][Benchmark] playback started ttfa_ms=%.2f sample_rate=%d",
            KokoroNowMs() - speakStartMs, sampleRate);
    }
  });
}

static int32_t KokoroStreamCallbackWithArg(const float *samples, int32_t n, void *arg) {
  KokoroStreamContext *ctx = (KokoroStreamContext *)arg;
  if (!ctx || !ctx->module) {
    return 0;
  }
  if (ctx->module->_stopRequested.load()) {
    return 0;
  }
  if (!samples || n <= 0) {
    return 1;
  }

  NSData *chunk = [NSData dataWithBytes:samples length:(NSUInteger)n * sizeof(float)];
  ctx->chunkCount += 1;
  ctx->chunkSamples += n;
  [ctx->module enqueueAudioChunk:chunk sampleRate:ctx->sampleRate speakStartMs:ctx->speakStartMs];
  return 1;
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

    self->_stopRequested.store(false);
    self->_playbackStarted.store(false);
    int32_t ttsSampleRate = SherpaOnnxOfflineTtsSampleRate(self->_tts);
    if (ttsSampleRate <= 0) {
      ttsSampleRate = 24000;
    }

    __block NSError *setupErr = nil;
    dispatch_sync(dispatch_get_main_queue(), ^{
      if (self->_player) {
        [self->_player stop];
        self->_player = nil;
      }
      if (self->_playerNode) {
        [self->_playerNode stop];
      }
      if (self->_engine) {
        [self->_engine stop];
      }

      self->_engine = [[AVAudioEngine alloc] init];
      self->_playerNode = [[AVAudioPlayerNode alloc] init];
      self->_streamFormat = [[AVAudioFormat alloc] initWithCommonFormat:AVAudioPCMFormatFloat32
                                                              sampleRate:ttsSampleRate
                                                                channels:1
                                                             interleaved:NO];
      [self->_engine attachNode:self->_playerNode];
      [self->_engine connect:self->_playerNode to:self->_engine.mainMixerNode format:self->_streamFormat];

      AVAudioSession *session = [AVAudioSession sharedInstance];
      [session setCategory:AVAudioSessionCategoryPlayback
               withOptions:0
                     error:&setupErr];
      if (!setupErr) {
        [session setActive:YES error:&setupErr];
      }
      if (!setupErr) {
        [self->_engine prepare];
        if (![self->_engine startAndReturnError:&setupErr]) {
          if (!setupErr) {
            setupErr = [NSError errorWithDomain:@"WFCKokoro"
                                           code:-1
                                       userInfo:@{NSLocalizedDescriptionKey: @"Failed to start AVAudioEngine"}];
          }
        }
      }
    });

    if (setupErr) {
      reject(@"PLAY_SETUP_ERROR", setupErr.localizedDescription, setupErr);
      return;
    }

    KokoroStreamContext ctx = {};
    ctx.module = self;
    ctx.sampleRate = ttsSampleRate;
    ctx.speakStartMs = speakStartMs;

    // sherpa-onnx handles G2P + chunking + inference and streams chunks to callback.
    double generateStartMs = KokoroNowMs();
    const SherpaOnnxGeneratedAudio *audio =
      SherpaOnnxOfflineTtsGenerateWithCallbackWithArg(
        self->_tts, text.UTF8String, 0, (float)speed, KokoroStreamCallbackWithArg, &ctx);
    double generateMs = KokoroNowMs() - generateStartMs;

    if (!audio || audio->n == 0 || ctx.chunkCount == 0) {
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
    NSLog(@"[Kokoro][Benchmark] infer generate_ms=%.2f samples=%d sample_rate=%d audio_ms=%.2f rtf=%.3f chunks=%d chunk_samples=%lld",
          generateMs, audio->n, audio->sample_rate, audioMs, rtf, ctx.chunkCount, ctx.chunkSamples);
    SherpaOnnxDestroyOfflineTtsGeneratedAudio(audio);

    // Wait for queued playback to finish before resolving the JS promise.
    // This keeps the app-level VAD/mic lock active for the full speech duration.
    dispatch_semaphore_t playbackDone = dispatch_semaphore_create(0);
    dispatch_sync(dispatch_get_main_queue(), ^{
      if (self->_stopRequested.load() || !self->_playerNode || !self->_streamFormat) {
        dispatch_semaphore_signal(playbackDone);
        return;
      }

      AVAudioPCMBuffer *sentinel = [[AVAudioPCMBuffer alloc] initWithPCMFormat:self->_streamFormat
                                                                   frameCapacity:1];
      if (!sentinel) {
        dispatch_semaphore_signal(playbackDone);
        return;
      }
      sentinel.frameLength = 1;
      sentinel.floatChannelData[0][0] = 0.0f;

      [self->_playerNode scheduleBuffer:sentinel completionHandler:^{
        dispatch_semaphore_signal(playbackDone);
      }];
    });

    // Audio duration + buffer for engine scheduling/jitter.
    int64_t waitMs = (int64_t)MAX(1000.0, audioMs + 2000.0);
    long waitResult = dispatch_semaphore_wait(
      playbackDone,
      dispatch_time(DISPATCH_TIME_NOW, waitMs * NSEC_PER_MSEC)
    );
    if (waitResult != 0) {
      NSLog(@"[Kokoro][Benchmark] playback wait timeout wait_ms=%lld", waitMs);
    }

    double totalMs = KokoroNowMs() - speakStartMs;
    NSLog(@"[Kokoro][Benchmark] speak done total_ms=%.2f", totalMs);
    resolve(nil);
  });
}

- (void)stop:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  self->_stopRequested.store(true);
  dispatch_sync(dispatch_get_main_queue(), ^{
    [self->_player stop];
    [self->_playerNode stop];
    [self->_engine stop];
  });
  resolve(nil);
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
