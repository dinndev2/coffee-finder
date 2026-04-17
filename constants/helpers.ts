import { Review } from "@/components/CoffeCards";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const isWorkFriendly = (reviews?: Review[]) =>
  reviews?.some((r) =>
    /socket|laptop|quiet|signal|wifi|work|outlet/i.test(r.text?.text),
  ) ?? false;

export const getOrFetch = async <T>(
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> => {
  const cached = await AsyncStorage.getItem(key);
  if (cached) return await fetcher();

  const fresh = await fetcher();
  await AsyncStorage.setItem(key, JSON.stringify(fresh));
  return fresh;
};
