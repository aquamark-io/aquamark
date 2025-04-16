// pages/dashboard.js
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Head from 'next/head';

// Initialize Supabase client
// Replace with your actual Supabase URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Wait for Outseta to be available
    const initOutseta = () => {
      if (window.Outseta) {
        // Get current user
        window.Outseta.getUser().then(currentUser => {
          if (currentUser) {
            setUser(currentUser);
            
            // Fetch usage data from Supabase
            fetchUsageData(currentUser.email);
            
            // Initialize Outseta profile embed
            window.Outseta.profile('#outseta-profile', {
              defaultPage: 'profile'
            });
            
            // Set up event listener for plan changes
            window.Outseta.on('subscription.change', handlePlanChange);
          } else {
            // Not authenticated, redirect to login
            window.location.href = '/login';
          }
        });
      } else {
        // If Outseta isn't loaded yet, retry
        setTimeout(initOutseta, 100);
      }
    };
    
    initOutseta();
    
    // Clean up event listeners
    return () => {
      if (window.Outseta) {
        window.Outseta.off('subscription.change');
      }
    };
  }, []);
  
  const fetchUsageData = async (email) => {
    // Get the current month
    const currentMonth = new Date().toISOString().substring(0, 7); // Format: YYYY-MM
    
    const { data, error } = await supabase
      .from('usage')
      .select('*')
      .eq('user_email', email)
      .eq('month', currentMonth)
      .single();
    
    if (error) {
      console.error('Error fetching usage data:', error);
      // If no record exists, create one
      if (error.code === 'PGRST116') {
        await createUsageRecord(email);
      }
    } else {
      setUsage(data);
    }
    
    setLoading(false);
  };
  
  const createUsageRecord = async (email) => {
    // Get plan information from user
    const plan = await getUserPlan();
    
    // Create usage record in Supabase
    const { data, error } = await supabase
      .from('usage')
      .insert([{
        user_email: email,
        month: new Date().toISOString().substring(0, 7),
        pages_used: 0,
        plan_name: plan.name,
        page_credits: plan.credits,
        billing_cycle_start: new Date().toISOString(),
        pages_remaining: plan.credits.toString()
      }]);
    
    if (error) {
      console.error('Error creating usage record:', error);
    } else {
      // Refetch the data
      fetchUsageData(email);
    }
  };
  
  const getUserPlan = async () => {
    // Default to Free Trial
    let planName = 'Free Trial';
    let pageCredits = 100;
    
    if (user && user.planId) {
      switch(user.planId) {
        case 'wQXVMxWK': // Riding Solo
          planName = 'Riding Solo';
          pageCredits = 1000;
          break;
        case 'L9P2krmJ': // Small Teams
          planName = 'Small Teams';
          pageCredits = 5000;
          break;
        case 'xmeJ6nQV': // ISO Shops
          planName = 'ISO Shops';
          pageCredits = 999999; // Unlimited
          break;
      }
    }
    
    return { name: planName, credits: pageCredits };
  };
  
  const handlePlanChange = async (event) => {
    // Update user state
    setUser(event.data.user);
    
    // Refetch usage data to reflect the new plan
    fetchUsageData(event.data.user.email);
  };
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
    <>
      <Head>
        <title>Dashboard | AquaMark</title>
      </Head>
      <div className="dashboard-container">
        <h1>Welcome to Your Dashboard</h1>
        
        {usage && (
          <div className="usage-info">
            <h2>Your Usage</h2>
            <p>Plan: {usage.plan_name}</p>
            <p>Pages Used: {usage.pages_used} / {usage.page_credits}</p>
            <p>Pages Remaining: {usage.pages_remaining}</p>
          </div>
        )}
        
        <div className="profile-section">
          <h2>Profile Settings</h2>
          <div id="outseta-profile"></div>
        </div>
      </div>
    </>
  );
}
