
    // Minimal client-side demo authentication + OTP
    const $ = s => document.querySelector(s);

    // Tabs
    const tabLogin = $('#tab-login'), tabSignup = $('#tab-signup');
    const loginSect = $('#login-section'), signupSect = $('#signup-section');
    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('active'); tabSignup.classList.remove('active');
      loginSect.style.display = ''; signupSect.style.display = 'none';
      tabLogin.setAttribute('aria-selected','true'); tabSignup.setAttribute('aria-selected','false');
    });
    tabSignup.addEventListener('click', () => {
      tabSignup.classList.add('active'); tabLogin.classList.remove('active');
      signupSect.style.display = ''; loginSect.style.display = 'none';
      tabSignup.setAttribute('aria-selected','true'); tabLogin.setAttribute('aria-selected','false');
    });

    // localStorage user store (demo only)
    function getUsers(){ try{ return JSON.parse(localStorage.getItem('demo_users')||'{}'); }catch(e){ return {}; } }
    function saveUsers(u){ try{ localStorage.setItem('demo_users', JSON.stringify(u)); }catch(e){} }
    const hash = s => btoa(String(s||'')); // demo-only encoding

    // Signup
    $('#signup-btn').addEventListener('click', () => {
      const name = $('#signup-name').value.trim();
      const email = $('#signup-email').value.trim().toLowerCase();
      const pw = $('#signup-password').value;
      const msg = $('#signup-msg'); msg.textContent = '';
      if(!name || !email || !pw){ msg.textContent = 'Please fill all fields.'; return; }
      const users = getUsers();
      if(users[email]){ msg.textContent = 'An account already exists with that email.'; return; }
      users[email] = { name, passwordHash: hash(pw) };
      saveUsers(users);
      msg.textContent = 'Account created. Redirecting to Login...';
      setTimeout(()=>{ msg.textContent=''; tabLogin.click(); }, 900);
    });

    // Login
    $('#login-btn').addEventListener('click', () => {
      const email = $('#login-email').value.trim().toLowerCase();
      const pw = $('#login-password').value;
      const msg = $('#login-msg'); msg.textContent = '';
      if(!email || !pw){ msg.textContent = 'Enter email and password.'; return; }
      const users = getUsers();
      if(!users[email] || users[email].passwordHash !== hash(pw)){ msg.textContent = 'Invalid credentials.'; return; }
      msg.textContent = 'Logged in — demo success!';
      setTimeout(()=>{ msg.textContent=''; alert('Welcome back, ' + (users[email].name || 'User') + ' (demo)'); }, 500);
    });

    // OTP flow (demo)
    const overlay = $('#overlay'), forgotBtn = $('#forgot-btn'), closeModal = $('#close-modal');
    const sendOtpBtn = $('#send-otp-btn'), verifyOtpBtn = $('#verify-otp-btn');
    const stepEmail = $('#step-email'), stepOtp = $('#step-otp'), otpDemo = $('#otp-demo');
    const demoOtpBox = $('#demo-otp'), modalMsg = $('#modal-msg'), otpTimerEl = $('#otp-timer');

    let otpData = null, otpInterval = null;

    forgotBtn.addEventListener('click', () => {
      overlay.classList.add('active'); overlay.setAttribute('aria-hidden','false');
      stepEmail.style.display = ''; stepOtp.style.display = 'none'; otpDemo.style.display = 'none';
      modalMsg.textContent = '';
      $('#reset-email').value = $('#login-email').value.trim() || '';
    });
    closeModal.addEventListener('click', closeOverlay);
    overlay.addEventListener('click', e => { if(e.target === overlay) closeOverlay(); });

    function closeOverlay(){ overlay.classList.remove('active'); overlay.setAttribute('aria-hidden','true'); clearOtp(); }
    function clearOtp(){ if(otpInterval) { clearInterval(otpInterval); otpInterval = null; } otpData = null; otpTimerEl.textContent='--'; }

    sendOtpBtn.addEventListener('click', () => {
      const email = $('#reset-email').value.trim().toLowerCase();
      modalMsg.textContent = '';
      if(!email){ modalMsg.textContent = 'Please enter an email.'; return; }
      const users = getUsers(); if(!users[email]){ modalMsg.textContent = 'No account found with that email.'; return; }

      const code = String(100000 + Math.floor(Math.random() * 900000));
      const ttl = 180;
      otpData = { email, code, expires: Date.now() + ttl*1000 };

      stepEmail.style.display = 'none';
      stepOtp.style.display = '';
      otpDemo.style.display = '';
      demoOtpBox.textContent = code;
      modalMsg.textContent = 'OTP sent (demo).';

      let remaining = ttl;
      otpTimerEl.textContent = remaining;
      if(otpInterval) clearInterval(otpInterval);
      otpInterval = setInterval(() => {
        remaining = Math.max(0, Math.ceil((otpData.expires - Date.now())/1000));
        otpTimerEl.textContent = remaining;
        if(remaining <= 0){ clearInterval(otpInterval); otpInterval = null; modalMsg.textContent = 'OTP expired. Request a new one.'; }
      }, 1000);
    });

    verifyOtpBtn.addEventListener('click', () => {
      if(!otpData){ modalMsg.textContent = 'No OTP requested.'; return; }
      const entered = $('#otp-input').value.trim();
      const newPw = $('#new-password').value;
      if(!entered || !newPw){ modalMsg.textContent = 'Enter OTP and new password.'; return; }
      if(Date.now() > otpData.expires){ modalMsg.textContent = 'OTP expired.'; return; }
      if(entered !== otpData.code){ modalMsg.textContent = 'Invalid OTP.'; return; }
      const users = getUsers();
      if(!users[otpData.email]){ modalMsg.textContent = 'Account missing.'; return; }
      users[otpData.email].passwordHash = hash(newPw); saveUsers(users);
      modalMsg.textContent = 'Password reset successful. You may log in now.';
      clearOtp();
      setTimeout(()=>{ closeOverlay(); $('#login-email').value = otpData.email; $('#login-password').value = ''; tabLogin.click(); }, 900);
    });

    // Enter key convenience
    document.addEventListener('keydown', e => {
      if(e.key === 'Enter'){
        if(document.activeElement === $('#login-password') || document.activeElement === $('#login-email')) $('#login-btn').click();
        else if([$('#signup-name'), $('#signup-email'), $('#signup-password')].includes(document.activeElement)) $('#signup-btn').click();
      }
    });

    // Pre-create demo user
    (function createDemo(){
      const users = getUsers();
      if(!users['demo@company.com']){
        users['demo@company.com'] = { name: 'Demo User', passwordHash: hash('demo1234') };
        saveUsers(users);
      }
    })();
