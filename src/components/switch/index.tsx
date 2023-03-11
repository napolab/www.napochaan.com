import { mergeProps, useObjectRef } from "@react-aria/utils";
import { forwardRef, memo, useId, useMemo } from "react";
import { useField, useFocusRing, useSwitch } from "react-aria";
import { useToggleState } from "react-stately";

import { clsx } from "@utils/clsx";

import * as styles from "./styles.css";

import type { ReactNode, FC, ComponentPropsWithoutRef } from "react";
import type { AriaSwitchProps, AriaFieldProps } from "react-aria";

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
  labelPosition?: "left" | "right";
  value?: string;

  onChange?: (value: boolean) => void;
  onBlur?: (e: React.FocusEvent) => void;
  onFocus?: (e: React.FocusEvent) => void;
}>;
const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ size = "medium", labelPosition = "right", label, ...props }, forward) => {
    const ref = useObjectRef(forward);
    const cid = useId();
    const id = props.id ?? cid;
    const ariaProps = useMemo<AriaSwitchProps & AriaFieldProps>(
      () => ({
        ...props,
        id,
        label,
        children: label,
        isDisabled: props.disabled,
        isReadOnly: props.readonly,
        isSelected: props.checked,
        defaultSelected: props.defaultChecked,
        labelElementType: "span",
      }),
      [id, label, props],
    );
    const state = useToggleState(ariaProps);
    const { inputProps } = useSwitch(ariaProps, state, ref);
    const { isFocusVisible, focusProps } = useFocusRing();
    const { labelProps, fieldProps } = useField(ariaProps);

    return (
      <label className={styles.switchRoot}>
        {labelPosition === "left" && (
          <Label {...labelProps} disabled={inputProps.disabled}>
            {label}
          </Label>
        )}

        <input {...mergeProps(inputProps, focusProps, fieldProps)} className={styles.input} />
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

        {labelPosition === "right" && (
          <Label {...labelProps} disabled={inputProps.disabled}>
            {label}
          </Label>
        )}
      </label>
    );
  },
);

export default memo(Switch);

type LabelProps = {
  disabled?: boolean;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<"span">, "children">;
const Label: FC<LabelProps> = ({ disabled, children, ...props }) => {
  const type = disabled ? "disabled" : "default";

  if (children === undefined) return null;

  return (
    <span {...props} className={styles.label[type]}>
      {children}
    </span>
  );
};
