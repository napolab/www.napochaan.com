"use client";
import { Root } from "@radix-ui/react-dialog";
import { createContext, memo, useCallback, useContext, useMemo, useState } from "react";

import { MediaQueryProvider } from "./media-query-provider";

import type { DialogProps } from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

type ContextValue = {
  open: boolean;
  size?: "sm" | "md" | "lg" | "xl";
};

const Context = createContext<ContextValue>({ open: false });

export const useDialogContext = () => useContext(Context);

type DialogContextProviderProps = DialogProps & {
  children: ReactNode;
};

const DialogContextProviderImpl = ({ children, ...props }: DialogContextProviderProps) => {
  const [open, setOpen] = useState(props.open ?? false);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      props.onOpenChange?.(open);
      setOpen(props.open ?? open);
    },
    [props],
  );

  return (
    <MediaQueryProvider>
      {(size) => (
        <DialogContextContent
          size={size}
          open={props.open ?? open}
          props={props}
          onOpenChange={handleOpenChange}
        >
          {children}
        </DialogContextContent>
      )}
    </MediaQueryProvider>
  );
};

const DialogContextContent = ({ size, open, props, onOpenChange, children }: {
  size: "sm" | "md" | "lg" | "xl" | undefined;
  open: boolean;
  props: DialogProps;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) => {
  const contextValue: ContextValue = useMemo(() => ({ open, size }), [open, size]);

  return (
    <Context.Provider value={contextValue}>
      <Root {...props} onOpenChange={onOpenChange} key={size}>
        {children}
      </Root>
    </Context.Provider>
  );
};

export const DialogContextProvider = memo(DialogContextProviderImpl);