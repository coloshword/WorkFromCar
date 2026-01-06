// import * as FileSystem from 'expo-file-system';
// import { documentDirectory, getInfoAsync, copyAsync } from 'expo-file-system';

// const dest = documentDirectory + 'ggml-tiny.en.bin';
// import { Asset } from 'expo-asset';

// export async function ensureModelOnDisk(): Promise<string> {
//   const name = 'ggml-base.en.bin';
//   const dest = FileSystem.documentDirectory + name;

//   const info = await FileSystem.getInfoAsync(dest);
//   if (info.exists) return dest;
  
//   const asset = Asset.fromModule(require('../assets/models/ggml-base.en.bin'));
//   await asset.downloadAsync(); // ensures localUri exists

//   if (!asset.localUri) throw new Error('Model asset has no localUri');

//   await FileSystem.copyAsync({ from: asset.localUri, to: dest });
//   return dest;
// }
import { File, Paths } from 'expo-file-system';
import { Asset } from 'expo-asset';

export async function ensureModelOnDisk(): Promise<string> {
  console.log('ensureModelOnDisk');
  const name = 'ggml-base.en.bin';

  const dest = new File(Paths.document, name);

  const info = dest.info();
  console.log('[model] dest exists?', info.exists, dest.uri);
  if (info.exists) return dest.uri;
  console.log('[model] resolving asset');
  const asset = Asset.fromModule(require('../assets/models/ggml-base.en.bin'));
  console.log('[model] downloading asset...');
  await asset.downloadAsync();
  console.log('[model] downloaded, localUri:', asset.localUri);
  if (!asset.localUri) throw new Error('Model asset has no localUri');

  const src = new File(asset.localUri);

  src.copy(dest);

  return dest.uri;
}