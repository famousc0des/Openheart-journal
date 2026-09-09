import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export async function pickProfilePhoto(fromCamera: boolean): Promise<string | null> {
  const permission = fromCamera
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert(
      fromCamera ? 'Camera is closed' : 'Photos are closed',
      'Turn on access in Settings to change your profile photo.'
    );
    return null;
  }

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  };

  const result = fromCamera
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options);

  if (result.canceled) return null;
  const uri = result.assets[0]?.uri;
  if (!uri) {
    Alert.alert('Could not use that photo', 'Try another picture.');
    return null;
  }

  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  return uri;
}

export function promptProfilePhoto(onPicked: (uri: string) => void, onRemoved?: () => void) {
  Alert.alert('Profile photo', undefined, [
    { text: 'Take photo', onPress: () => void pickProfilePhoto(true).then((uri) => uri && onPicked(uri)) },
    { text: 'Choose from library', onPress: () => void pickProfilePhoto(false).then((uri) => uri && onPicked(uri)) },
    ...(onRemoved ? [{ text: 'Remove photo', style: 'destructive' as const, onPress: onRemoved }] : []),
    { text: 'Cancel', style: 'cancel' },
  ]);
}
