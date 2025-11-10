import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center ">
      <div className="text-center space-y-8 px-4">
        {/* 404 Text */}
        <h1 className="text-9xl font-bold text-gray-800 dark:text-gray-100">
          404
        </h1>

        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="/images/logo.png"
            alt="InfiniteX Logo"
            width={200}
            height={200}
            className="object-contain"
            priority
          />
        </div>

        <hr />
        {/* Error Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
            This page could not be found.
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            ไม่พบหน้าที่คุณต้องการ
          </p>
        </div>

        {/* Back to Home Button */}
        <div className="pt-4">
          <Link
            href="/store-inventory/product-list"
            className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            กลับสู่หน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}
