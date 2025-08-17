'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Home() {
  const router = useRouter();

  const handleRedirect = () => {
    router.push('/Home'); // Change this to your target route
  };

  return (
    <div className="center-content">
      <Image
        src="/img/Hanover.png"
        alt="Logo"
        width={600}
        height={600}
        className="logo"
        priority
      />
      <button className="btn btn-black" onClick={handleRedirect}>
        Get Started
      </button>

      <style jsx>{`
        .center-content {
          height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          background-color: #ffffff;
        }

        .logo {
          max-width: 800px;
          height: 600px;
          margin-bottom: 50px;
        }

        .btn-black {
          background-color: #000;
          color: #fff;
          border: none;
          padding: 10px 24px;
          font-size: 16px;
          border-radius: 5px;
        }

        .btn-black:hover {
          background-color: #333;
        }
      `}</style>
    </div>
  );
}
