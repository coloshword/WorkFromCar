import ExpoModulesCore
import ExpoWhisper

public class ExpoWhisperModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoWhisper")

    Function("ping") { () -> String in
      "pong"
    }

    Function("pingFromObjc") {
      let engine = WhisperEngine();
      return engine.ping();
    }
  }
}
