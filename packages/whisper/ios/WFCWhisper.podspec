require "json"

Pod::Spec.new do |s|
  s.name = "WFCWhisper"
  s.version = "0.0.1"
  s.summary = "Whisper.cpp TurboModule for React Native"
  s.license = { :type => "MIT" }
  s.author = "you"

  s.source = { :path => "." }

  s.dependency "React-Codegen"
  s.dependency "ReactCommon/turbomodule/core"
  s.dependency "React-Fabric"

  s.source_files = [
    "WFCWhisperModule.{h, mm}",
    "cpp/**/*.{h, mm, cpp}"
  ]

  s.pod_

