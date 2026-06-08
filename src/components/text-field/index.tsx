'use client';

import { FieldError, Input, Label, Text, TextField as AriaTextField } from 'react-aria-components';

import * as styles from './styles.css';

type TextFieldProps = {
  label: string;
  name?: string;
  type?: 'text' | 'email' | 'url' | 'tel';
  isRequired?: boolean;
  defaultValue?: string;
  description?: string;
  placeholder?: string;
  autoComplete?: string;
};

export const TextField = ({ label, name, type = 'text', isRequired = false, defaultValue, description, placeholder, autoComplete }: TextFieldProps) => {
  return (
    <AriaTextField name={name} type={type} isRequired={isRequired} defaultValue={defaultValue} className={styles.field}>
      <Label className={styles.label}>{label}</Label>
      <Input className={styles.input} type={type} placeholder={placeholder} autoComplete={autoComplete} />
      {description !== undefined ? (
        <Text slot="description" className={styles.description}>
          {description}
        </Text>
      ) : null}
      <FieldError className={styles.error} />
    </AriaTextField>
  );
};
