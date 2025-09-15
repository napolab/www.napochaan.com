import keyVisualImage from "@assets/napochaan.webp";
import Image from "@components/image";

import { ContactAwareRoot } from "./contact-aware-wrapper";
import * as styles from "./styles.css";

export const Background = () => {
  return (
    <div className={styles.decorationRoot}>
      <div aria-hidden="true" className={styles.decoration1} />
      <div aria-hidden="true" className={styles.decoration2} />
      <ContactAwareRoot>
        <Image
          className={styles.decorationImage}
          src={keyVisualImage}
          alt="naporitan のオリジナルキャラクター"
          width={600}
          height={600}
        />
      </ContactAwareRoot>
    </div>
  );
};
