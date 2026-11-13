import { Fragment } from 'react';

import * as styles from './styles.css';

import type { ReactNode } from 'react';

type ListProps = {
  ordered?: boolean;
  items: ReactNode[];
};

type DescriptionItem = {
  term: string;
  description: string;
};

type DescriptionListProps = {
  items: DescriptionItem[];
};

export const List = ({ ordered = false, items }: ListProps) => {
  const Tag = ordered ? 'ol' : 'ul';

  return (
    <Tag role="list" className={styles.root}>
      {items.map((item, index) => (
        <li key={index} className={styles.item} data-ordered={`${ordered}`}>
          {item}
        </li>
      ))}
    </Tag>
  );
};

export const DescriptionList = ({ items }: DescriptionListProps) => {
  return (
    <dl className={styles.descriptionList}>
      {items.map(({ term, description }) => (
        <Fragment key={term}>
          <dt className={styles.term}>{term}</dt>
          <dd className={styles.description}>{description}</dd>
        </Fragment>
      ))}
    </dl>
  );
};
