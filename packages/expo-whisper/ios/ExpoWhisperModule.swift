import ExpoModulesCore
import Foundation

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
      NSLog("🎤 SWIFT: Transcribing file: %@", filePath)
      engine?.transcribeFile(filePath);
      return "transcribed"
    }

    // AsyncFunction("init") { (modelPath: String) async throws -> Void in
    //   let url = URL(string: modelPath);
    //   let fsPath = (url?.isFileURL == true) ? url!.path : modelPath;
    //   self.engine = WhisperEngine(modelPath: fsPath);
    // }

    AsyncFunction("init") { (modelPath: String) async throws -> Void in
      NSLog("🎤 ExpoWhisper: Starting initialization with modelPath: %@", modelPath)
      
      let url = URL(string: modelPath)
      NSLog("🎤 ExpoWhisper: URL created: %@", url?.absoluteString ?? "nil")
      
      let fsPath = (url?.isFileURL == true) ? url!.path : modelPath
      NSLog("🎤 ExpoWhisper: Final fsPath to use: %@", fsPath)
      
      // Check if file exists
      let fileManager = FileManager.default
      let fileExists = fileManager.fileExists(atPath: fsPath)
      NSLog("🎤 ExpoWhisper: File exists at path: %@", fileExists ? "YES" : "NO")
      
      if fileExists {
        do {
          let attributes = try fileManager.attributesOfItem(atPath: fsPath)
          if let fileSize = attributes[.size] as? NSNumber {
            NSLog("🎤 ExpoWhisper: File size: %@ bytes", fileSize)
          }
        } catch {
          NSLog("🎤 ExpoWhisper: Error getting file attributes: %@", error.localizedDescription)
        }
      }
      
      NSLog("🎤 ExpoWhisper: About to call WhisperEngine init...")
      guard let e = WhisperEngine(modelPath: fsPath) else {
        let errorMsg = "whisper_init_from_file failed for path: \(fsPath)"
        NSLog("🎤 ExpoWhisper ERROR: %@", errorMsg)
        throw WhisperError.initFailed(errorMsg)
      }
      NSLog("🎤 ExpoWhisper: WhisperEngine initialized successfully!")
      self.engine = e
      NSLog("🎤 ExpoWhisper: Engine assigned to self.engine")
    }
  }
}
