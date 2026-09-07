import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Alert, Share } from 'react-native';

import { SocialNoteCard } from '@/components/social-note-card';
import { SHARE_KIND_META, toggleShareLike } from '@/lib/circle-share';
import { formatSocialTime } from '@/lib/date';
import { CircleShare } from '@/lib/types';

export function CircleShareCard({
  share,
  commentCount,
}: {
  share: CircleShare;
  commentCount: number;
}) {
  const meta = SHARE_KIND_META[share.kind];

  function openThread() {
    router.push({ pathname: '/circle/share/[id]', params: { id: share.id } });
  }

  function shareOut() {
    const message = [share.title, share.body].filter(Boolean).join('\n\n');
    Share.share({ message: message || `${share.authorName} shared in the circle.` }).catch(() => {});
  }

  function more() {
    Alert.alert(share.authorName, meta.label, [
      { text: 'Open comments', onPress: openThread },
      { text: 'Share', onPress: shareOut },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  return (
    <SocialNoteCard
      name={share.authorName}
      time={formatSocialTime(share.createdAt)}
      title={share.title || undefined}
      body={share.body || undefined}
      likeCount={share.likeCount ?? 0}
      liked={share.likedByMe}
      commentCount={commentCount}
      onPress={openThread}
      onLike={() => {
        toggleShareLike(share.id);
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
      onComment={openThread}
      onShare={shareOut}
      onMore={more}
    />
  );
}
