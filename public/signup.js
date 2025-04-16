<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign Up | AquaMark</title>
  <link rel="stylesheet" href="globals.css">
  
  <!-- Outseta Script -->
  <script>
    var o_options = {
      domain: 'aquamark.outseta.com',
      load: 'auth,profile'
    };
  </script>
  <script src="https://cdn.outseta.com/outseta.min.js" data-options="o_options"></script>
  
  <!-- Config file -->
  <script src="config.js"></script>
</head>
<body>
  <div class="signup-container">
    <h1>Create Your AquaMark Account</h1>
    <div id="outseta-auth"></div>
  </div>

  <script>
    // Initialize Outseta signup embed when the page loads
    document.addEventListener('DOMContentLoaded', function() {
      // Wait for Outseta to be available
      const initOutseta = () => {
        if (window.Outseta) {
          // Initialize Outseta signup embed with Free Trial plan
          window.Outseta.auth('#outseta-auth', {
            type: 'signup',
            planId: config.plans.freeTrial,
            // Note: Post Sign Up URL is configured in Outseta admin
          });
        } else {
          // If Outseta isn't loaded yet, retry
          setTimeout(initOutseta, 100);
        }
      };
      
      initOutseta();
    });
  </script>
</body>
</html>
