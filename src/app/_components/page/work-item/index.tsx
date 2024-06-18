import Link from "next/link";

import { DialogTrigger, DialogContent, DialogRoot } from "@components/dialog";
import Image from "@components/image";
import { formatBlurURL } from "@components/image/helper";
import SquareImage from "@components/square-image";
import WrappedText from "@components/wrapped-text";
import { button } from "@theme/styles.css";

import * as styles from "./styles.css";

import type { ReactNode } from "react";

export type Props = {
  src: string;
  alt: string;
  caption: string | string[];
  href: string;
  content: ReactNode;
  description?: ReactNode;
};
export const WorkItem = (props: Props) => {
  return (
    <DialogRoot>
      <DialogTrigger className={button}>
        <SquareImage
          src={props.src}
          caption={
            <span className={styles.title}>
              {Array.isArray(props.caption) ? <WrappedText texts={props.caption} /> : props.caption}
            </span>
          }
          alt={props.alt}
          placeholder="blur"
          blurDataURL={formatBlurURL(props.src, { blur: 5 })}
          size={160}
        />
      </DialogTrigger>
      <DialogContent
        title={
          <span className={styles.dialogTitle}>
            {Array.isArray(props.caption) ? <WrappedText texts={props.caption} /> : props.caption}
          </span>
        }
        description={props.description}
      >
        <div className={styles.content}>
          <Link aria-label={`${props.alt} へのリンク`} href={props.href} target="_blank" className={styles.thumbnail}>
            <Image
              src={props.src}
              fill
              alt={props.alt}
              style={{ objectFit: "contain" }}
              placeholder="blur"
              blurDataURL={formatBlurURL(props.src, { blur: 5 })}
            />
          </Link>
          <div className={styles.description}>{props.content}</div>

          {props.href ? (
            <Link href={props.href} target="_blank" className={styles.link}>
              外部リンク
            </Link>
          ) : null}
        </div>
      </DialogContent>
    </DialogRoot>
  );
};
