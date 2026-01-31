import ExpoModulesCore
import Foundation
import AVFoundation

enum WhisperError: Error { 
  case initFailed(String)
  
  var localizedDescription: String {
    switch self {
    case .initFailed(let msg):
      return "Whisper initialization failed: \(msg)"
    }
  }
}

public class ExpoWhisperModule: Module {
  private var engine: WhisperEngine?;
  private let ttsSynth = AVSpeechSynthesizer();
  private let ttsSession = AVAudioSession.sharedInstance();
  
  // VAD and continuous recording state
  private var audioRecorder: AVAudioRecorder?
  private var vadTimer: Timer?
  private var isListening: Bool = false
  private var isVoiceDetected: Bool = false
  private var silenceStartTime: Date?
  private var recordingStartTime: Date?
  private var currentRecordingURL: URL?
  
  // VAD configuration
  private let VAD_THRESHOLD: Float = -40.0  // dB threshold for voice detection
  private let SILENCE_DURATION: Double = 1.5  // seconds of silence before stopping
  private let MAX_RECORDING_DURATION: Double = 30.0  // max recording length
  private let VAD_INTERVAL: Double = 0.05  // 50ms between checks

  public func definition() -> ModuleDefinition {
    Name("ExpoWhisper")
    
    // Events for voice activity detection
    Events("onVoiceStart", "onVoiceStop", "onTranscriptionComplete")

    Function("ping") { () -> String in
      "pong"
    }

    Function("pingFromObjc") {
      let engine = WhisperEngine();
      return engine.ping();
    }

    AsyncFunction("transcribeFile") { (filePath: String) async throws -> String in
      let transcription = engine?.transcribeFile(filePath);
      return transcription ?? "Error: Transcription failed"
    }

    AsyncFunction("init") { (modelPath: String) async throws -> Void in
      
      let url = URL(string: modelPath)
      
      let fsPath = (url?.isFileURL == true) ? url!.path : modelPath
      
      // Check if file exists
      let fileManager = FileManager.default
      let fileExists = fileManager.fileExists(atPath: fsPath)
      
      if fileExists {
        do {
          let attributes = try fileManager.attributesOfItem(atPath: fsPath)
          if let fileSize = attributes[.size] as? NSNumber {
          }
        } catch {
          NSLog("🎤 ExpoWhisper: Error getting file attributes: %@", error.localizedDescription)
        }
      }
      
      guard let e = WhisperEngine(modelPath: fsPath) else {
        let errorMsg = "whisper_init_from_file failed for path: \(fsPath)"
        throw WhisperError.initFailed(errorMsg)
      }
      self.engine = e
    }

    Function("ttsConfigure") { (duckOthers: Bool) in
      // Optional: call once on app start
      do {
        if duckOthers {
          try self.ttsSession.setCategory(.playback, mode: .spokenAudio, options: [.duckOthers])
        } else {
          try self.ttsSession.setCategory(.playback, mode: .spokenAudio)
        }
        try self.ttsSession.setActive(true)
      } catch {
        NSLog("🗣️ TTS: audio session error: %@", error.localizedDescription)
      }
    }

    Function("ttsSpeak") { (text: String, language: String?, rate: Double?, pitch: Double?, volume: Double?) in
      DispatchQueue.main.async {
        if self.ttsSynth.isSpeaking {
          self.ttsSynth.stopSpeaking(at: .immediate)
        }

        let u = AVSpeechUtterance(string: text)

        if let language = language, !language.isEmpty {
          let voices = AVSpeechSynthesisVoice.speechVoices()
          if let enhanced = voices.first(where: {
            $0.language == language && $0.quality == .enhanced
          }) {
            u.voice = enhanced
          } else {
            u.voice = AVSpeechSynthesisVoice(language: language)
          }
        }

        u.rate = AVSpeechUtteranceDefaultSpeechRate * 0.9
        u.pitchMultiplier = 1.0
        u.volume = 1.0

        self.ttsSynth.speak(u)
      }
    }

    Function("ttsStop") {
      DispatchQueue.main.async {
        self.ttsSynth.stopSpeaking(at: .immediate)
      }
    }

    Function("ttsIsSpeaking") { () -> Bool in
      return self.ttsSynth.isSpeaking
    }
    
    // MARK: - Continuous Recording & VAD Functions
    
    Function("startContinuousRecording") { () -> Bool in
      return self.startContinuousRecording()
    }
    
    Function("stopContinuousRecording") { () -> Void in
      self.stopContinuousRecording()
    }
    
    Function("pauseListening") { () -> Void in
      self.pauseListening()
    }
    
    Function("resumeListening") { () -> Void in
      self.resumeListening()
    }
    
    Function("isListening") { () -> Bool in
      return self.isListening
    }
    
    Function("isVoiceDetected") { () -> Bool in
      return self.isVoiceDetected
    }
  }
  
  // MARK: - Private VAD Implementation
  
  private func startContinuousRecording() -> Bool {
    guard !isListening else {
      NSLog("🎤 VAD: Already listening")
      return false
    }
    
    do {
      // Configure audio session for recording
      let audioSession = AVAudioSession.sharedInstance()
      try audioSession.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker])
      try audioSession.setActive(true)
      
      // Create temp file for recording
      let tempDir = FileManager.default.temporaryDirectory
      let recordingURL = tempDir.appendingPathComponent("vad_recording_\(Date().timeIntervalSince1970).m4a")
      currentRecordingURL = recordingURL
      
      // Configure recorder settings
      let settings: [String: Any] = [
        AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
        AVSampleRateKey: 16000.0,
        AVNumberOfChannelsKey: 1,
        AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
      ]
      
      // Initialize recorder
      audioRecorder = try AVAudioRecorder(url: recordingURL, settings: settings)
      audioRecorder?.isMeteringEnabled = true
      audioRecorder?.delegate = self
      
      guard audioRecorder?.prepareToRecord() == true else {
        NSLog("🎤 VAD: Failed to prepare recorder")
        return false
      }
      
      // Start recording
      audioRecorder?.record()
      isListening = true
      isVoiceDetected = false
      
      // Start VAD timer
      DispatchQueue.main.async {
        self.vadTimer = Timer.scheduledTimer(
          timeInterval: self.VAD_INTERVAL,
          target: self,
          selector: #selector(self.vadTimerCallback),
          userInfo: nil,
          repeats: true
        )
      }
      
      NSLog("🎤 VAD: Started continuous recording")
      return true
      
    } catch {
      NSLog("🎤 VAD: Error starting recording: %@", error.localizedDescription)
      return false
    }
  }
  
  private func stopContinuousRecording() {
    vadTimer?.invalidate()
    vadTimer = nil
    
    audioRecorder?.stop()
    audioRecorder = nil
    
    // Clean up temp file
    if let url = currentRecordingURL {
      try? FileManager.default.removeItem(at: url)
      currentRecordingURL = nil
    }
    
    isListening = false
    isVoiceDetected = false
    silenceStartTime = nil
    recordingStartTime = nil
    
    NSLog("🎤 VAD: Stopped continuous recording")
  }
  
  private func pauseListening() {
    guard isListening else { return }
    
    // Stop VAD timer but keep recorder running
    vadTimer?.invalidate()
    vadTimer = nil
    
    // Reset state
    isVoiceDetected = false
    silenceStartTime = nil
    recordingStartTime = nil
    
    NSLog("🎤 VAD: Paused listening (waiting for agent)")
  }
  
  private func resumeListening() {
    guard isListening else { 
      // If not listening at all, start fresh
      _ = startContinuousRecording()
      return
    }
    
    // Restart VAD timer
    DispatchQueue.main.async {
      self.vadTimer = Timer.scheduledTimer(
        timeInterval: self.VAD_INTERVAL,
        target: self,
        selector: #selector(self.vadTimerCallback),
        userInfo: nil,
        repeats: true
      )
    }
    
    NSLog("🎤 VAD: Resumed listening")
  }
  
  @objc private func vadTimerCallback() {
    guard let recorder = audioRecorder, recorder.isRecording else { return }
    
    // Update audio meters
    recorder.updateMeters()
    
    // Get average power (in dB)
    let averagePower = recorder.averagePower(forChannel: 0)
    
    let now = Date()
    
    if isVoiceDetected {
      // Currently recording voice - check for silence
      if averagePower < VAD_THRESHOLD {
        // Silence detected
        if silenceStartTime == nil {
          silenceStartTime = now
        }
        
        // Check if silence has persisted long enough
        if let silenceStart = silenceStartTime,
           now.timeIntervalSince(silenceStart) >= SILENCE_DURATION {
          // Voice stopped - process recording
          handleVoiceStop()
        }
      } else {
        // Voice continuing - reset silence timer
        silenceStartTime = nil
      }
      
      // Check max duration
      if let recordingStart = recordingStartTime,
         now.timeIntervalSince(recordingStart) >= MAX_RECORDING_DURATION {
        NSLog("🎤 VAD: Max recording duration reached")
        handleVoiceStop()
      }
      
    } else {
      // Waiting for voice - check if above threshold
      if averagePower >= VAD_THRESHOLD {
        // Voice detected!
        handleVoiceStart()
      }
    }
  }
  
  private func handleVoiceStart() {
    isVoiceDetected = true
    recordingStartTime = Date()
    silenceStartTime = nil
    
    NSLog("🎤 VAD: Voice START detected")
    
    // Emit event to JavaScript
    sendEvent("onVoiceStart", [:])
  }
  
  private func handleVoiceStop() {
    guard isVoiceDetected else { return }
    
    isVoiceDetected = false
    silenceStartTime = nil
    recordingStartTime = nil
    
    NSLog("🎤 VAD: Voice STOP detected - processing transcription")
    
    // Emit event to JavaScript
    sendEvent("onVoiceStop", [:])
    
    // Process the recording
    processTranscription()
  }
  
  private func processTranscription() {
    guard let recorder = audioRecorder, let recordingURL = currentRecordingURL else { return }
    
    // Stop the current recording
    recorder.stop()
    
    // Transcribe on background thread
    DispatchQueue.global(qos: .userInitiated).async { [weak self] in
      guard let self = self, let engine = self.engine else { return }
      
      let transcription = engine.transcribeFile(recordingURL.path)
      
      NSLog("🎤 VAD: Transcription completed: %@", transcription)
      
      // Emit transcription result
      DispatchQueue.main.async {
        self.sendEvent("onTranscriptionComplete", [
          "transcription": transcription,
          "filePath": recordingURL.path
        ])
      }
      
      // Clean up temp file
      try? FileManager.default.removeItem(at: recordingURL)
      
      // Create new recording URL for next segment
      let tempDir = FileManager.default.temporaryDirectory
      let newRecordingURL = tempDir.appendingPathComponent("vad_recording_\(Date().timeIntervalSince1970).m4a")
      self.currentRecordingURL = newRecordingURL
      
      // Restart recorder for next segment
      DispatchQueue.main.async {
        do {
          let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
            AVSampleRateKey: 16000.0,
            AVNumberOfChannelsKey: 1,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
          ]
          
          self.audioRecorder = try AVAudioRecorder(url: newRecordingURL, settings: settings)
          self.audioRecorder?.isMeteringEnabled = true
          self.audioRecorder?.prepareToRecord()
          self.audioRecorder?.record()
          
          NSLog("🎤 VAD: Ready for next recording segment")
        } catch {
          NSLog("🎤 VAD: Error restarting recorder: %@", error.localizedDescription)
        }
      }
    }
  }
}

// MARK: - AVAudioRecorderDelegate
extension ExpoWhisperModule: AVAudioRecorderDelegate {
  public func audioRecorderDidFinishRecording(_ recorder: AVAudioRecorder, successfully flag: Bool) {
    NSLog("🎤 VAD: Recording finished, success: %@", flag ? "true" : "false")
  }
  
  public func audioRecorderEncodeErrorDidOccur(_ recorder: AVAudioRecorder, error: Error?) {
    if let error = error {
      NSLog("🎤 VAD: Recording encode error: %@", error.localizedDescription)
    }
  }
}
