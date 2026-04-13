import { type SelectedShop } from "@/app/(tabs)";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface MapViewType {
  originLat: number;
  originLng: number;
  currentRoute: any;
  selectedShop: SelectedShop;
  setMapModalStatus: React.Dispatch<React.SetStateAction<boolean>>;
}

export const MapViewPaper = ({
  originLat,
  originLng,
  selectedShop,
  currentRoute,
  setMapModalStatus,
}: MapViewType) => {
  const { location, placeId, displayName } = selectedShop;
  const { latitude, longitude } = location;
  const { text } = displayName;

  // States for navigation
  const [navLoading, setNavLoading] = useState(false);
  const [travelMode, setTravelMode] = useState<"WALKING" | "DRIVING">(
    "WALKING",
  );

  // Real-time stats from the Directions component
  const [liveDuration, setLiveDuration] = useState<string>("");
  const [liveDistance, setLiveDistance] = useState<string>("");

  const onShare = async () => {
    try {
      const key = `place-url-${placeId}`;
      const cachedUri = await AsyncStorage.getItem(key);

      // Use cached URI or fallback to a standard Google Maps link
      const shareLink =
        cachedUri ||
        `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

      await Share.share({
        message: `Check out ${text}! It looks like a great spot to work from. \n\nLocation: ${shareLink}`,
      });
    } catch (error: any) {
      console.error("Share Error:", error.message);
    }
  };

  const startNavigation = async () => {
    setNavLoading(true);
    const key = `place-url-${placeId}`;

    try {
      let targetUri = await AsyncStorage.getItem(key);

      if (!targetUri) {
        const response = await fetch(
          `https://places.googleapis.com/v1/places/${placeId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": `${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`,
              "X-Goog-FieldMask": "googleMapsUri",
            },
          },
        );
        const data = await response.json();
        targetUri = data.googleMapsUri;
        if (targetUri) await AsyncStorage.setItem(key, targetUri);
      }

      const scheme = Platform.select({
        ios: `maps:0,0?q=${text}@${latitude},${longitude}&directionsmode=${travelMode.toLowerCase()}`,
        android: `google.navigation:q=${latitude},${longitude}&mode=${travelMode === "WALKING" ? "w" : "d"}`,
      });

      const canOpen = await Linking.canOpenURL(scheme!);

      if (canOpen) {
        await Linking.openURL(scheme!);
      } else {
        await Linking.openURL(targetUri!);
      }
    } catch (err) {
      console.error("Navigation Error:", err);
    } finally {
      setNavLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      return `${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m`;
    }
    return `${Math.round(minutes)} min`;
  };

  const mapRef = useRef<MapView>(null);

  return (
    <View style={styles.container}>
      <MapView
        initialRegion={{
          latitude: (originLat + latitude) / 2,
          longitude: (originLng + longitude) / 2,
          latitudeDelta: Math.abs(originLat - latitude) * 2,
          longitudeDelta: Math.abs(originLng - longitude) * 2,
        }}
        customMapStyle={grayMapStyle}
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
      >
        <Marker coordinate={{ longitude: originLng, latitude: originLat }}>
          <View style={styles.userDotContainer}>
            <View style={styles.userDotCore} />
            <View style={styles.userDotHalo} />
          </View>
        </Marker>

        <Marker coordinate={{ longitude, latitude }}>
          <View style={styles.shopMarker}>
            <Ionicons name="cafe" size={16} color="white" />
          </View>
        </Marker>

        <MapViewDirections
          origin={{ latitude: originLat, longitude: originLng }}
          destination={{ latitude, longitude }}
          mode={travelMode}
          apikey={`${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`}
          strokeWidth={4}
          strokeColor={travelMode === "WALKING" ? "#3852B4" : "#FF5722"}
          onReady={(result) => {
            setLiveDuration(formatDuration(result.duration));
            setLiveDistance(result.distance.toFixed(1));
            mapRef.current?.fitToCoordinates(result.coordinates, {
              edgePadding: { right: 50, bottom: 380, left: 50, top: 100 },
              animated: true,
            });
          }}
        />
      </MapView>

      <View style={styles.overlay} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.floatingCloseBtn}
          onPress={() => setMapModalStatus(false)}
        >
          <Ionicons name="close" size={24} color="#1A1A1A" />
        </TouchableOpacity>

        <View style={styles.bottomSheetContainer}>
          <View style={styles.routeCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.destName} numberOfLines={1}>
                {text}
              </Text>
              <Text style={styles.subText}>Route Details</Text>
            </View>

            {/* Travel Mode Toggle */}
            <View style={styles.modeToggleContainer}>
              <TouchableOpacity
                style={[
                  styles.modeBtn,
                  travelMode === "WALKING" && styles.activeModeBtn,
                ]}
                onPress={() => setTravelMode("WALKING")}
              >
                <Ionicons
                  name="walk"
                  size={18}
                  color={travelMode === "WALKING" ? "white" : "#666"}
                />
                <Text
                  style={[
                    styles.modeText,
                    travelMode === "WALKING" && styles.activeModeText,
                  ]}
                >
                  Walk
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeBtn,
                  travelMode === "DRIVING" && styles.activeModeBtn,
                ]}
                onPress={() => setTravelMode("DRIVING")}
              >
                <Ionicons
                  name="car"
                  size={18}
                  color={travelMode === "DRIVING" ? "white" : "#666"}
                />
                <Text
                  style={[
                    styles.modeText,
                    travelMode === "DRIVING" && styles.activeModeText,
                  ]}
                >
                  Drive
                </Text>
              </TouchableOpacity>
            </View>

            {/* Live Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>DISTANCE</Text>
                <Text style={styles.statValue}>
                  {liveDistance || "0.0"}{" "}
                  <Text style={styles.unitText}>km</Text>
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>EST. TIME</Text>
                <Text style={styles.statValue}>{liveDuration || "--"}</Text>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.navActionButton}
                onPress={startNavigation}
                disabled={navLoading}
              >
                {navLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="navigate" size={20} color="white" />
                    <Text style={styles.navActionText}>Start</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareBtn} onPress={onShare}>
                <Ionicons name="share-outline" size={22} color="#1A1A1A" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => setMapModalStatus(false)}
              >
                <Text style={styles.secondaryBtnText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 40,
    justifyContent: "space-between",
  },
  floatingCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomSheetContainer: { width: "100%" },
  routeCard: {
    backgroundColor: "white",
    borderRadius: 32,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  cardHeader: { marginBottom: 16 },
  destName: { fontSize: 22, fontWeight: "900", color: "#1A1A1A" },
  subText: {
    fontSize: 13,
    color: "#999",
    marginTop: 2,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modeToggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F2F2F2",
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 11,
    gap: 6,
  },
  activeModeBtn: {
    backgroundColor: "#1A1A1A",
  },
  modeText: { fontSize: 14, fontWeight: "700", color: "#666" },
  activeModeText: { color: "white" },
  statsGrid: { flexDirection: "row", gap: 12, marginBottom: 24 },
  statBox: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#BBB",
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1A1A1A",
    marginTop: 4,
  },
  unitText: { fontSize: 12, color: "#999" },
  buttonRow: { flexDirection: "row", gap: 8 },
  navActionButton: {
    flex: 3,
    backgroundColor: "#3852B4",
    height: 56,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  navActionText: { color: "white", fontWeight: "800", fontSize: 15 },
  shareBtn: {
    flex: 1.2,
    backgroundColor: "#F0F0F0",
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryBtn: {
    flex: 1.8,
    backgroundColor: "#F0F0F0",
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryBtnText: { color: "#666", fontWeight: "700", fontSize: 14 },
  userDotContainer: { alignItems: "center", justifyContent: "center" },
  userDotCore: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#3852B4",
    zIndex: 2,
    borderWidth: 2,
    borderColor: "white",
  },
  userDotHalo: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(56, 82, 180, 0.2)",
  },
  shopMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
  },
});

const grayMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#e9e9e9" }],
  },
];
