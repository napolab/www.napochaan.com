import { Video } from '@components/video';

import * as styles from './video-demo.css';

// Ambient: silent, looping, no controls — the VJ-loop use case behind the
// richText `video` block's default variant. Player: the same clip with
// controls + poster, standing in for a talk/session clip. Both point at a
// tiny local faststart MP4 (see public/colophon-video-demo.mp4) — the demo has
// no real media doc to resolve a Media Transformations URL against.
export const VideoDemo = () => (
  <div className={styles.root}>
    <div className={styles.cell}>
      <Video src="/colophon-video-demo.mp4" variant="ambient" width={640} height={360} />
    </div>
    <div className={styles.cell}>
      <Video src="/colophon-video-demo.mp4" variant="player" width={640} height={360} caption="VJ loop sample / 2026" />
    </div>
  </div>
);
