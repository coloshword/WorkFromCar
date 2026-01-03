import ExpoModulesCore

public class ExpoWhisperModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoWhisper")

    Function("ping") { () -> String in
      "pong"
    }
  }
}
