require "json"

Pod::Spec.new do |s|
  s.name = "WFCWhisper"
  s.version = "0.0.1"
  s.summary = "Whisper.cpp TurboModule for React Native"
  s.homepage = "https://github.com/ggml-org/whisper.cpp"
  s.license = { :type => "MIT" }
  s.author = "you"

  s.source = { :git => "https://github.com/ggml-org/whisper.cpp.git" }

  s.dependency "React-Codegen"
  s.dependency "ReactCommon/turbomodule/core"
  s.dependency "React-NativeModulesApple"
  s.dependency "React-Fabric"

  s.source_files = [
    "WFCWhisperModule.{h,mm}",
    "cpp/**/*.{h,mm,cpp}"
  ]

  s.pod_target_xcconfig = {
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++20",
    "OTHER_CPLUSPLUSFLAGS" => "-DGGML_USE_METAL=1",
    "HEADER_SEARCH_PATHS" => [
      "\"$(PODS_TARGET_SRCROOT)/../../../app/ios/third_party/whisper.cpp\"",
      "\"$(PODS_TARGET_SRCROOT)/../../../app/ios/third_party/whisper.cpp/include\"",
      "\"$(PODS_TARGET_SRCROOT)/../../../app/ios/third_party/whisper.cpp/ggml/include\"",
      "\"$(PODS_ROOT)/Headers/Public/ReactCodegen\"",
      "\"$(PODS_ROOT)/Headers/Public/React-NativeModulesApple\"",
      "\"$(PODS_ROOT)/Headers/Private/React-NativeModulesApple\""
    ].join(" ")
  }

  s.frameworks = [ "Accelerate", "Metal", "Foundation" ]

  s.prepare_command = <<-CMD
    set -e
    POD_ROOT="$(pwd)"
    WHISPER_DIR="$(cd "${POD_ROOT}/../../../app/ios/third_party/whisper.cpp" && pwd)"
    BUILD_DIR="${POD_ROOT}/build"

    rm -rf "${BUILD_DIR}"
    mkdir -p "${BUILD_DIR}"

    cmake -S "${WHISPER_DIR}" -B "${BUILD_DIR}" \
      -DGGML_METAL=ON \
      -DBUILD_SHARED_LIBS=OFF \
      -DWHISPER_BUILD_EXAMPLES=OFF \
      -DWHISPER_BUILD_TESTS=OFF

    cmake --build "${BUILD_DIR}" --config Release
  CMD

  s.vendored_libraries = [
    "build/src/libwhisper.a",
    "build/ggml/src/libggml.a",
    "build/ggml/src/libggml-base.a",
    "build/ggml/src/libggml-cpu.a",
    "build/ggml/src/ggml-metal/libggml-metal.a"
  ]
end
