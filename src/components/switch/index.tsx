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
  autoFocus?: boolean;
  size?: "small" | "medium" | "large";
  labelPosition?: "left" | "right"

  onChange?: (value: boolean) => void;
  onBlur?: (e: React.FocusEvent) => void;
  onFocus?: (e: React.FocusEvent) => void;
}>;
const Switch = forwardRef<HTMLInputElement, SwitchProps>(({ size = "medium", labelPosition = "right", ...props }, forward) => {
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
      {labelPosition === "left" &&  props.label ? props.label : null}

      <input {...mergeProps(inputProps, focusProps)} className={styles.input} />
      <div
        className={clsx(
          styles.track[size],
          isFocusVisible ? styles.track.focus : undefined,
          state.isSelected ? styles.track.checked : undefined,
          inputProps.disabled ? styles.track.disabled : undefined,
        )}
      >
        <div
          className={clsx(
            styles.thumb.default,
            state.isSelected ? styles.thumb.checked : undefined,
            inputProps.disabled ? styles.thumb.disabled : undefined,
          )}
        />
      </div>

      {labelPosition === "right" &&  props.label ? props.label : null}
    </label>
  );
});

export default memo(Switch);
