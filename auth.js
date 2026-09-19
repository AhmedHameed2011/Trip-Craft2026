/**
 * auth.js - Manages Supabase Authentication, Session State, and Header UI integration.
 */

document.addEventListener('DOMContentLoaded', () => {
  const sbClient = window.supabaseClient || window.supabase;
  if (typeof sbClient === 'undefined' || !sbClient) {
    console.error('❌ Supabase client is not initialized. Make sure supabase-config.js is loaded before auth.js.');
    return;
  }

  // DOM Elements
  const loginModal = document.getElementById('loginModal');
  const registerModal = document.getElementById('registerModal');
  const newTripModal = document.getElementById('newTripModal');

  const btnLoginModal = document.getElementById('btnLoginModal');
  const btnRegisterModal = document.getElementById('btnRegisterModal');
  
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  // --- Bulletproof Modal Utilities ---
  function openModal(modal) {
    if (modal) {
      modal.style.cssText = 'display: flex !important; opacity: 1 !important; visibility: visible !important; pointer-events: auto !important;';
      modal.classList.add('active', 'show', 'open');
    }
  }

  function closeModal(modal) {
    if (modal) {
      modal.classList.remove('active', 'show', 'open', 'visible', 'is-open');
      modal.style.cssText = 'display: none !important; opacity: 0 !important; visibility: hidden !important; pointer-events: none !important;';
    }
  }

  if (btnLoginModal) btnLoginModal.addEventListener('click', () => openModal(loginModal));
  if (btnRegisterModal) btnRegisterModal.addEventListener('click', () => openModal(registerModal));

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeModal(loginModal);
      closeModal(registerModal);
      closeModal(newTripModal);
    });
  });

  window.addEventListener('click', (e) => {
    if (e.target === loginModal) closeModal(loginModal);
    if (e.target === registerModal) closeModal(registerModal);
    if (e.target === newTripModal) closeModal(newTripModal);
  });

  // --- UI State Management for Authentication ---
  function updateAuthUI(session) {
    let authNavGroup = document.getElementById('authNavGroup') || document.getElementById('loggedOutGroup');
    let userNavGroup = document.getElementById('userNavGroup') || document.getElementById('loggedInGroup');

    if (!authNavGroup && btnLoginModal) {
      authNavGroup = btnLoginModal.parentElement;
    }

    if (!userNavGroup && authNavGroup && authNavGroup.parentElement) {
      userNavGroup = document.createElement('div');
      userNavGroup.id = 'userNavGroup';
      userNavGroup.className = 'user-nav-group';
      authNavGroup.parentElement.appendChild(userNavGroup);
    }

    if (!authNavGroup || !userNavGroup) {
      console.warn('⚠️ Unable to find or create navbar container elements.');
      return;
    }

    if (session?.user) {
      const userEmail = session.user.email || '';
      const displayName = session.user.user_metadata?.full_name || userEmail.split('@')[0] || 'User';
      const initial = displayName.charAt(0).toUpperCase();

      window.currentUser = {
        id: session.user.id,
        email: userEmail,
        name: displayName,
        user_metadata: session.user.user_metadata
      };

      authNavGroup.style.display = 'none';
      userNavGroup.style.display = 'flex';
      userNavGroup.style.alignItems = 'center';
      userNavGroup.style.gap = '0.75rem';

      userNavGroup.innerHTML = `
        <div class="user-profile-badge" style="display: flex; align-items: center; gap: 0.5rem; background: var(--bg-secondary, rgba(150,150,150,0.1)); padding: 0.25rem 0.75rem 0.25rem 0.25rem; border-radius: 50px;">
          <div id="userAvatar" style="width: 32px; height: 32px; border-radius: 50%; background: var(--brand-primary, #6366f1); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">
            ${initial}
          </div>
          <span id="userNameDisplay" style="font-weight: 500; font-size: 0.9rem; color: var(--text-primary, #1e293b);">${displayName}</span>
        </div>
        <button id="btnLogout" class="btn btn-secondary btn-sm" style="display: flex; align-items: center; gap: 0.25rem; cursor: pointer;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      `;

      const btnLogout = document.getElementById('btnLogout');
      if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
          const { error } = await sbClient.auth.signOut();
          if (error) {
            console.error('❌ Error signing out:', error.message);
            if (typeof window.showToast === 'function') {
              window.showToast('Logout failed: ' + error.message, 'error');
            }
          } else {
            localStorage.removeItem('tripcraft_user');
            if (typeof window.showToast === 'function') {
              window.showToast('Logged out successfully');
            }
          }
        });
      }

      if (typeof window.loadUserTrips === 'function') {
        window.loadUserTrips(session.user.id);
      }
    } else {
      authNavGroup.style.display = 'flex';
      userNavGroup.style.display = 'none';
      userNavGroup.innerHTML = '';
      window.currentUser = null;

      const tripSelect = document.getElementById('tripSelect');
      if (tripSelect) tripSelect.innerHTML = '<option value="">Select Trip</option>';
    }

    // Broadcast custom event for other modules (e.g., app.js) to react seamlessly
    window.dispatchEvent(new CustomEvent('auth:changed', { detail: { session, user: window.currentUser } }));
  }

  // --- Auth State Change Listener ---
  // Supabase v2 automatically fires 'INITIAL_SESSION' on load, so explicit call to getSession() is omitted to prevent redundant executions
  sbClient.auth.onAuthStateChange((event, session) => {
    console.log(`🔔 Auth event: [${event}]`);
    updateAuthUI(session);
  });

  // --- Handle Login Form Submission ---
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('loginEmail');
      const passwordInput = document.getElementById('loginPassword');

      if (!emailInput || !passwordInput) return;

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      try {
        const { error } = await sbClient.auth.signInWithPassword({ email, password });
        if (error) throw error;

        if (typeof window.showToast === 'function') {
          window.showToast('Login successful!');
        }
        closeModal(loginModal);
        loginForm.reset();
      } catch (err) {
        console.error('❌ Login error:', err.message);
        if (typeof window.showToast === 'function') {
          window.showToast('Login failed: ' + err.message, 'error');
        } else {
          alert('Login failed: ' + err.message);
        }
      }
    });
  }

  // --- Handle Register Form Submission ---
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('registerName');
      const emailInput = document.getElementById('registerEmail');
      const passwordInput = document.getElementById('registerPassword');

      if (!emailInput || !passwordInput) return;

      const fullName = nameInput ? nameInput.value.trim() : '';
      const email = emailInput.value.trim();
      const password = passwordInput.value;

      try {
        const { data, error } = await sbClient.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } }
        });

        if (error) throw error;

        const msg = data?.session 
          ? 'Registration successful! Welcome.' 
          : 'Registration successful! Please check your email to confirm your account.';

        if (typeof window.showToast === 'function') {
          window.showToast(msg);
        } else {
          alert(msg);
        }

        closeModal(registerModal);
        registerForm.reset();
      } catch (err) {
        console.error('❌ Registration error:', err.message);
        if (typeof window.showToast === 'function') {
          window.showToast('Registration failed: ' + err.message, 'error');
        } else {
          alert('Registration failed: ' + err.message);
        }
      }
    });
  }
});