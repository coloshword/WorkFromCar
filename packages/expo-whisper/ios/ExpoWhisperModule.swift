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
  }
}
