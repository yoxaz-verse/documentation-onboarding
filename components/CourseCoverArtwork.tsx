import type { CourseArtwork } from '../config/courses';
import styles from './CourseCoverArtwork.module.css';

type Props = {
  artwork: CourseArtwork;
};

function OperatorArtwork() {
  return (
    <svg viewBox="0 0 360 230" className={styles.svg} aria-hidden="true" focusable="false">
      <path className={styles.route} d="M31 190c42-31 64-15 92-45 25-27 20-61 55-75 41-16 61 36 99 12 22-14 25-35 49-48" />
      <g className={styles.sparkles}>
        <path d="m45 47 3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8Z" />
        <path d="m300 118 2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Z" />
        <path d="M91 29v12M85 35h12" />
      </g>
      <g className={styles.paper}>
        <path d="M172 39c33-4 74-2 105 3l-4 105c-34-6-68-7-103-1l2-107Z" />
        <path d="m185 62 7 7 12-15M214 62h42M185 91l7 7 12-15M214 91h35M185 120l7 7 12-15M214 120h43" />
      </g>
      <g className={styles.person}>
        <circle cx="106" cy="84" r="25" />
        <path d="M88 78c5-24 34-30 46-10-9 2-18-1-26-7-3 9-10 15-20 17ZM80 177c2-35 9-62 27-67 21-5 39 18 50 48M107 110v35M107 127l-29 20M108 127l35-25" />
        <path className={styles.accentFill} d="M80 177c2-35 9-62 27-67 21-5 39 18 50 48l-29 12-20-25-8 32H80Z" />
        <path d="M79 178h81M94 178l-6 29M139 178l11 29" />
      </g>
      <g className={styles.nodes}>
        <circle cx="38" cy="191" r="12" /><circle cx="123" cy="145" r="10" /><circle cx="180" cy="70" r="9" /><circle cx="278" cy="82" r="10" /><circle cx="326" cy="34" r="12" />
        <path d="m33 191 4 4 7-9M118 145l4 4 7-9M175 70l4 4 7-9M273 82l4 4 7-9M321 34l4 4 7-9" />
      </g>
    </svg>
  );
}

function TradeArtwork() {
  return (
    <svg viewBox="0 0 360 230" className={styles.svg} aria-hidden="true" focusable="false">
      <g className={styles.globe}>
        <circle cx="221" cy="92" r="61" />
        <path d="M160 92h122M221 31c-20 17-30 37-30 61s10 45 30 61M221 31c20 17 30 37 30 61s-10 45-30 61M170 61c31 14 70 14 101 0M170 123c31-14 70-14 101 0" />
        <path className={styles.landFill} d="M181 52c13-10 26-18 43-20l8 15-13 11-3 17-19 6-13-12-3-17Zm60 54 21-7 18 10c-5 21-20 35-39 41l-9-18 10-11-1-15Z" />
      </g>
      <path className={styles.route} d="M37 70c38-37 85-35 120-7M270 47c29 6 46 22 55 46" />
      <g className={styles.plane} transform="translate(133 47) rotate(13)">
        <path d="m0 14 45-13-13 17 12 10-9 3-17-9-10 8-6 1 5-13-7-4Z" />
      </g>
      <g className={styles.ship}>
        <path className={styles.accentFill} d="m72 160 160-1-22 33H99l-27-32Z" />
        <path d="M47 192c17 11 32 11 49 0 17 11 32 11 49 0 17 11 32 11 49 0 17 11 32 11 49 0M92 159l16-38h80l28 38" />
        <path className={styles.containerFill} d="M112 124h36v32h-36zM151 124h36v32h-36zM132 91h38v30h-38z" />
        <path d="M112 124h36v32h-36zM151 124h36v32h-36zM132 91h38v30h-38zM123 124v32M162 124v32M143 91v30" />
      </g>
      <g className={styles.document}>
        <path d="M276 125h50v67h-50zM287 141h28M287 151h23M287 165h18" />
        <circle cx="312" cy="176" r="9" />
        <path d="m307 176 4 4 7-9" />
      </g>
      <g className={styles.sparkles}><path d="M42 110v12M36 116h12M312 27l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Z" /></g>
    </svg>
  );
}

function SpiceArtwork() {
  return (
    <svg viewBox="0 0 360 230" className={styles.svg} aria-hidden="true" focusable="false">
      <path className={styles.route} d="M28 62c54-42 105-18 135 16 29 32 58 28 90-5 24-25 43-20 75-7" />
      <g className={styles.pin}>
        <path d="M55 39c-15 0-26 11-26 25 0 21 26 42 26 42s26-21 26-42c0-14-11-25-26-25Z" />
        <circle cx="55" cy="64" r="8" />
      </g>
      <g className={styles.leaves}>
        <path className={styles.landFill} d="M278 37c29 1 41 17 42 42-28 0-42-15-42-42ZM270 83c-27 6-37 24-33 48 27-5 38-22 33-48Z" />
        <path d="M278 37c9 20 10 39-4 62M320 79c-18-8-31-20-42-42M237 131c13-19 21-32 33-48" />
      </g>
      <g className={styles.sacks}>
        <path className={styles.accentFill} d="M43 125c19-12 52-12 71 0l-7 19c12 13 19 33 17 59H33c-2-26 6-47 18-60l-8-18Z" />
        <path d="M43 125c19-12 52-12 71 0l-7 19c12 13 19 33 17 59H33c-2-26 6-47 18-60l-8-18ZM51 144c20 6 37 6 56 0" />
        <path className={styles.lettering} d="M58 165c12-7 28-7 40 0M62 176c10-5 23-5 32 0" />
      </g>
      <g className={styles.bowl}>
        <ellipse cx="190" cy="159" rx="49" ry="15" />
        <path className={styles.containerFill} d="M141 159c4 30 21 45 49 45s45-15 49-45c-28 12-69 12-98 0Z" />
        <path d="M141 159c4 30 21 45 49 45s45-15 49-45M155 187c21 8 48 8 69 0" />
        <g className={styles.spiceDots}><circle cx="170" cy="153" r="5" /><circle cx="186" cy="149" r="6" /><circle cx="203" cy="154" r="5" /><circle cx="216" cy="148" r="4" /></g>
      </g>
      <g className={styles.jars}>
        <path d="M275 128h45l-4 72h-37l-4-72ZM280 116h35v12h-35z" />
        <path className={styles.landFill} d="M279 164h38l-2 34h-34l-2-34Z" />
        <path d="M287 178c8-6 16-6 23 0M292 188c5-3 10-3 15 0" />
      </g>
      <g className={styles.sparkles}><path d="m142 44 3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8ZM329 111v12M323 117h12" /></g>
    </svg>
  );
}

export default function CourseCoverArtwork({ artwork }: Props) {
  return (
    <div className={styles.artwork} aria-hidden="true">
      {artwork === 'operator' ? <OperatorArtwork /> : null}
      {artwork === 'international-trade' ? <TradeArtwork /> : null}
      {artwork === 'spice-trade' ? <SpiceArtwork /> : null}
    </div>
  );
}
