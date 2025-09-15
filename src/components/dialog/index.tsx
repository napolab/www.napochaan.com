import { Close, Content, Description, Overlay, Portal, Title, Trigger } from "@radix-ui/react-dialog";
import { IconX } from "@tabler/icons-react";
import { motion } from "motion/react";
import { forwardRef, memo } from "react";

import ScrollArea from "@components/scroll-area";
import { clsx } from "@utils/clsx";

import { AnimatedDialogContent } from "./_components/animated-dialog-content";
import { DialogContextProvider, useDialogContext } from "./dialog-context-provider";
import * as styles from "./styles.css";

import type { DialogProps } from "@radix-ui/react-dialog";
import type { ComponentPropsWithoutRef, FC, ReactNode } from "react";

type DialogContentProps = {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
};

export const DialogContent = memo(
  forwardRef<HTMLDivElement, DialogContentProps>(({ children, title, description }, external) => {
    const { open, size } = useDialogContext();
    const isSmall = size === "sm";

    return (
      <Portal forceMount>
        <AnimatedDialogContent open={open} size={size}>
          <>
            <Overlay className={styles.overlay} />
            <Content ref={external}>
              <motion.div 
                className={styles.content}
                initial={
                  isSmall
                    ? { x: 0, y: "100%", opacity: 1, scale: 1 }
                    : { x: "-50%", y: "-25%", opacity: 0.1, scale: 0.96 }
                }
                animate={
                  isSmall
                    ? { x: 0, y: 0, opacity: 1, scale: 1 }
                    : { x: "-50%", y: "-50%", opacity: 1, scale: 1 }
                }
                exit={
                  isSmall
                    ? { x: 0, y: "100%", opacity: 1, scale: 1 }
                    : { x: "-50%", y: "-25%", opacity: 0, scale: 0.96 }
                }
                transition={
                  isSmall
                    ? {
                        type: "spring",
                        stiffness: 280,
                        damping: 30,
                        velocity: 0.016,
                      }
                    : {
                        type: "spring",
                        mass: 0.8,
                        stiffness: 140,
                        damping: 16,
                        velocity: 0.015,
                      }
                }
              >
                <div className={styles.header}>
                  <div className={styles.titleRoot}>
                    <Title className={styles.title}>{title}</Title>
                    <Close asChild>
                      <button aria-label="Close" className={styles.close}>
                        <IconX className={styles.icon} />
                      </button>
                    </Close>
                  </div>
                  {description !== undefined ? <Description>{description}</Description> : null}
                  <div className={styles.border} role="separator" aria-orientation="horizontal" />
                </div>
                <ScrollArea orientation="vertical" scrollbar="all">
                  {children}
                </ScrollArea>
              </motion.div>
            </Content>
          </>
        </AnimatedDialogContent>
      </Portal>
    );
  }) satisfies FC<DialogContentProps>,
);

export const DialogTrigger = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<typeof Trigger>>(
  ({ className, ...props }, ref) => {
    return <Trigger {...props} ref={ref} className={clsx(styles.trigger, className)} />;
  },
);

type DialogRootProps = DialogProps;
export const DialogRoot = memo(({ children, ...props }) => {
  return <DialogContextProvider {...props}>{children}</DialogContextProvider>;
}) satisfies FC<DialogRootProps>;
