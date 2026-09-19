/**
 * auth.js - Manages Supabase Authentication, Session State, and Header UI integration.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const sbClient = window.supabaseClient || window.supabase;
  if (typeof sbClient === 'undefined' || !sbClient) {
    console.error('❌ Supabase client is not initialized.');
    return;
  }

  // DOM Elements
  const loginModal = document.getElementById('loginModal');
  const registerModal = document.getElementById('registerModal');
  const newTripModal = document.getElementById('newTripModal');

  const btnLoginModal = document.getElementById('btnLoginModal');
  const btnRegisterModal = document.getElementById('btnRegisterModal');
  const btnNewTrip = document.getElementById('btnNewTrip');
  
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  // --- Modal Utilities ---
  function openModal(modal) {
    if (modal) {
      modal.style.cssText = 'display: flex !important; opacity: 1 !important; visibility: visible !important; pointer-events: auto !important;';
      modal.classList.add('active', 'show');
    }
  }

  function closeModal(modal) {
    if (modal) {
      modal.classList.remove('active', 'show');
      modal.style.cssText = 'display: none !important; opacity: 0 !important; visibility: hidden !important; pointer-events: none !important;';
    }
  }

  if (btnLoginModal) btnLoginModal.addEventListener('click', () => openModal(loginModal));
  if (btnRegisterModal) btnRegisterModal.addEventListener('click', () => openModal(registerModal));
  if (btnNewTrip) btnNewTrip.addEventListener('click', () => openModal(newTripModal));

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
    let authNavGroup = document.getElementById('authNavGroup');
    let userNavGroup = document.getElementById('userNavGroup');

    if (!authNavGroup || !userNavGroup) return;

    if (session && session.user) {
      authNavGroup.style.display = 'none';
      userNavGroup.style.display = 'flex';

      const userEmail = session.user.email;
      const displayName = session.user.user_metadata?.full_name || userEmail.split('@')[0];
      const initial = displayName.charAt(0).toUpperCase();

      window.currentUser = {
        id: session.user.id,
        email: userEmail,
        name: displayName
      };

      userNavGroup.innerHTML = `
        <div class="user-profile-badge" style="display: flex; align-items: center; gap: 0.5rem; background: var(--bg-secondary, rgba(150,150,150,0.1)); padding: 0.25rem 0.75rem 0.25rem 0.25rem; border-radius: 50px;">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary, #007bff); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">
            ${initial}
          </div>
          <span style="font-weight: 500; font-size: 0.9rem; color: var(--text-primary);">${displayName}</span>
        </div>
        <button id="btnLogout" class="btn btn-secondary" style="display: flex; align-items: center; gap: 0.25rem;">
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
          await sbClient.auth.signOut();
          window.currentUser = null;
          if (typeof window.showToast === 'function') window.showToast('Logged out successfully');
          setTimeout(() => window.location.reload(), 500);
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
    }
  }

  // Initial Session Check
  try {
    const { data: { session } } = await sbClient.auth.getSession();
    updateAuthUI(session);
  } catch (err) {
    console.error('Session error:', err.message);
  }

  // Listen for Auth changes
  sbClient.auth.onAuthStateChange((event, session) => {
    updateAuthUI(session);
  });

  // Login Form
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      try {
        const { error } = await sbClient.auth.signInWithPassword({ email, password });
        if (error) throw error;

        if (typeof window.showToast === 'function') window.showToast('Login successful!');
        closeModal(loginModal);
        loginForm.reset();
      } catch (err) {
        if (typeof window.showToast === 'function') window.showToast('Login failed: ' + err.message);
      }
    });
  }

  // Register Form
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = document.getElementById('registerName').value.trim();
      const email = document.getElementById('registerEmail').value.trim();
      const password = document.getElementById('registerPassword').value;

      try {
        const { error } = await sbClient.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } }
        });
        if (error) throw error;

        if (typeof window.showToast === 'function') window.showToast('Registration successful!');
        closeModal(registerModal);
        registerForm.reset();
      } catch (err) {
        if (typeof window.showToast === 'function') window.showToast('Registration failed: ' + err.message);
      }
    });
  }
});