module.exports = {
  dependencies: {
    whisper: {
      root: require('path').resolve(__dirname, '../packages/whisper'),
      platforms: {
        ios: {
          podspecPath: require('path').resolve(__dirname, '../packages/whisper/ios/WFCWhisper.podspec'),
        },
        android: null,
      },
    },
  },
};