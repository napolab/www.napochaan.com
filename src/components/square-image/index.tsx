import { memo } from "react";

import Budoux from "@components/budoux";
import Image from "@components/image";

import * as styles from "./styles.css";

import type { ComponentPropsWithoutRef, FC, ReactNode } from "react";

export type SquareImageProps = Omit<ComponentPropsWithoutRef<typeof Image>, "width" | "height"> & {
  src: string;
  caption: ReactNode;
  size: number;
};

const SquareImage: FC<SquareImageProps> = (props) => {
  return (
    <figure className={styles.squareImageRoot}>
      <div className={styles.imageRoot}>
        <Image {...props} width={props.size} height={props.size} alt={props.alt} className={styles.image} />
      </div>
      <figcaption className={styles.captionRoot}>
        {typeof props.caption === "string" ? <Budoux>{props.caption}</Budoux> : props.caption}
      </figcaption>
    </figure>
  );
};

export default memo(SquareImage);
