import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View style={{ flex: 1 }} />;
  }

  if (!permission.granted) {
    requestPermission();
    return <View style={{ flex: 1 }} />;
  }

  const takePhoto = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.8,
      });
  
      if (!photo) return;
  
      const formData = new FormData();
  
      formData.append("image", {
        uri: photo.uri,
        name: `photo-${Date.now()}.jpg`,
        type: "image/jpeg",
      } as any);
  
      const response = await fetch(
        "https://bkt.strumati.cloud/myapp/upload",
        {
          method: "POST",
          body: formData,
        }
      );
  
      if (!response.ok) {
        throw new Error("Upload fehlgeschlagen");
      }
  
      const result = await response.json();
  
      console.log("Upload erfolgreich", result);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
      />

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.captureButton}
          onPress={takePhoto}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bottomBar: {
    position: "absolute",
    bottom: 50,
    width: "100%",
    alignItems: "center",
  },
  captureButton: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: "white",
    borderWidth: 5,
    borderColor: "#ddd",
  },
});
