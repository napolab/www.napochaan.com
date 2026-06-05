'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useRef } from 'react';

import * as s from './fade-in-heading.css';

import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

// Tiny GSAP proof-of-life: fades and slides the heading in on mount.
export const FadeInHeading = ({ children }: Props) => {
  const ref = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      gsap.from(ref.current, {
        opacity: 0,
        y: 24,
        duration: 0.8,
        ease: 'power3.out',
      });
    },
    { scope: ref },
  );

  return (
    <h1 ref={ref} className={s.heading}>
      {children}
    </h1>
  );
};
