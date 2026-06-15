import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type FeedItem = {
  src: string;
  location: string; // Example: 52°05'39.0"N 12°51'36.1"E
  creator: string;
};

export default function ExploreScreen() {
  const [posts, setPosts] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeed = async () => {
    try {
      const response = await fetch(
        'https://def.strumati.cloud/api/123'
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Supports either a single object or an array
      setPosts(Array.isArray(data) ? data : [data]);
    } catch (error) {
      console.error('Feed fetch failed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFeed();
  }, []);

  const dmsToDecimal = (
    degrees: number,
    minutes: number,
    seconds: number,
    direction: string
  ) => {
    let decimal = degrees + minutes / 60 + seconds / 3600;

    if (direction === 'S' || direction === 'W') {
      decimal *= -1;
    }

    return decimal;
  };

  const parseCoordinates = (input: string) => {
    const regex =
      /(\d+)°(\d+)'([\d.]+)"([NS])\s+(\d+)°(\d+)'([\d.]+)"([EW])/;

    const match = input.match(regex);

    if (!match) return null;

    const lat = dmsToDecimal(
      Number(match[1]),
      Number(match[2]),
      Number(match[3]),
      match[4]
    );

    const lng = dmsToDecimal(
      Number(match[5]),
      Number(match[6]),
      Number(match[7]),
      match[8]
    );

    return { lat, lng };
  };

  const openLocation = async (location: string) => {
    const coords = parseCoordinates(location);

    if (!coords) {
      console.warn('Invalid coordinate format:', location);
      return;
    }

    const url = `https://maps.google.com/?q=${coords.lat},${coords.lng}`;

    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    }
  };

  const renderItem = ({ item }: { item: FeedItem }) => (
    <ThemedView style={styles.card}>
      <Image
        source={{ uri: item.src }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />

      <View style={styles.content}>
        <ThemedText style={styles.creator}>
          @{item.creator}
        </ThemedText>

        <TouchableOpacity
          onPress={() => openLocation(item.location)}
          activeOpacity={0.7}
        >
          <ThemedText type="link">
            📍 Open Location
          </ThemedText>
        </TouchableOpacity>

        <ThemedText style={styles.coordinates}>
          {item.location}
        </ThemedText>
      </View>
    </ThemedView>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      renderItem={renderItem}
      keyExtractor={(item, index) =>
        `${item.creator}-${index}`
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: 24,
  },

  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  card: {
    marginBottom: 20,
    overflow: 'hidden',
  },

  image: {
    width: '100%',
    height: 420,
  },

  content: {
    padding: 14,
    gap: 8,
  },

  creator: {
    fontSize: 16,
    fontWeight: '600',
  },

  coordinates: {
    fontSize: 12,
    opacity: 0.7,
  },
});
