// src/components/DeleteAccount.jsx
// Add this component to your profile or settings page
// Usage: <DeleteAccount session={session} onDeleted={() => { /* sign out + redirect */ }} />

import { useState } from 'react';
import { supabase } from '../supabaseClient'; // adjust path to match your project

export default function DeleteAccount({ session, onDeleted }) {
  const [step, setStep] = useState('idle'); // idle | confirm | deleting | done
  const [error, setError] = useState(null);

  const handleRequestDelete = () => {
    setStep('confirm');
    setError(null);
  };

  const handleCancel = () => {
    setStep('idle');
    setError(null);
  };

  const handleConfirmDelete = async () => {
    setStep('deleting');
    setError(null);

    try {
      // Get the current session token
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (!currentSession?.access_token) {
        throw new Error('You must be signed in to delete your account.');
      }

      // Call the Vercel serverless endpoint
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSession.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account.');
      }

      // Sign out locally after successful deletion
      await supabase.auth.signOut();

      setStep('done');

      // Notify parent to redirect/reset UI
      if (onDeleted) {
        setTimeout(() => onDeleted(), 2000);
      }

    } catch (err) {
      console.error('Delete account error:', err);
      setError(err.message || 'Something went wrong. Please try again or contact support.');
      setStep('confirm');
    }
  };

  // ── Styles (inline to keep it self-contained, matching ScriptShift WA dark theme) ──

  const styles = {
    container: {
      marginTop: '2rem',
      padding: '1.5rem',
      borderRadius: '8px',
      border: '1px solid #3a1a1a',
      backgroundColor: '#1a0e0e',
    },
    heading: {
      color: '#e05555',
      fontSize: '1rem',
      fontWeight: '600',
      marginBottom: '0.5rem',
    },
    description: {
      color: '#aaa',
      fontSize: '0.875rem',
      marginBottom: '1rem',
      lineHeight: '1.5',
    },
    deleteButton: {
      backgroundColor: 'transparent',
      border: '1px solid #e05555',
      color: '#e05555',
      padding: '0.6rem 1.2rem',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: '500',
    },
    confirmBox: {
      backgroundColor: '#2a1010',
      border: '1px solid #e05555',
      borderRadius: '8px',
      padding: '1.25rem',
      marginTop: '0.5rem',
    },
    confirmText: {
      color: '#f5f5f5',
      fontSize: '0.9rem',
      marginBottom: '1rem',
      lineHeight: '1.6',
    },
    buttonRow: {
      display: 'flex',
      gap: '0.75rem',
    },
    cancelButton: {
      backgroundColor: '#2a2a2a',
      border: '1px solid #444',
      color: '#ccc',
      padding: '0.6rem 1.2rem',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '0.875rem',
    },
    confirmButton: {
      backgroundColor: '#e05555',
      border: 'none',
      color: '#fff',
      padding: '0.6rem 1.2rem',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: '600',
    },
    errorText: {
      color: '#e05555',
      fontSize: '0.8rem',
      marginTop: '0.75rem',
    },
    successBox: {
      color: '#4caf50',
      fontSize: '0.9rem',
      padding: '1rem',
      backgroundColor: '#0a1f0a',
      border: '1px solid #4caf50',
      borderRadius: '8px',
    },
    loadingText: {
      color: '#aaa',
      fontSize: '0.875rem',
    },
  };

  if (step === 'done') {
    return (
      <div style={styles.container}>
        <div style={styles.successBox}>
          ✓ Your account has been permanently deleted. You will be redirected shortly.
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>Delete Account</h3>
      <p style={styles.description}>
        Permanently delete your ScriptShift WA account and all associated data,
        including your profile, shift history, and applications. This action cannot be undone.
      </p>

      {step === 'idle' && (
        <button style={styles.deleteButton} onClick={handleRequestDelete}>
          Delete My Account
        </button>
      )}

      {step === 'confirm' && (
        <div style={styles.confirmBox}>
          <p style={styles.confirmText}>
            Are you sure you want to permanently delete your account?
            <br />
            <strong style={{ color: '#e05555' }}>
              This will remove your profile, all shift listings, and all applications.
              This cannot be undone.
            </strong>
          </p>
          <div style={styles.buttonRow}>
            <button style={styles.cancelButton} onClick={handleCancel}>
              Cancel
            </button>
            <button style={styles.confirmButton} onClick={handleConfirmDelete}>
              Yes, Delete My Account
            </button>
          </div>
          {error && <p style={styles.errorText}>⚠ {error}</p>}
        </div>
      )}

      {step === 'deleting' && (
        <p style={styles.loadingText}>⏳ Deleting your account... please wait.</p>
      )}
    </div>
  );
}
