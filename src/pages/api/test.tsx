import type { NextApiResponse } from "next";

export default function handler(res: NextApiResponse) {
  res.status(200).json({ name: "John Doe" });
}
