require "json"

Pod::Spec.new do |s|
  s.name         = "WFCKokoro"
  s.version      = "1.0.0"
  s.summary      = "Kokoro TTS TurboModule for React Native via sherpa-onnx"
  s.homepage     = "https://github.com/k2-fsa/sherpa-onnx"
  s.license      = { :type => "Apache-2.0" }
  s.author       = "you"
  s.platform     = :ios, "15.1"
  s.source       = { :path => "." }

  s.source_files = "WFCKokoroModule.{h,mm}"

  s.vendored_libraries = [
    "lib/libsherpa-onnx.a"
  ]

  s.frameworks = ["AVFoundation", "Foundation"]

  s.pod_target_xcconfig = {
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++17",
    "HEADER_SEARCH_PATHS" => [
      "\"$(PODS_TARGET_SRCROOT)/../../../app/ios/third_party/sherpa-onnx/sherpa-onnx.xcframework/ios-arm64/Headers\"",
      "\"$(PODS_ROOT)/Headers/Public/ReactCodegen\"",
      "\"$(PODS_ROOT)/Headers/Public/React-NativeModulesApple\"",
      "\"$(PODS_ROOT)/Headers/Private/React-NativeModulesApple\""
    ].join(" "),
    "OTHER_LDFLAGS" => [
      "$(inherited)",
      "-L\"${PODS_TARGET_SRCROOT}/lib\"",
      "-lsherpa-onnx"
    ].join(" ")
  }

  s.dependency "React-Codegen"
  s.dependency "ReactCommon/turbomodule/core"
  s.dependency "React-NativeModulesApple"
  s.dependency "React-Fabric"
  s.dependency "onnxruntime-c", "~> 1.19.0"
end
 