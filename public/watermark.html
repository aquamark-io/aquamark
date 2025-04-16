<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Watermarking | AquaMark</title>
  <link rel="stylesheet" href="globals.css">
  
  <!-- Outseta Script -->
  <script>
    var o_options = {
      domain: 'aquamark.outseta.com',
      load: 'auth,profile'
    };
  </script>
  <script src="https://cdn.outseta.com/outseta.min.js" data-options="o_options"></script>
  
  <!-- Supabase Script -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>
  
  <!-- Config file -->
  <script src="config.js"></script>
</head>
<body>
  <div class="watermark-container">
    <h1>Watermark Your Images</h1>
    
    <div id="loading-message">Checking your available credits...</div>
    
    <div id="credits-info" class="credits-info" style="display: none;">
      <p>Available Credits: <span id="credits-count">0</span></p>
    </div>
    
    <div id="upgrade-notice" class="upgrade-notice" style="display: none;">
      <p>You have no credits left. Please upgrade your plan to continue.</p>
      <button id="upgrade-btn" class="upgrade-btn">Upgrade Plan</button>
    </div>
    
    <div id="watermark-form" class="watermark-form" style="display: none;">
      <p>Upload an image to add your watermark.</p>
      <div class="file-input">
        <input type="file" id="image-upload" accept="image/*">
      </div>
      
      <div id="image-preview" class="image-preview" style="display: none;">
        <p>Image Preview:</p>
        <img id="preview-img" src="" alt="Preview" style="max-width: 100%; max-height: 300px;">
      </div>
      
      <div class="watermark-options">
        <!-- Watermark customization options could go here -->
      </div>
      
      <button id="watermark-btn" class="watermark-btn" disabled>Apply Watermark</button>
    </div>
  </div>

  <script>
    // Initialize watermarking page when document loads
    document.addEventListener('DOMContentLoaded', function() {
      // Initialize Supabase client
      const supabase = supabase.createClient(config.supabaseUrl, config.supabaseKey);
      let user = null;
      let credits = 0;
      let canUseService = false;
      
      // File upload elements
      const imageUpload = document.getElementById('image-upload');
      const previewImg = document.getElementById('preview-img');
      const imagePreview = document.getElementById('image-preview');
      const watermarkBtn = document.getElementById('watermark-btn');
      const upgradeBtn = document.getElementById('upgrade-btn');
      
      // Wait for Outseta to be available
      const initOutseta = () => {
        if (window.Outseta) {
          // Get current user
          window.Outseta.getUser().then(currentUser => {
            if (currentUser) {
              user = currentUser;
              
              // Check available credits
              checkCredits(currentUser.email);
            } else {
              // Not authenticated, redirect to login
              window.location.href = 'login.js';
            }
          });
        } else {
          // If Outseta isn't loaded yet, retry
          setTimeout(initOutseta, 100);
        }
      };
      
      initOutseta();
      
      // Function to check available credits
      async function checkCredits(email) {
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
          hideLoadingShowError();
        } else {
          credits = parseInt(data.pages_remaining);
          canUseService = credits > 0;
          
          // Update UI based on credits
          document.getElementById('credits-count').textContent = credits;
          document.getElementById('credits-info').style.display = 'block';
          
          if (canUseService) {
            document.getElementById('watermark-form').style.display = 'block';
          } else {
            document.getElementById('upgrade-notice').style.display = 'block';
          }
          
          // Hide loading message
          document.getElementById('loading-message').style.display = 'none';
        }
      }
      
      // Function to track usage
      async function trackUsage() {
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
          showUpgradeNotice();
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
        credits = newPagesRemaining;
        document.getElementById('credits-count').textContent = credits;
        canUseService = newPagesRemaining > 0;
        
        if (!canUseService) {
          showUpgradeNotice();
        }
        
        return true;
      }
      
      // Function to hide loading and show error
      function hideLoadingShowError() {
        document.getElementById('loading-message').style.display = 'none';
        // Add an error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = 'There was an error checking your credits. Please try again later.';
        document.querySelector('.watermark-container').appendChild(errorDiv);
      }
      
      // Function to show upgrade notice
      function showUpgradeNotice() {
        document.getElementById('watermark-form').style.display = 'none';
        document.getElementById('upgrade-notice').style.display = 'block';
      }
      
      // Handle file selection
      imageUpload.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Create preview
        const reader = new FileReader();
        reader.onloadend = function() {
          previewImg.src = reader.result;
          imagePreview.style.display = 'block';
          watermarkBtn.disabled = false;
        };
        reader.readAsDataURL(file);
      });
      
      // Handle watermark button click
      watermarkBtn.addEventListener('click', async function() {
        if (!canUseService) {
          alert('You have no credits left. Please upgrade your plan to continue.');
          return;
        }
        
        const file = imageUpload.files[0];
        if (!file) {
          alert('Please select an image to watermark');
          return;
        }
        
        // Track usage before processing watermark
        const success = await trackUsage();
        
        if (success) {
          // Here you would implement the actual watermarking logic
          // This is a placeholder for your watermarking implementation
          
          // For demonstration purposes, we'll just show a success message
          alert('Watermark applied successfully! Credits remaining: ' + credits);
          
          // Reset form
          imageUpload.value = '';
          imagePreview.style.display = 'none';
          watermarkBtn.disabled = true;
        } else {
          alert('Could not apply watermark. Please try again later.');
        }
      });
      
      // Handle upgrade button click
      upgradeBtn.addEventListener('click', function() {
        // Open Outseta change plan dialog
        if (window.Outseta) {
          window.Outseta.showChangePlan();
        }
      });
    });
  </script>
</body>
</html>
