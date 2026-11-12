// A manual chronicle entry authored in the `logs` collection. Merged into the
// timeline by buildLogTimeline. `date` is ISO (YYYY-MM-DD); `url` optional.
export type LogManualItem = {
  id: string;
  title: string;
  date: string;
  meta: string;
  url?: string;
};
