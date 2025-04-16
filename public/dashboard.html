<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard | AquaMark</title>
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
  <div class="dashboard-container">
    <h1>Welcome to Your Dashboard</h1>
    
    <div id="usage-info" class="usage-info" style="display: none;">
      <h2>Your Usage</h2>
      <p>Plan: <span id="plan-name"></span></p>
      <p>Pages Used: <span id="pages-used"></span> / <span id="page-credits"></span></p>
      <p>Pages Remaining: <span id="pages-remaining"></span></p>
    </div>
    
    <div id="loading-message">Loading your data...</div>
    
    <div class="profile-section">
      <h2>Profile Settings</h2>
      <div id="outseta-profile"></div>
    </div>
  </div>

  <script>
    // Initialize dashboard when the page loads
    document.addEventListener('DOMContentLoaded', function() {
      // Initialize Supabase client
      const supabase = supabase.createClient(config.supabaseUrl, config.supabaseKey);
      let user = null;
      
      // Wait for Outseta to be available
      const initOutseta = () => {
        if (window.Outseta) {
          // Get current user
          window.Outseta.getUser().then(currentUser => {
            if (currentUser) {
              user = currentUser;
              
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
              window.location.href = 'login.js';
            }
          });
        } else {
          // If Outseta isn't loaded yet, retry
          setTimeout(initOutseta, 100);
        }
      };
      
      initOutseta();
      
      // Function to fetch usage data from Supabase
      async function fetchUsageData(email) {
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
          displayUsageData(data);
        }
        
        // Hide loading message
        document.getElementById('loading-message').style.display = 'none';
      }
      
      // Function to create a new usage record
      async function createUsageRecord(email) {
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
      }
      
      // Function to get user's plan information
      function getUserPlan() {
        // Default to Free Trial
        let planName = 'Free Trial';
        let pageCredits = 100;
        
        if (user && user.planId) {
          switch(user.planId) {
            case config.plans.ridingSolo: // Riding Solo
              planName = 'Riding Solo';
              pageCredits = 1000;
              break;
            case config.plans.smallTeams: // Small Teams
              planName = 'Small Teams';
              pageCredits = 5000;
              break;
            case config.plans.isoShops: // ISO Shops
              planName = 'ISO Shops';
              pageCredits = 999999; // Unlimited
              break;
          }
        }
        
        return { name: planName, credits: pageCredits };
      }
      
      // Function to display usage data
      function displayUsageData(data) {
        document.getElementById('plan-name').textContent = data.plan_name;
        document.getElementById('pages-used').textContent = data.pages_used;
        document.getElementById('page-credits').textContent = data.page_credits;
        document.getElementById('pages-remaining').textContent = data.pages_remaining;
        
        // Show the usage info
        document.getElementById('usage-info').style.display = 'block';
      }
      
      // Function to handle plan change events
      function handlePlanChange(event) {
        // Update user state
        user = event.data.user;
        
        // Refetch usage data to reflect the new plan
        fetchUsageData(event.data.user.email);
      }
    });
  </script>
</body>
</html>
