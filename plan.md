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

1) Pass an audio file to the whisper model

2) Pull the transcription from the model 