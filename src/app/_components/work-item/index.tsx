import Link from "next/link";

import Budoux from "@components/budoux";
import { DialogTrigger, DialogContent, DialogRoot } from "@components/dialog";
import Image from "@components/image";
import { formatBlurURL } from "@components/image/helper";
import SquareImage from "@components/square-image";
import WrappedText from "@components/wrapped-text";
import { button } from "@theme/styles.css";

import * as styles from "./styles.css";

export type Props = {
  src: string;
  alt: string;
  caption: string[];
  href: string;
  content: string;
};
export const WorkItem = (Props: Props) => {
  return (
    <DialogRoot>
      <DialogTrigger className={button}>
        <SquareImage
          src={Props.src}
          caption={<WrappedText texts={Props.caption} />}
          alt={Props.alt}
          placeholder="blur"
          blurDataURL={formatBlurURL(Props.src, { blur: 5 })}
        />
      </DialogTrigger>
      <DialogContent title={<WrappedText texts={Props.caption} />}>
        <div className={styles.content}>
          <Link aria-label={`${Props.alt} へのリンク`} href={Props.href} target="_blank" className={styles.thumbnail}>
            <Image
              src={Props.src}
              fill
              alt={Props.alt}
              style={{ objectFit: "contain" }}
              placeholder="blur"
              blurDataURL={formatBlurURL(Props.src, { blur: 5 })}
            />
          </Link>
          <div className={styles.description}>
            <Budoux>{Props.content}</Budoux>
          </div>

          {Props.href ? (
            <Link href={Props.href} target="_blank" className={styles.link}>
              外部リンク
            </Link>
          ) : null}
        </div>
      </DialogContent>
    </DialogRoot>
  );
};
