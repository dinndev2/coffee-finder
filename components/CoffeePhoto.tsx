import { Image } from "expo-image";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, View, ViewStyle } from "react-native";

export const CoffeePhoto = ({
  originPlaces,
  name,
  style, // Accept custom style for height/width overrides
}: {
  originPlaces?: string;
  name: string;
  style?: ViewStyle;
}) => {
  const [isPhotoLoading, setIsPhotoLoading] = useState(true);
  const photoUri = name.startsWith("http")
    ? name
    : `${originPlaces}${name}/media?key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}&maxWidthPx=1000`;

  return (
    <View style={[styles.photoContainer, style]}>
      <Image
        source={{ uri: photoUri }}
        style={styles.cardImage}
        cachePolicy="disk"
        transition={300} // Slightly longer transition for a "premium" feel
        contentFit="cover" // Essential for filling the space without black bars
        onLoadStart={() => setIsPhotoLoading(true)}
        onLoadEnd={() => setIsPhotoLoading(false)}
      />
      {isPhotoLoading && (
        <View style={styles.imageLoader}>
          <ActivityIndicator size="small" color="#1A1A1A" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  imageLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  photoContainer: {
    width: "100%", // Fill whatever container it is in
    height: "100%",
    backgroundColor: "#F0F0F0",
    overflow: "hidden",
  },
  cardImage: {
    flex: 1,
    width: "100%",
  },
});
