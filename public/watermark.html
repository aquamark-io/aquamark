// pages/watermark.js
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Head from 'next/head';

// Initialize Supabase client
// Replace with your actual Supabase URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function WatermarkPage() {
  const [user, setUser] = useState(null);
  const [credits, setCredits] = useState(0);
  const [canUseService, setCanUseService] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  useEffect(() => {
    // Wait for Outseta to be available
    const initOutseta = () => {
      if (window.Outseta) {
        // Get current user
        window.Outseta.getUser().then(currentUser => {
          if (currentUser) {
            setUser(currentUser);
            
            // Check available credits
            checkCredits(currentUser.email);
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
  }, []);
  
  const checkCredits = async (email) => {
    // Get the current month
    const currentMonth = new Date().toISOString().substring(0, 7); // Format: YYYY-MM
    
    const { data, error } = await supabase
      .from('usage')
      .select('*')
      .eq('user_email', email)
      .eq('month', currentMonth)
      .single();
    
    if (error) {
      console.error('Error checking credits:', error);
      setIsLoading(false);
      setCanUseService(false);
    } else {
      setCredits(parseInt(data.pages_remaining));
      setCanUseService(parseInt(data.pages_remaining) > 0);
      setIsLoading(false);
    }
  };
  
  const trackUsage = async () => {
    if (!user) return false;
    
    // Get the current month
    const currentMonth = new Date().toISOString().substring(0, 7); // Format: YYYY-MM
    
    // Get current usage
    const { data, error } = await supabase
      .from('usage')
      .select('*')
      .eq('user_email', user.email)
      .eq('month', currentMonth)
      .single();
    
    if (error) {
      console.error('Error getting usage:', error);
      return false;
    }
    
    // Check if user has credits left
    if (parseInt(data.pages_used) >= parseInt(data.page_credits)) {
      setCanUseService(false);
      return false;
    }
    
    // Update usage
    const newPagesUsed = parseInt(data.pages_used) + 1;
    const newPagesRemaining = parseInt(data.page_credits) - newPagesUsed;
    
    const { error: updateError } = await supabase
      .from('usage')
      .update({
        pages_used: newPagesUsed,
        pages_remaining: newPagesRemaining.toString()
      })
      .eq('user_email', user.email)
      .eq('month', currentMonth);
    
    if (updateError) {
      console.error('Error updating usage:', updateError);
      return false;
    }
    
    // Update local state
    setCredits(newPagesRemaining);
    setCanUseService(newPagesRemaining > 0);
    
    return true;
  };
  
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };
  
  const handleWatermark = async () => {
    if (!canUseService) {
      alert('You have no credits left. Please upgrade your plan to continue.');
      return;
    }
    
    if (!selectedFile) {
      alert('Please select an image to watermark');
      return;
    }
    
    // Track usage before processing watermark
    const success = await trackUsage();
    
    if (success) {
      // Here you would implement the actual watermarking logic
      // This is a placeholder for your watermarking implementation
      
      // For demonstration purposes, we'll just show a success message
      alert('Watermark applied successfully! Credits remaining: ' + (credits - 1));
      
      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
    } else {
      alert('Could not apply watermark. Please try again later.');
    }
  };
  
  const handleUpgradePlan = () => {
    // Open Outseta change plan dialog
    if (window.Outseta) {
      window.Outseta.showChangePlan();
    }
  };
  
  if (isLoading) {
    return (
      <>
        <Head>
          <title>Watermarking | AquaMark</title>
        </Head>
        <div className="loading">Loading...</div>
      </>
    );
  }
  
  return (
    <>
      <Head>
        <title>Watermarking | AquaMark</title>
      </Head>
      <div className="watermark-container">
        <h1>Watermark Your Images</h1>
        
        <div className="credits-info">
          <p>Available Credits: {credits}</p>
        </div>
        
        {!canUseService && (
          <div className="upgrade-notice">
            <p>You have no credits left. Please upgrade your plan to continue.</p>
            <button 
              onClick={handleUpgradePlan}
              className="upgrade-btn"
            >
              Upgrade Plan
            </button>
          </div>
        )}
        
        {canUseService && (
          <div className="watermark-form">
            <p>Upload an image to add your watermark.</p>
            <div className="file-input">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
              />
            </div>
            
            {previewUrl && (
              <div className="image-preview">
                <p>Image Preview:</p>
                <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '300px' }} />
              </div>
            )}
            
            <div className="watermark-options">
              {/* Add watermark customization options here */}
              {/* For example: position, opacity, custom text, etc. */}
            </div>
            
            <button 
              onClick={handleWatermark}
              className="watermark-btn"
              disabled={!selectedFile}
            >
              Apply Watermark
            </button>
          </div>
        )}
      </div>
    </>
  );
}
