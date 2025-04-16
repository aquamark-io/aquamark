// pages/login.js
import { useEffect } from 'react';
import Head from 'next/head';

export default function LoginPage() {
  useEffect(() => {
    // Wait for Outseta to be available
    const initOutseta = () => {
      if (window.Outseta) {
        // Initialize Outseta login embed
        window.Outseta.auth('#outseta-auth', {
          type: 'login',
          // Note: We don't need to set redirectToUrlAfterLogin here
          // since it's configured in the Outseta admin panel
        });
      } else {
        // If Outseta isn't loaded yet, retry
        setTimeout(initOutseta, 100);
      }
    };
    
    initOutseta();
  }, []);
  
  return (
    <>
      <Head>
        <title>Login | AquaMark</title>
      </Head>
      <div className="login-container">
        <h1>Log In to AquaMark</h1>
        <div id="outseta-auth"></div>
      </div>
    </>
  );
}
