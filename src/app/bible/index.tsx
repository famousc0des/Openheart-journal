import { NamedIcon } from '@/components/ui/icon';
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CircleShareSheet } from "@/components/circle-share-sheet";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Pill } from "@/components/ui/pill";
import { Fonts, Radius, SoftShadow, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { ShareDraft } from "@/lib/circle-share";
import { searchVerses } from "@/lib/bible-data";
import { createId } from "@/lib/id";
import { journalStore } from "@/lib/stores";
import { ScriptureVerse } from "@/lib/types";

const TOPICS = [
  "peace",
  "anxious",
  "grateful",
  "hopeful",
  "weary",
  "sorrowful",
];
const TOPIC_LABELS: Record<string, string> = {
  peace: "Peace",
  anxious: "Anxiety",
  grateful: "Gratitude",
  hopeful: "Hope",
  weary: "Weariness",
  sorrowful: "Grief",
};

export default function BibleScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [shareDraft, setShareDraft] = useState<ShareDraft | null>(null);

  const results = useMemo(() => searchVerses(query), [query]);

  function saveToJournal(verse: ScriptureVerse) {
    const now = new Date().toISOString();
    const id = createId();
    journalStore.add({
      id,
      createdAt: now,
      updatedAt: now,
      type: "freeform",
      title: verse.ref,
      body: `“${verse.text}”\n\n`,
      scriptureRefs: [verse.ref],
    });
    setSaved((prev) => ({ ...prev, [verse.ref]: true }));
    router.push(`/journal/${id}`);
  }

  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={["top"]}>
        <FlatList
          data={results}
          keyExtractor={(item) => item.ref}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <View style={styles.header}>
              <ThemedText type="small" themeColor="textSecondary">
                A small offline starter set (KJV, public domain).
              </ThemedText>
              <View
                style={[
                  styles.searchBar,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}
              >
                <NamedIcon name="search" size={16} color={theme.textSecondary} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search by word, reference, or topic"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.searchInput, { color: theme.text }]}
                />
              </View>
              <View style={styles.chipRow}>
                {TOPICS.map((topic) => (
                  <Pill
                    key={topic}
                    label={TOPIC_LABELS[topic]}
                    active={query === topic}
                    onPress={() => setQuery(query === topic ? "" : topic)}
                  />
                ))}
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.card,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}
            >
              <ThemedText type="smallBold" themeColor="accent">
                {item.ref}
              </ThemedText>
              <ThemedText style={styles.verseText}>“{item.text}”</ThemedText>
              <Pressable
                onPress={() => saveToJournal(item)}
                style={styles.saveRow}
              >
                <NamedIcon
                  name={
                    saved[item.ref] ? "checkmark-circle" : "add-circle-outline"
                  }
                  size={18}
                  color={theme.accent}
                />
                <ThemedText type="small" themeColor="accent">
                  {saved[item.ref]
                    ? "Added to journal"
                    : "Reflect on this in your journal"}
                </ThemedText>
              </Pressable>
              <Pressable
                accessibilityLabel={`Share ${item.ref} with a circle`}
                onPress={() =>
                  setShareDraft({
                    kind: "verse",
                    sourceId: item.ref,
                    title: item.ref,
                    body: `“${item.text}”`,
                  })
                }
                style={styles.saveRow}
              >
                <NamedIcon name="people-outline" size={18} color={theme.accent} />
                <ThemedText type="small" themeColor="accent">
                  Share with a circle
                </ThemedText>
              </Pressable>
            </View>
          )}
        />
        <CircleShareSheet
          visible={Boolean(shareDraft)}
          draft={shareDraft}
          onClose={() => setShareDraft(null)}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    padding: Spacing.four,
    paddingBottom: Spacing.six * 2,
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: 32,
    lineHeight: 44,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 15,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  card: {
    ...SoftShadow,
    borderRadius: Radius.large,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  verseText: {
    fontStyle: "italic",
    lineHeight: 22,
  },
  saveRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
