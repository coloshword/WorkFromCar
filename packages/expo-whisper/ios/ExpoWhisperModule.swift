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

  public func definition() -> ModuleDefinition {
    Name("ExpoWhisper")

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

    // AsyncFunction("init") { (modelPath: String) async throws -> Void in
    //   let url = URL(string: modelPath);
    //   let fsPath = (url?.isFileURL == true) ? url!.path : modelPath;
    //   self.engine = WhisperEngine(modelPath: fsPath);
    // }

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

        // if let rate = rate { u.rate = Float(rate) }
        // if let pitch = pitch { u.pitchMultiplier = Float(pitch) }
        // if let volume = volume { u.volume = Float(volume) }
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
    }
}
