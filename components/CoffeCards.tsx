import { GoogleRoute, type CoffeeShop } from "@/app/(tabs)";
import { getCoffeeShopInfo, getRoutes } from "@/app/api/coffee_shops";
import { getOrFetch, isWorkFriendly } from "@/constants/helpers";
import { MOCK_MORE_INFO } from "@/constants/mock_data";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { CoffeePhoto } from "./CoffeePhoto";

import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CoffeCard } from "./CoffeCard";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
export interface Review {
  authorAttribution: { displayName: string; photoUri: string };
  relativePublishTimeDescription: string;
  rating: number;
  text: { text: string };
}

export interface MoreInfo {
  reviews?: Review[];
  editorialSummary?: { text: string };
  googleMapsUri: string | any;
  id: number;
}

interface CoffeeCardsProps {
  coffeeShops: CoffeeShop[];
  originPlaces: string;
  originLat: number;
  originLng: number;
  mapModalStatus: boolean;
  selectedShop: CoffeeShop;
  setGoogleMapsUri: React.Dispatch<React.SetStateAction<string>>;
  setMapModalStatus: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentRoute: React.Dispatch<React.SetStateAction<any>>;
  setSelectedShop: React.Dispatch<React.SetStateAction<CoffeeShop | null>>;
}

const IS_DEV = true;

export const CoffeeCards = ({
  coffeeShops,
  originPlaces,
  originLat,
  mapModalStatus,
  selectedShop,
  originLng,
  setGoogleMapsUri,
  setMapModalStatus,
  setSelectedShop,
  setCurrentRoute,
}: CoffeeCardsProps) => {
  const [modalStatus, setModalStatus] = useState(false);
  const [modalContent, setModalContent] = useState<MoreInfo>();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [routeLoadingId, setRouteLoadingId] = useState<string | null>(null);

  // Animation Shared Values
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  // Trigger Entry Animation
  useEffect(() => {
    if (modalStatus) {
      translateY.value = withSpring(0, {
        damping: 28,
        stiffness: 140,
        mass: 0.6,
      });
      backdropOpacity.value = withTiming(1, { duration: 300 });
    }
  }, [modalStatus]);

  const closeModal = () => {
    backdropOpacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 }, () => {
      runOnJS(setModalStatus)(false);
    });
  };

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
        backdropOpacity.value = interpolate(
          event.translationY,
          [0, 200],
          [1, 0],
          Extrapolation.CLAMP,
        );
      }
    })
    .onEnd((event) => {
      if (event.translationY > 120 || event.velocityY > 500) {
        runOnJS(closeModal)();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 10 });
        backdropOpacity.value = withTiming(1);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    borderTopLeftRadius: interpolate(
      translateY.value,
      [0, 50],
      [0, 32],
      "clamp",
    ),
    borderTopRightRadius: interpolate(
      translateY.value,
      [0, 50],
      [0, 32],
      "clamp",
    ),
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  async function getDirections(destLat: number, destLng: number, id: string) {
    const CACHE_KEY = `route_cache_${id}`;
    setRouteLoadingId(`route-${id}`);
    runOnJS(closeModal)();
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      if (cachedData) {
        setCurrentRoute(JSON.parse(cachedData));
        setMapModalStatus(true);
        setModalStatus(false);
        return;
      }
      const data = await getRoutes<GoogleRoute>(
        originLat,
        originLng,
        destLat,
        destLng,
      );
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
      setCurrentRoute(data);
      setModalStatus(false);
      setMapModalStatus(true);
      setGoogleMapsUri(modalContent?.googleMapsUri);
    } catch (error) {
      console.error(error);
    } finally {
      setRouteLoadingId(null);
    }
  }

  const getMoreInfo = async (shop: CoffeeShop) => {
    setLoadingId(shop.id);
    setSelectedShop(shop);

    if (IS_DEV) {
      setTimeout(() => {
        setModalContent(MOCK_MORE_INFO[shop.id] || { reviews: [] });
        setModalStatus(true);
        setLoadingId(null);
      }, 150);
      return;
    }
    try {
      const info = await getOrFetch<MoreInfo>(shop.id, async () =>
        getCoffeeShopInfo<MoreInfo>(shop.id),
      );
      setModalContent(info);
      setModalStatus(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <View style={styles.listContainer}>
      <FlatList
        data={coffeeShops}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.flatListContent}
        renderItem={({ item }) => (
          <CoffeCard
            item={item}
            loadingId={loadingId}
            setSelectedShop={setSelectedShop}
            handleGetMoreInfo={() => getMoreInfo(item)}
          />
        )}
      />

      <Modal
        transparent
        visible={modalStatus}
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
            <TouchableOpacity
              activeOpacity={1}
              style={StyleSheet.absoluteFill}
              onPress={closeModal}
            />
          </Animated.View>

          <GestureDetector gesture={gesture}>
            <Animated.View style={[styles.modalContent, animatedStyle]}>
              {/* HERO: STRICT SCREEN_WIDTH WRAPPER */}
              <View style={[styles.heroContainer]}>
                <FlatList
                  data={selectedShop?.photos?.slice(0, 3)}
                  horizontal
                  pagingEnabled
                  nestedScrollEnabled
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(p) => p.name + "_modal"}
                  renderItem={({ item: photo }) => (
                    <View style={styles.imageFullWidthWrapper}>
                      <CoffeePhoto
                        originPlaces={originPlaces}
                        name={photo.name}
                        style={{ width: SCREEN_WIDTH, height: 420 }}
                      />
                    </View>
                  )}
                />
                <TouchableOpacity style={styles.backBtn} onPress={closeModal}>
                  <Ionicons name="chevron-down" size={24} color="#1A1A1A" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <FlatList
                  data={modalContent?.reviews}
                  keyExtractor={(_, i) => i.toString()}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                  ListHeaderComponent={() => (
                    <View style={{ paddingTop: 24 }}>
                      <View style={styles.titleRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.shopName}>
                            {selectedShop?.displayName.text}
                          </Text>
                          <Text style={styles.addressText}>
                            {selectedShop?.formattedAddress}
                          </Text>
                        </View>
                        <View style={styles.ratingBadge}>
                          <Ionicons name="star" size={14} color="#FFB800" />
                          <Text style={styles.ratingValue}>
                            {selectedShop?.rating || "4.8"}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        disabled={
                          routeLoadingId === `route-${selectedShop?.id}`
                        }
                        style={styles.primaryAction}
                        onPress={() =>
                          getDirections(
                            selectedShop?.location.latitude,
                            selectedShop?.location.longitude,
                            selectedShop?.id,
                          )
                        }
                      >
                        {routeLoadingId === `route-${selectedShop?.id}` ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <>
                            <Ionicons
                              name="navigate-outline"
                              size={20}
                              color="white"
                            />
                            <Text style={styles.primaryActionText}>Go</Text>
                          </>
                        )}
                      </TouchableOpacity>
                      <View style={styles.divider} />

                      {modalContent?.editorialSummary && (
                        <Text style={styles.summaryText}>
                          {modalContent.editorialSummary.text}
                        </Text>
                      )}

                      {isWorkFriendly(modalContent?.reviews) && (
                        <View style={styles.workBadge}>
                          <Ionicons
                            name="wifi-outline"
                            size={18}
                            color="#007AFF"
                          />
                          <Text style={styles.workBadgeText}>
                            Verified Remote-Work Hub
                          </Text>
                        </View>
                      )}

                      <Text style={styles.sectionLabel}>
                        Customer Experiences
                      </Text>
                    </View>
                  )}
                  renderItem={({ item }) => (
                    <View style={styles.reviewItem}>
                      <View style={styles.reviewHeader}>
                        <Image
                          source={{ uri: item.authorAttribution.photoUri }}
                          style={styles.avatar}
                        />
                        <View>
                          <Text style={styles.reviewerName}>
                            {item.authorAttribution.displayName}
                          </Text>
                          <Text style={styles.reviewMeta}>
                            {item.relativePublishTimeDescription}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.reviewBody}>{item.text?.text}</Text>
                    </View>
                  )}
                  ListFooterComponent={<View style={{ height: 100 }} />}
                />
              </View>
            </Animated.View>
          </GestureDetector>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  listContainer: { flex: 1, backgroundColor: "#fff" },
  flatListContent: { padding: 20, paddingBottom: 100 },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  modalContent: {
    backgroundColor: "white",
    height: SCREEN_HEIGHT * 0.96,
    width: SCREEN_WIDTH,
    overflow: "hidden",
  },
  heroContainer: {
    width: SCREEN_WIDTH,
    height: 420,
    backgroundColor: "#000",
    top: -10,
  },
  imageFullWidthWrapper: {
    width: SCREEN_WIDTH,
    height: 420,
  },
  backBtn: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "white",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 99,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  primaryActionText: { color: "white", fontWeight: "700" },
  modalBody: { flex: 1, paddingHorizontal: 24 },
  titleRow: { flexDirection: "row", alignItems: "flex-start" },
  shopName: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1A1A1A",
    letterSpacing: -0.5,
  },
  addressText: { fontSize: 14, color: "#6B7280", marginTop: 4, lineHeight: 20 },
  ratingBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingValue: { fontWeight: "800", fontSize: 14 },
  divider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 24 },
  summaryText: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 26,
    marginBottom: 24,
  },
  workBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    padding: 16,
    borderRadius: 14,
    gap: 12,
    marginBottom: 24,
  },
  primaryAction: {
    flex: 1.5,
    backgroundColor: "#1A1A1A",
    height: 50,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    gap: 8,
  },
  workBadgeText: { color: "#1D4ED8", fontWeight: "700" },
  sectionLabel: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 20,
  },
  reviewItem: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  reviewerName: { fontWeight: "700", fontSize: 15 },
  reviewMeta: { fontSize: 12, color: "#9CA3AF" },
  reviewBody: { fontSize: 15, color: "#4B5563", lineHeight: 24 },
});
