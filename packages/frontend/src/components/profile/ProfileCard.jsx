/**
 * ProfileCard Component
 * Individual profile card with selection state
 */

export function ProfileCard({ profile, isSelected, onSelect }) {
  const styles = {
    card: {
      padding: '24px',
      borderRadius: '16px',
      backgroundColor: isSelected ? '#E3F2FD' : '#fff',
      border: `3px solid ${isSelected ? '#2196F3' : '#E0E0E0'}`,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      textAlign: 'center',
      boxShadow: isSelected ? '0 4px 12px rgba(33, 150, 243, 0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
      outline: 'none', // Remove default outline, we'll handle it with box-shadow
    },
    icon: {
      fontSize: '64px',
      marginBottom: '16px',
    },
    name: {
      margin: '0 0 8px 0',
      fontSize: '20px',
      fontWeight: 'bold',
      color: isSelected ? '#1976D2' : '#333',
    },
    details: {
      margin: 0,
      fontSize: '16px',
      color: '#666',
    },
    badge: {
      marginTop: '12px',
      padding: '6px 12px',
      borderRadius: '12px',
      backgroundColor: isSelected ? '#2196F3' : '#BDBDBD',
      color: 'white',
      fontSize: '12px',
      fontWeight: 'bold',
      display: 'inline-block',
    },
  };

  const getIcon = () => {
    if (profile.gender === 'girl') return '👧';
    return '👦';
  };

  const handleKeyDown = (e) => {
    // Handle Enter and Space keys for keyboard accessibility
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); // Prevent page scroll on Space
      onSelect(profile.id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`Select profile: ${profile.displayName}, age ${profile.age}, ${profile.gender}${isSelected ? ', currently selected' : ''}`}
      style={styles.card}
      onClick={() => onSelect(profile.id)}
      onKeyDown={handleKeyDown}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
      onFocus={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = '0 0 0 4px rgba(33, 150, 243, 0.5)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = isSelected
          ? '0 4px 12px rgba(33, 150, 243, 0.3)'
          : '0 2px 8px rgba(0,0,0,0.1)';
      }}
    >
      <div style={styles.icon}>{getIcon()}</div>
      <h3 style={styles.name}>{profile.displayName}</h3>
      <p style={styles.details}>
        Age {profile.age} • {profile.gender}
      </p>
      <div style={styles.badge}>
        {isSelected ? '✓ Selected' : 'Select'}
      </div>
    </div>
  );
}
