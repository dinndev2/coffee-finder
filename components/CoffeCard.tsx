import { CoffeeShop } from "@/app/(tabs)";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CoffeePhoto } from "./CoffeePhoto";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
// Assuming a 20px padding on each side for the parent container
const IMAGE_WIDTH = SCREEN_WIDTH - 40;

interface CoffeCardProps {
  item: CoffeeShop;
  handleGetMoreInfo: () => void;
  setSelectedShop: React.Dispatch<React.SetStateAction<CoffeeShop | null>>;
  loadingId: string | null;
}

export const CoffeCard = ({
  item,
  handleGetMoreInfo,
  loadingId,
  setSelectedShop,
}: CoffeCardProps) => {
  const originPlaces = "https://places.googleapis.com/v1/";

  const handleOpenModal = () => {
    // 1. Set the data so the Modal knows which shop to display
    setSelectedShop(item);
    // 2. Trigger the fetch for reviews/extra info
    handleGetMoreInfo();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handleOpenModal}
      style={styles.cardContainer}
    >
      {/* Photo Section */}
      <View style={styles.imageSection}>
        <FlatList
          data={item.photos?.slice(0, 1)}
          horizontal
          snapToAlignment="center"
          decelerationRate="fast"
          keyExtractor={(photo) => photo.name}
          renderItem={({ item: photo }) => (
            <View style={{ width: IMAGE_WIDTH }}>
              <CoffeePhoto originPlaces={originPlaces} name={photo.name} />
            </View>
          )}
          ListEmptyComponent={
            <View style={{ width: IMAGE_WIDTH }}>
              <CoffeePhoto name="https://via.placeholder.com/800" />
            </View>
          }
        />

        {/* Overlays */}
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={12} color="#FFB800" />
          <Text style={styles.ratingText}>{item.rating || "New"}</Text>
        </View>

        {item.photos?.length > 1 && (
          <View style={styles.photoIndicator}>
            <Ionicons name="images-outline" size={12} color="white" />
            <Text style={styles.photoCountText}>{item.photos.length}</Text>
          </View>
        )}
      </View>

      {/* Info Section */}
      <View style={styles.contentSection}>
        <View style={styles.rowBetween}>
          <Text style={styles.shopName} numberOfLines={1}>
            {item.displayName.text}
          </Text>
          <View style={styles.workTag}>
            <Ionicons
              name={item.freeWifi ? "wifi" : "laptop-outline"}
              size={12}
              color={item.freeWifi ? "#4CAF50" : "#3852B4"}
            />
            <Text
              style={[
                styles.workTagText,
                { color: item.freeWifi ? "#4CAF50" : "#3852B4" },
              ]}
            >
              {item.freeWifi ? "Free Wifi" : "Workspace"}
            </Text>
          </View>
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color="#999" />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.formattedAddress}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={handleOpenModal}
            disabled={loadingId === item.id}
          >
            {loadingId === item.id ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Text style={styles.primaryActionText}>Explore</Text>
                <Ionicons name="chevron-forward" size={16} color="white" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "white",
    borderRadius: 28,
    marginBottom: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EFEFEF",
    // Adding elevation for Android / Shadow for iOS "Vibe"
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  imageSection: { width: "100%", height: 260, position: "relative" },
  contentSection: { padding: 20 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  shopName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A1A1A",
    flex: 1,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    color: "#777",
    fontWeight: "500",
  },
  divider: { height: 1, backgroundColor: "#F0F0F0", marginBottom: 16 },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  primaryAction: {
    flex: 1.5,
    backgroundColor: "#1A1A1A",
    height: 50,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  primaryActionText: { color: "white", fontWeight: "700" },
  secondaryAction: {
    flex: 1,
    height: 50,
    backgroundColor: "#F5F5F5",
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryActionText: { color: "#666", fontWeight: "600" },
  ratingBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "white",
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    alignItems: "center",
    gap: 4,
    zIndex: 10,
  },
  ratingText: { fontWeight: "700", fontSize: 12 },
  photoIndicator: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  photoCountText: { color: "white", fontSize: 10, fontWeight: "700" },
  workTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F3FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  workTagText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
});
