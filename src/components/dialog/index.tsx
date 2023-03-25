import { Close, Content, Description, Overlay, Portal, Root, Title, Trigger } from "@radix-ui/react-dialog";
import {
  Root as ScrollArea,
  ScrollAreaCorner,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from "@radix-ui/react-scroll-area";
import { Root as Separator } from "@radix-ui/react-separator";
import { animated, config, useTransition } from "@react-spring/web";
import { IconX } from "@tabler/icons-react";
import { createContext, forwardRef, memo, useCallback, useContext, useMemo, useState } from "react";
import { useMedia } from "use-media";

import { mediaQueries } from "@theme/css";
import { clsx } from "@utils/clsx";

import * as styles from "./styles.css";

import type { DialogProps } from "@radix-ui/react-dialog";
import type { UseTransitionProps } from "@react-spring/web";
import type { FC, ReactNode } from "react";

type ContextValue = {
  open: boolean;
  size?: "sm" | "md" | "lg" | "xl";
};
const Context = createContext<ContextValue>({ open: false });

export type DialogContentProps = {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
};

const anim: UseTransitionProps = {
  from: { opacity: 0.1, transform: "translate(-50%, -10%)" },
  enter: { opacity: 1, transform: "translate(-50%, -50%)" },
  leave: { opacity: 0, transform: "translate(-50%, -10%)" },
  config: config.gentle,
};

const smAnim: UseTransitionProps = {
  from: { opacity: 1, transform: "translate(0%, 100%) scale(1)" },
  enter: { opacity: 1, transform: "translate(0%, 0%) scale(1)" },
  leave: { opacity: 1, transform: "translate(0%, 100%) scale(1)" },
};

export const DialogContent = memo(
  forwardRef<HTMLDivElement, DialogContentProps>(({ children, title, description }, external) => {
    const { open, size } = useContext(Context);
    const transitions = useTransition(open, size !== "sm" ? anim : smAnim);

    return (
      <Portal forceMount>
        {transitions((style, show) => (
          <>
            {show ? (
              <>
                <Overlay className={styles.overlay} asChild>
                  <animated.div />
                </Overlay>
                <Content ref={external}>
                  <animated.div style={style} className={styles.content}>
                    <div className={styles.header}>
                      <div className={styles.titleRoot}>
                        <Title className={styles.title}>{title}</Title>
                        <Close asChild>
                          <button aria-label="Close" className={styles.close}>
                            <IconX className={styles.icon} />
                          </button>
                        </Close>
                      </div>
                      {description ? <Description>{description}</Description> : null}
                      <Separator className={styles.border} />
                    </div>

                    <ScrollArea className={styles.scrollArea}>
                      <ScrollAreaViewport className={styles.viewport}>{children}</ScrollAreaViewport>

                      <ScrollAreaScrollbar orientation="vertical" forceMount className={styles.scrollbar}>
                        <ScrollAreaThumb className={styles.thumb} />
                      </ScrollAreaScrollbar>
                      <ScrollAreaCorner />
                    </ScrollArea>
                  </animated.div>
                </Content>
              </>
            ) : null}
          </>
        ))}
      </Portal>
    );
  }) satisfies FC<DialogContentProps>,
);

export const DialogTrigger: typeof Trigger = memo(
  forwardRef(({ className, ...props }, ref) => {
    return <Trigger {...props} ref={ref} className={clsx(styles.trigger, className)} />;
  }),
);

type DialogRootProps = DialogProps;
export const DialogRoot = memo(({ children, ...props }) => {
  const [open, setOpen] = useState(props.open ?? false);
  const isXL = useMedia(mediaQueries.xl);
  const isLG = useMedia(mediaQueries.lg);
  const isSM = useMedia(mediaQueries.sm);
  const isMD = useMedia(mediaQueries.md);
  const size = useMemo(() => {
    if (isXL) return "xl";
    if (isLG) return "lg";
    if (isMD) return "md";
    if (isSM) return "sm";

    return undefined;
  }, [isLG, isMD, isSM, isXL]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      props.onOpenChange?.(open);
      setOpen(props.open ?? open);
    },
    [props],
  );

  const contextValue: ContextValue = useMemo(() => ({ open: props.open ?? open, size }), [open, props.open, size]);

  return (
    <Context.Provider value={contextValue}>
      <Root {...props} onOpenChange={handleOpenChange} key={size}>
        {children}
      </Root>
    </Context.Provider>
  );
}) satisfies FC<DialogRootProps>;
