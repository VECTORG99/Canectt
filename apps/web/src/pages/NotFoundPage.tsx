import { Link } from 'react-router-dom';
import { dictionary } from '../i18n/index';

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <h1 className="font-primary text-4xl font-bold">404</h1>
      <p className="mt-4 text-text-secondary">{dictionary.errors.notFound}</p>
      <Link to="/" className="btn btn-primary btn-shine mt-8">
        {dictionary.header.nav.home}
      </Link>
    </div>
  );
}
