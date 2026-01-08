1) set up basic koa server -- done 

2) set up basic infra -- done 

3) set up endpoints for basic google auth

4) use whisper.cpp for on device transcription


Next Steps:
Run npm install or npx expo install to update dependencies
Test the app with npx expo start
Build standalone app with eas build or expo build
The app is now clean, fast, and ready for production! 🚗✨


### creating the whisper transcription functions 

0) ensure the audio is actually being recorded 
  -- done 

1) Pass an audio file to the whisper model
  cot: first we create a bridge, ensure that the mm function is being called 
  ok the index.ts file is called, next we call the swift file 
  - make sure besides the index.ts, we also call the ExpoWhisperModule function
  - swift transcribe file is called
  - last bridge is the mm file -- CALLED
  - engine.<fn>() to call the mm file  -- CALLED
  - before we call the wrapper function, we must define an objective c function to convert the file to a specific format 
  
  - call the wrapper function 

2) Pull the transcription from the model 