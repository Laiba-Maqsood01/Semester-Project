document.addEventListener('DOMContentLoaded', () => {
  const accountPanel = document.getElementById('accountPanel');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const showSignup = document.getElementById('showSignup');
  const showLogin = document.getElementById('showLogin');
  const logoutBtn = document.getElementById('logoutBtn');
  const accountDetails = document.getElementById('accountDetails');
  const accountBtn = document.getElementById("accountBtn");
  const closePanelBtn = document.querySelector(".close-panel");



  if (accountBtn && accountPanel) {
    accountBtn.addEventListener("click", (e) => {
      e.preventDefault();
      accountPanel.classList.add("active");
    });
  }

  if (closePanelBtn && accountPanel) {
    closePanelBtn.addEventListener("click", () => {
      accountPanel.classList.remove("active");
    });
  }



  //changes start from here

  // Toggle dropdown on mobile when clicking the parent link
  document.querySelectorAll('.dropdown > a').forEach(link => {
    link.addEventListener('click', function (e) {
      if (window.innerWidth <= 768) {
        e.preventDefault(); // Prevent link navigation
        const dropdown = this.parentElement;
        dropdown.classList.toggle('active');
      }
    });
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.dropdown') && window.innerWidth <= 768) {
      document.querySelectorAll('.dropdown').forEach(dropdown => {
        dropdown.classList.remove('active');
      });
    }
  });


  // Toggle forms
  showSignup.addEventListener('click', e => {
    e.preventDefault();
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
  });

  showLogin.addEventListener('click', e => {
    e.preventDefault();
    signupForm.style.display = 'none';
    loginForm.style.display = 'block';
  });

  // Login
  document.getElementById('loginFormElement').addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: "include"
    });

    const data = await res.json();
    if (res.ok) {
      loadUserDetails();
    } else {
      document.getElementById('successMessage').textContent = data.error || 'Login failed';
    }
  });

  // Signup
  document.getElementById('signupFormElement').addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirm = document.getElementById('signupConfirmPassword').value;

    // validation for password
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[^\s]+$/;


    if (!passwordPattern.test(password)) {
      document.getElementById('signupPasswordError').textContent =
        "Password must contain at least one lowercase letter, one uppercase letter, and one number.";
      return;
    } else {
      document.getElementById('signupPasswordError').textContent = "";
    }

    if (password !== confirm) {
      document.getElementById('signupConfirmPasswordError').textContent = "Passwords don't match";
      return;
    } else {
      document.getElementById('signupConfirmPasswordError').textContent = "";
    }


    const res = await fetch('/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();
    if (res.ok) {
      document.getElementById('signupSuccessMessage').textContent = "Signup successful! Please login.";
      signupForm.style.display = 'none';
      loginForm.style.display = 'block';
    } else {
      document.getElementById('signupSuccessMessage').textContent = data.error || 'Signup failed';
    }
  });

  // Logout
  logoutBtn.addEventListener('click', async () => {
    await fetch('/logout');
    location.reload();
  });

  // Load user info
  async function loadUserDetails() {
    const res = await fetch('/me', {
      credentials: 'include'
    });
    if (res.ok) {
      const user = await res.json();
      document.getElementById('userNameDisplay').textContent = user.name;
      document.getElementById('userEmailDisplay').textContent = user.email;

      loginForm.style.display = 'none';
      signupForm.style.display = 'none';
      accountDetails.style.display = 'block';
    }

  }

//it will clear messages when typing or switching b/w logIn and SignUp
const clearLoginMessages= ()=>{
  document.getElementById('successMessage').textContent = '';
  document.getElementById('emailError').textContent = '';
  document.getElementById('passwordError').textContent = '';
}
 const clearSignupMessages = () =>{
  document.getElementById('signupSuccessMessage').textContent = '';
  document.getElementById('signupNameError').textContent = '';
  document.getElementById('signupEmailError').textContent = '';
  document.getElementById('signupPasswordMessage').textContent = '';
  document.getElementById('signupConfirmPasswordError').textContent = '';
 }

 //when error occur while typing in login input fileds
 ['email','password'].forEach(id =>{
  const input = document.getElementById(id);
  input.addEventListener('input', clearLoginMessages);
 });

//when error occure typing in signup form fileds
['signupName', 'signupEmail', 'signupPassword', 'signupConfirmPassword'].forEach(id =>{
  const input = document.getElementById(id);
  input.addEventListener('input', clearSignupMessages);
});
//when user switch to signup panel
showSignup.addEventListener('click', ()=>{
  clearLoginMessages();
  clearSignupMessages(); // because when user signup and click on login then again click on signup, there's still "Signup succssfull" message appear
});
showLogin.addEventListener('click', ()=>{
  clearSignupMessages();
  clearLoginMessages();
});



  loadUserDetails(); // check login status on load
});
