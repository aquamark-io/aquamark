// pages/signup.js
import { useEffect } from 'react';
import Head from 'next/head';

export default function SignupPage() {
  useEffect(() => {
    // Wait for Outseta to be available
    const initOutseta = () => {
      if (window.Outseta) {
        // Initialize Outseta signup embed with Free Trial plan
        window.Outseta.auth('#outseta-auth', {
          type: 'signup',
          planId: 'aWxLDdWV', // Free Trial plan ID
          // Note: Post Sign Up URL is configured in Outseta admin
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
        <title>Sign Up | AquaMark</title>
      </Head>
      <div className="signup-container">
        <h1>Create Your AquaMark Account</h1>
        <div id="outseta-auth"></div>
      </div>
    </>
  );
}
