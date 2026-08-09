import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { dictionary } from '../i18n/index';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.2, 0, 0, 1] as const },
};

export default function LandingPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col px-4">
      <motion.section
        {...fadeUp}
        className="flex flex-col items-center py-16 text-center tablet:py-24 desktop:py-32"
      >
        <h1
          className="font-primary font-bold leading-tight"
          style={{
            fontSize: 'clamp(2.75rem, 8vw, 3.5rem)',
          }}
        >
          <span className="text-gradient">{dictionary.landing.hero.title}</span>
        </h1>
        <p
          className="mt-6 max-w-2xl text-text-secondary"
          style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }}
        >
          {dictionary.landing.hero.description}
        </p>
        <Link to="/crear" className="btn btn-primary btn-shine mt-10">
          {dictionary.landing.hero.cta}
        </Link>
      </motion.section>

      <footer
        className="mt-auto flex flex-wrap items-center justify-center gap-4 border-t py-8 text-sm text-text-secondary"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <a
          href="https://github.com/canectt/canectt"
          target="_blank"
          rel="noreferrer noopener"
          className="hover:text-text-primary"
        >
          {dictionary.landing.footer.github}
        </a>
        <span aria-hidden="true">·</span>
        <a
          href="https://www.apache.org/licenses/LICENSE-2.0"
          target="_blank"
          rel="noreferrer noopener"
          className="hover:text-text-primary"
        >
          {dictionary.landing.footer.license}
        </a>
        <span aria-hidden="true">·</span>
        <a
          href="https://github.com/canectt/canectt/tree/main/docs"
          target="_blank"
          rel="noreferrer noopener"
          className="hover:text-text-primary"
        >
          {dictionary.landing.footer.docs}
        </a>
      </footer>
    </div>
  );
}
