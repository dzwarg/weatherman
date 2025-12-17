/**
 * ProfileSelector Component
 * Grid of profile cards for selection
 */

import { ProfileCard } from './ProfileCard.jsx';

export function ProfileSelector({ profiles, activeProfile, onSelectProfile }) {
  const styles = {
    container: {
      marginBottom: '32px',
    },
    title: {
      margin: '0 0 20px 0',
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#333',
      textAlign: 'center',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Who is asking?</h2>
      <div style={styles.grid}>
        {profiles.map((profile) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            isSelected={activeProfile?.id === profile.id}
            onSelect={onSelectProfile}
          />
        ))}
      </div>
    </div>
  );
}
