import { CoffeeCards } from "@/components/CoffeCards";
import { MapViewPaper } from "@/components/MapViewPaper";
import { View } from "@/components/Themed";
import { MOCK_COFFEE_SHOPS } from "@/constants/mock_data";
import { THEME } from "@/constants/theme"; // Imported central theme
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, Text } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { cofee_shops } from "../api/coffee_shops";

const DEV = true;
const FETCH_STEP = 1000;

export interface GoogleRoute {
  routes: {
    distanceMeters: number;
    duration: string;
  }[];
}

export interface CoffeeShop {
  displayName: { text: string };
  formattedAddress: string;
  rating?: number;
  regularOpeningHours?: {
    openNow: boolean;
    weekdayDescriptions: string[];
  };
  userRatingCount?: number;
  id: string;
  freeWifi?: boolean;
  location: {
    latitude: number;
    longitude: number;
  };
  photos: {
    name: string;
    widthPx: number;
    heightPx: number;
  }[];
}

interface CurrentCoords {
  location: {
    latitude: number;
    longitude: number;
  };
}

export default function TabOneScreen() {
  const [coffeeShops, setCoffeeShops] = useState<CoffeeShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalStatus, setModalStatus] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [km, setKm] = useState(1000.0);
  const [googleMapsUri, setGoogleMapsUri] = useState<string | "">("");
  const [currentCoords, setCurrentCoords] = useState<CurrentCoords>({
    location: { latitude: 0, longitude: 0 },
  });
  const [selectedShop, setSelectedShop] = useState<CoffeeShop | any>(null);
  const [currentRoute, setCurrentRoute] = useState<GoogleRoute>({
    routes: [{ distanceMeters: 0, duration: "" }],
  });

  const originPlaces = "https://places.googleapis.com/v1/";

  const getCacheKey = (lat: number, lng: number, radius: number) => {
    return `coffee_${lat.toFixed(3)}_${lng.toFixed(3)}_${radius}`;
  };
  const [lastFetchKM, setLastFetchKm] = useState(0);

  async function fetchAndCache(lat: number, lng: number) {
    setLoading(true);
    if (DEV) {
      setCoffeeShops(MOCK_COFFEE_SHOPS);
      setLoading(false);
      return;
    } else {
      const key = getCacheKey(lat, lng, km);
      try {
        const cachedData = await AsyncStorage.getItem(key);
        if (cachedData) {
          setCoffeeShops(JSON.parse(cachedData));
          setLoading(false);
          return;
        }

        const result = await cofee_shops(lat, lng, km);
        const places = result.places || [];
        setCoffeeShops(places);

        if (places.length > 0) {
          await AsyncStorage.setItem(key, JSON.stringify(places));
        }
      } catch (error) {
        setErrorMsg("Failed to fetch coffee shops");
      } finally {
        setLoading(false);
      }
    }
  }

  const bucket = Math.round(km / FETCH_STEP) * FETCH_STEP;

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission Denied");
        setLoading(false);
        return;
      }

      let userLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = userLocation.coords;
      setCurrentCoords({ location: { latitude, longitude } });
      if (bucket !== lastFetchKM) {
        fetchAndCache(latitude, longitude);
        setLastFetchKm(bucket);
      }
    })();
  }, [bucket]);

  return (
    <GestureHandlerRootView style={styles.layout.mainContainer}>
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalStatus}
        onRequestClose={() => setModalStatus(false)}
      >
        <MapViewPaper
          setMapModalStatus={setModalStatus}
          originLat={currentCoords.location.latitude}
          originLng={currentCoords.location.longitude}
          selectedShop={selectedShop}
          googleMapsUri={googleMapsUri}
        />
      </Modal>

      <View style={styles.header.section}>
        <View style={styles.header.titleRow}>
          <View style={styles.header.greetingWrapper}>
            <Text style={styles.header.mainTitle}>Hi Din</Text>
            <Text style={styles.header.subTitle}>
              Explore coffee shops around you!
            </Text>
          </View>
          <View style={styles.header.iconCircle}>
            <Ionicons name="cafe" size={20} color={THEME.colors.white} />
          </View>
        </View>

        <View style={styles.header.statusBadge}>
          <Ionicons
            name="map-outline"
            size={14}
            color={THEME.colors.workHubText}
          />
          <Text style={styles.header.statusText}>
            Shops within {(km / 1000).toFixed(1)} km
          </Text>
        </View>

        <View style={styles.controls.sliderContainer}>
          <View style={styles.controls.sliderHeader}>
            <Text style={styles.controls.sliderLabel}>Search Radius</Text>
            <Text style={styles.controls.sliderValue}>
              {(km / 1000).toFixed(1)} km
            </Text>
          </View>
          <Slider
            style={{ width: "100%", height: 40 }}
            minimumValue={1000}
            maximumValue={10000}
            step={500}
            value={km}
            onSlidingComplete={(value) => setKm(value)}
            minimumTrackTintColor={THEME.colors.primary}
            maximumTrackTintColor={THEME.colors.border}
            thumbTintColor={THEME.colors.primary}
          />
        </View>
      </View>

      <View style={styles.layout.cardsWrapper} pointerEvents="box-none">
        {loading ? (
          <View style={styles.state.innerLoading}>
            <ActivityIndicator size="small" color={THEME.colors.primary} />
          </View>
        ) : (
          <CoffeeCards
            setGoogleMapsUri={setGoogleMapsUri}
            mapModalStatus={modalStatus}
            coffeeShops={coffeeShops}
            originLat={currentCoords.location.latitude}
            originLng={currentCoords.location.longitude}
            originPlaces={originPlaces}
            setMapModalStatus={setModalStatus}
            setCurrentRoute={setCurrentRoute}
            setSelectedShop={setSelectedShop}
            selectedShop={selectedShop}
          />
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = {
  layout: StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: "#fcfcfc",
    },
    cardsWrapper: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "transparent",
    },
  }),

  header: StyleSheet.create({
    section: {
      paddingHorizontal: THEME.spacing.xxl,
      paddingTop: THEME.spacing.xl,
      backgroundColor: "transparent",
      marginBottom: THEME.spacing.xl,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: THEME.spacing.s,
      backgroundColor: "transparent",
    },
    greetingWrapper: {
      gap: 2,
      backgroundColor: "transparent",
    },
    mainTitle: {
      fontSize: 32,
      fontWeight: "900",
      color: THEME.colors.primary,
      letterSpacing: -0.5,
    },
    subTitle: {
      fontSize: 15,
      color: THEME.colors.secondary,
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: THEME.radius.l,
      backgroundColor: THEME.colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: THEME.colors.workHub, // Using workHub as a soft background
      paddingHorizontal: THEME.spacing.m,
      paddingVertical: THEME.spacing.s,
      borderRadius: THEME.radius.l,
      alignSelf: "flex-start",
      marginBottom: THEME.spacing.l,
    },
    statusText: {
      marginLeft: THEME.spacing.s,
      color: THEME.colors.workHubText,
      fontSize: 13,
      fontWeight: "700",
    },
  }),

  controls: StyleSheet.create({
    sliderContainer: {
      backgroundColor: THEME.colors.surface,
      padding: THEME.spacing.l,
      borderRadius: THEME.radius.l,
      marginTop: THEME.spacing.xs,
    },
    sliderHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: THEME.spacing.xs,
      backgroundColor: "transparent",
    },
    sliderLabel: {
      fontSize: 14,
      fontWeight: "700",
      color: THEME.colors.secondary,
    },
    sliderValue: {
      fontSize: 14,
      fontWeight: "800",
      color: THEME.colors.primary,
    },
  }),

  state: StyleSheet.create({
    innerLoading: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
  }),
};
