// Helper
const $ = s => document.querySelector(s);

// Tabs
const tabLogin = $('#tab-login');
const tabSignup = $('#tab-signup');
const loginSect = $('#login-section');
const signupSect = $('#signup-section');

tabLogin.onclick = () => {
  tabLogin.classList.add('active');
  tabSignup.classList.remove('active');
  loginSect.style.display = '';
  signupSect.style.display = 'none';
};

tabSignup.onclick = () => {
  tabSignup.classList.add('active');
  tabLogin.classList.remove('active');
  signupSect.style.display = '';
  loginSect.style.display = 'none';
};

// LocalStorage demo auth
function getUsers() {
  try { return JSON.parse(localStorage.getItem('demo_users') || '{}'); }
  catch { return {}; }
}

function saveUsers(u) {
  localStorage.setItem('demo_users', JSON.stringify(u));
}

const hash = s => btoa(String(s));

// Signup
$('#signup-btn').onclick = () => {
  const name = $('#signup-name').value.trim();
  const email = $('#signup-email').value.trim().toLowerCase();
  const pw = $('#signup-password').value;
  const msg = $('#signup-msg');

  if (!name || !email || !pw) return msg.textContent = 'Please fill all fields.';

  const users = getUsers();
  if (users[email]) return msg.textContent = 'Email already registered.';

  users[email] = { name, passwordHash: hash(pw) };
  saveUsers(users);

  msg.textContent = 'Account created. Redirecting...';
  setTimeout(() => { msg.textContent = ''; tabLogin.click(); }, 900);
};

// Login
$('#login-btn').onclick = () => {
  const email = $('#login-email').value.trim().toLowerCase();
  const pw = $('#login-password').value;
  const msg = $('#login-msg');

  if (!email || !pw) return msg.textContent = 'Enter email and password.';

  const users = getUsers();

  if (!users[email] || users[email].passwordHash !== hash(pw))
    return msg.textContent = 'Invalid credentials.';

  msg.textContent = 'Logged in!';

  // ✅ Redirect to stock.html on successful login
  setTimeout(() => {
    window.location.href = "stock.html";
  }, 600);
};

// OTP modal logic
const overlay = $('#overlay');
const forgotBtn = $('#forgot-btn');
const closeModal = $('#close-modal');
const sendOtpBtn = $('#send-otp-btn');
const verifyOtpBtn = $('#verify-otp-btn');

let otp = null;
let timer = null;

forgotBtn.onclick = () => {
  overlay.classList.add('active');
  $('#reset-email').value = $('#login-email').value.trim() || '';
};

closeModal.onclick = () => {
  overlay.classList.remove('active');
};

// Send OTP
sendOtpBtn.onclick = () => {
  const email = $('#reset-email').value.trim().toLowerCase();
  const msg = $('#modal-msg');

  const users = getUsers();
  if (!users[email]) return msg.textContent = 'No account with that email.';

  const code = String(100000 + Math.floor(Math.random() * 900000));
  otp = { email, code, expires: Date.now() + 180000 };

  $('#step-email').style.display = 'none';
  $('#step-otp').style.display = '';
  $('#otp-demo').style.display = '';
  $('#demo-otp').textContent = code;
  msg.textContent = 'OTP sent (demo).';

  let remaining = 180;
  $('#otp-timer').textContent = remaining;

  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    remaining = Math.max(0, Math.ceil((otp.expires - Date.now()) / 1000));
    $('#otp-timer').textContent = remaining;

    if (remaining <= 0) {
      clearInterval(timer);
      msg.textContent = 'OTP expired. Request a new one.';
    }
  }, 1000);
};

// Verify OTP
verifyOtpBtn.onclick = () => {
  const msg = $('#modal-msg');

  if (!otp) return msg.textContent = 'No OTP requested.';
  if (Date.now() > otp.expires) return msg.textContent = 'OTP expired.';

  const entered = $('#otp-input').value.trim();
  if (entered !== otp.code) return msg.textContent = 'Incorrect OTP.';

  const newPw = $('#new-password').value;
  if (!newPw) return msg.textContent = 'Enter new password.';

  const users = getUsers();
  users[otp.email].passwordHash = hash(newPw);
  saveUsers(users);

  msg.textContent = 'Password reset successful!';
  setTimeout(() => overlay.classList.remove('active'), 800);
};

// Demo default user
(function () {
  const users = getUsers();
  if (!users['demo@company.com']) {
    users['demo@company.com'] = { name: 'Demo User', passwordHash: hash('demo1234') };
    saveUsers(users);
  }
})();
