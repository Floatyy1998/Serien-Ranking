import { DiscussionThread } from '../../../components/Discussion';
import { Deferred } from '../../../components/ui/feedback/Deferred';

interface MangaDiscussionProps {
  anilistId: number;
  title: string;
  poster?: string;
  /** Schon etwas gelesen — sonst liegt die Spoiler-Warnung davor. */
  started: boolean;
}

export const MangaDiscussion = ({ anilistId, title, poster, started }: MangaDiscussionProps) => (
  <div className="manga-detail-discussion">
    <Deferred>
      <DiscussionThread
        itemId={anilistId}
        itemType="manga"
        isWatched={started}
        feedMetadata={{ itemTitle: title, posterPath: poster || undefined }}
      />
    </Deferred>
  </div>
);
