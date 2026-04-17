import { GoogleRoute, type CoffeeShop } from "@/app/(tabs)";
import { getCoffeeShopInfo, getRoutes } from "@/app/api/coffee_shops";
import { getOrFetch, isWorkFriendly } from "@/constants/helpers";
import { MOCK_MORE_INFO } from "@/constants/mock_data";
import { THEME } from "@/constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
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
      [0, THEME.radius.xl],
      "clamp",
    ),
    borderTopRightRadius: interpolate(
      translateY.value,
      [0, 50],
      [0, THEME.radius.xl],
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
      const data = getOrFetch<GoogleRoute>(CACHE_KEY, async () =>
        getRoutes<GoogleRoute>(originLat, originLng, destLat, destLng),
      );

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
    <View style={styles.layout.container}>
      <FlatList
        data={coffeeShops}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.layout.listContent}
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
        <View style={styles.modal.overlay}>
          <Animated.View style={[styles.modal.backdrop, backdropAnimatedStyle]}>
            <TouchableOpacity
              activeOpacity={1}
              style={StyleSheet.absoluteFill}
              onPress={closeModal}
            />
          </Animated.View>

          <GestureDetector gesture={gesture}>
            <Animated.View style={[styles.modal.content, animatedStyle]}>
              <View style={styles.header.heroContainer}>
                <FlatList
                  data={selectedShop?.photos?.slice(0, 3)}
                  horizontal
                  pagingEnabled
                  nestedScrollEnabled
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(p) => p.name + "_modal"}
                  renderItem={({ item: photo }) => (
                    <View style={styles.header.imageWrapper}>
                      <CoffeePhoto
                        originPlaces={originPlaces}
                        name={photo.name}
                        style={{
                          width: SCREEN_WIDTH,
                          height: THEME.heights.hero,
                        }}
                      />
                    </View>
                  )}
                />
                <TouchableOpacity
                  style={styles.header.backBtn}
                  onPress={closeModal}
                >
                  <Ionicons
                    name="chevron-down"
                    size={24}
                    color={THEME.colors.primary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.shop.body}>
                <FlatList
                  data={modalContent?.reviews}
                  keyExtractor={(_, i) => i.toString()}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                  ListHeaderComponent={() => (
                    <View style={{ paddingTop: THEME.spacing.xxl }}>
                      <View style={styles.shop.titleRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.shop.name}>
                            {selectedShop?.displayName.text}
                          </Text>
                          <Text style={styles.shop.address}>
                            {selectedShop?.formattedAddress}
                          </Text>
                        </View>
                        <View style={styles.shop.ratingBadge}>
                          <Ionicons
                            name="star"
                            size={14}
                            color={THEME.colors.star}
                          />
                          <Text style={styles.shop.ratingValue}>
                            {selectedShop?.rating || "4.8"}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        disabled={
                          routeLoadingId === `route-${selectedShop?.id}`
                        }
                        style={styles.shop.primaryAction}
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
                            <Text style={styles.shop.primaryActionText}>
                              Go
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <View style={styles.layout.divider} />

                      {modalContent?.editorialSummary && (
                        <Text style={styles.shop.summaryText}>
                          {modalContent.editorialSummary.text}
                        </Text>
                      )}

                      {isWorkFriendly(modalContent?.reviews) && (
                        <View style={styles.shop.workBadge}>
                          <Ionicons
                            name="wifi-outline"
                            size={18}
                            color={THEME.colors.accent}
                          />
                          <Text style={styles.shop.workBadgeText}>
                            Verified Remote-Work Hub
                          </Text>
                        </View>
                      )}

                      <Text style={styles.reviews.sectionLabel}>
                        Customer Experiences
                      </Text>
                    </View>
                  )}
                  renderItem={({ item }) => (
                    <View style={styles.reviews.item}>
                      <View style={styles.reviews.header}>
                        <Image
                          source={{ uri: item.authorAttribution.photoUri }}
                          style={styles.reviews.avatar}
                        />
                        <View>
                          <Text style={styles.reviews.name}>
                            {item.authorAttribution.displayName}
                          </Text>
                          <Text style={styles.reviews.meta}>
                            {item.relativePublishTimeDescription}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.reviews.bodyText}>
                        {item.text?.text}
                      </Text>
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

const styles = {
  layout: StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.colors.background },
    listContent: { padding: THEME.spacing.xl, paddingBottom: 100 },
    divider: {
      height: 1,
      backgroundColor: THEME.colors.border,
      marginVertical: THEME.spacing.xxl,
    },
  }),

  modal: StyleSheet.create({
    overlay: { flex: 1, justifyContent: "flex-end" },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: THEME.colors.overlay,
    },
    content: {
      backgroundColor: THEME.colors.background,
      height: SCREEN_HEIGHT * 0.96,
      width: SCREEN_WIDTH,
      overflow: "hidden",
    },
  }),

  header: StyleSheet.create({
    heroContainer: {
      width: SCREEN_WIDTH,
      height: THEME.heights.hero,
      backgroundColor: "#000",
      top: -10,
    },
    imageWrapper: {
      width: SCREEN_WIDTH,
      height: THEME.heights.hero,
    },
    backBtn: {
      position: "absolute",
      top: 50,
      left: 20,
      backgroundColor: THEME.colors.white,
      width: 40,
      height: 40,
      borderRadius: THEME.radius.l,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 99,
      elevation: 5,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 5,
    },
  }),

  shop: StyleSheet.create({
    body: { flex: 1, paddingHorizontal: THEME.spacing.xxl },
    titleRow: { flexDirection: "row", alignItems: "flex-start" },
    name: {
      fontSize: 28,
      fontWeight: "900",
      color: THEME.colors.primary,
      letterSpacing: -0.5,
    },
    address: {
      fontSize: 14,
      color: THEME.colors.secondary,
      marginTop: THEME.spacing.xs,
      lineHeight: 20,
    },
    ratingBadge: {
      backgroundColor: THEME.colors.surface,
      paddingHorizontal: THEME.spacing.s,
      paddingVertical: THEME.spacing.xs,
      borderRadius: THEME.radius.s,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    ratingValue: { fontWeight: "800", fontSize: 14 },
    summaryText: {
      fontSize: 16,
      color: "#374151",
      lineHeight: 26,
      marginBottom: THEME.spacing.xxl,
    },
    workBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: THEME.colors.workHub,
      padding: THEME.spacing.l,
      borderRadius: THEME.radius.m,
      gap: THEME.spacing.m,
      marginBottom: THEME.spacing.xxl,
    },
    workBadgeText: { color: THEME.colors.workHubText, fontWeight: "700" },
    primaryAction: {
      backgroundColor: THEME.colors.primary,
      height: 50,
      borderRadius: THEME.radius.m,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: THEME.spacing.xl,
      gap: 8,
    },
    primaryActionText: { color: THEME.colors.white, fontWeight: "700" },
  }),

  reviews: StyleSheet.create({
    sectionLabel: {
      fontSize: 20,
      fontWeight: "800",
      color: "#111827",
      marginBottom: THEME.spacing.xl,
    },
    item: {
      marginBottom: THEME.spacing.xxl,
      paddingBottom: THEME.spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: THEME.colors.surface,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: THEME.spacing.m,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: THEME.radius.l,
      marginRight: THEME.spacing.m,
    },
    name: { fontWeight: "700", fontSize: 15 },
    meta: { fontSize: 12, color: THEME.colors.secondary },
    bodyText: { fontSize: 15, color: "#4B5563", lineHeight: 24 },
  }),
};
