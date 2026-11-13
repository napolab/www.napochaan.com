'use client';

import { FieldError, Label, Text, TextArea as AriaTextArea, TextField as AriaTextField } from 'react-aria-components';

import * as styles from './styles.css';

type TextAreaProps = {
  label: string;
  name?: string;
  isRequired?: boolean;
  defaultValue?: string;
  description?: string;
  placeholder?: string;
  rows?: number;
  autoComplete?: string;
};

export const TextArea = ({ label, name, isRequired = false, defaultValue, description, placeholder, rows = 6, autoComplete }: TextAreaProps) => {
  return (
    <AriaTextField name={name} isRequired={isRequired} defaultValue={defaultValue} className={styles.field}>
      <Label className={styles.label}>{label}</Label>
      <AriaTextArea className={styles.input} rows={rows} placeholder={placeholder} autoComplete={autoComplete} />
      {description !== undefined ? (
        <Text slot="description" className={styles.description}>
          {description}
        </Text>
      ) : null}
      <FieldError className={styles.error} />
    </AriaTextField>
  );
};
