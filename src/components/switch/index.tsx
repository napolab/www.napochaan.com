import { mergeProps, useObjectRef } from "@react-aria/utils";
import { forwardRef, memo, useId, useMemo } from "react";
import { useFocusRing, useSwitch } from "react-aria";
import { useToggleState } from "react-stately";

import { clsx } from "@utils/clsx";

import * as styles from "./styles.css";

import type { ReactNode } from "react";
import type { AriaSwitchProps } from "react-aria";

export type SwitchProps = Readonly<{
  id?: string;
  "aria-label": string;
  "aria-describedby"?: string;
  label?: ReactNode;
  name?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  readonly?: boolean;

  onChange?: (value: boolean) => void;
}>;
const Switch = forwardRef<HTMLInputElement, SwitchProps>((props, forward) => {
  const ref = useObjectRef(forward);
  const cid = useId();
  const id = props.id ?? cid;
  const ariaProps = useMemo<AriaSwitchProps>(
    () => ({
      ...props,
      id,
      children: props.label,
      isDisabled: props.disabled,
      isReadOnly: props.readonly,
      isSelected: props.checked,
      defaultSelected: props.defaultChecked,
    }),
    [id, props],
  );
  const state = useToggleState(ariaProps);
  const { inputProps } = useSwitch(ariaProps, state, ref);
  const { isFocusVisible, focusProps } = useFocusRing();

  return (
    <label className={styles.container}>
      <input {...mergeProps(inputProps, focusProps)} className={styles.input} />

      <div
        className={clsx(
          styles.track,
          isFocusVisible ? styles.focus : undefined,
          state.isSelected ? styles.trackChecked : undefined,
        )}
      >
        <div className={clsx(styles.thumb, state.isSelected ? styles.thumbChecked : undefined)} />
      </div>

      {props.label ? props.label : null}
    </label>
  );
});

export default memo(Switch);
