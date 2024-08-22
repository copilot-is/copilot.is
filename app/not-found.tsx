import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white py-2 transition-colors duration-200 dark:bg-gray-900">
      <h1 className="text-6xl font-bold text-gray-900 dark:text-white">404</h1>
      <h2 className="mt-3 text-2xl text-gray-800 dark:text-gray-200">
        Page Not Found
      </h2>
      <p className="mt-4 text-gray-600 dark:text-gray-400">
        Sorry, the page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="mt-6 text-blue-500 hover:underline dark:text-blue-400"
      >
        Return to Home
      </Link>
    </div>
  );
}
