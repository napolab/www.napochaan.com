/* eslint-disable @next/next/no-img-element */

import { memo, useMemo } from "react";

import Budoux from "@components/budoux";

import * as styles from "./styles.css";

import type { ComponentPropsWithoutRef, FC } from "react";

export type SquareImageProps = Omit<ComponentPropsWithoutRef<"img">, "width" | "height" | "placeholder"> & {
  src: string;
  caption: string;
  strategy?: FC<Omit<SquareImageProps, "strategy"> & Pick<ComponentPropsWithoutRef<"img">, "width" | "height">>;
};

const SquareImage: FC<SquareImageProps> = ({ loading = "lazy", strategy, ...props }) => {
  const imageProps = useMemo(
    () => ({
      loading,
      alt: props.alt ?? props.caption,
      width: 160,
      height: 160,
      ...props,
    }),
    [loading, props],
  );

  return (
    <figure className={styles.squareImageRoot}>
      <div className={styles.imageRoot}>
        {strategy ? strategy(imageProps) : <img {...imageProps} alt={imageProps.alt} className={styles.image} />}
      </div>
      <figcaption className={styles.captionRoot}>
        <Budoux>{props.caption}</Budoux>
      </figcaption>
    </figure>
  );
};

export default memo(SquareImage);
