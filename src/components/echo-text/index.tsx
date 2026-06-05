import * as styles from './styles.css';

type Props = {
  children: string;
};

export const EchoText = ({ children }: Props) => {
  return (
    <span className={styles.root}>
      <span aria-hidden className={styles.echoOut}>
        {children}
      </span>
      <span aria-hidden className={styles.echoBlue}>
        {children}
      </span>
      <span className={styles.fill}>{children}</span>
    </span>
  );
};
