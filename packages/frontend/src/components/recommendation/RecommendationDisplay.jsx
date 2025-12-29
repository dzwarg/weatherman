/**
 * RecommendationDisplay Component
 * Displays clothing recommendations with categories
 */

export function RecommendationDisplay({ recommendation }) {
  if (!recommendation) {
    return null;
  }

  const { recommendations, spokenResponse, weatherData, confidence } = recommendation;

  const styles = {
    container: {
      padding: '24px',
      borderRadius: '16px',
      backgroundColor: '#fff',
      border: '2px solid #4A90E2',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
    header: {
      marginBottom: '24px',
      paddingBottom: '16px',
      borderBottom: '2px solid #E0E0E0',
    },
    title: {
      margin: '0 0 12px 0',
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#333',
    },
    weather: {
      display: 'flex',
      gap: '20px',
      flexWrap: 'wrap',
      margin: '0',
      fontSize: '16px',
      color: '#666',
    },
    weatherItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    categories: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
      marginBottom: '24px',
    },
    category: {
      padding: '16px',
      borderRadius: '12px',
      backgroundColor: '#F5F5F5',
      border: '1px solid #E0E0E0',
    },
    categoryTitle: {
      margin: '0 0 12px 0',
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#2196F3',
    },
    itemList: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
    },
    item: {
      padding: '8px 0',
      fontSize: '16px',
      color: '#333',
      borderBottom: '1px solid #E0E0E0',
    },
    lastItem: {
      borderBottom: 'none',
    },
    notes: {
      marginTop: '20px',
      padding: '16px',
      borderRadius: '12px',
      backgroundColor: '#FFF9C4',
      border: '2px solid #FDD835',
    },
    notesTitle: {
      margin: '0 0 8px 0',
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#F57F17',
    },
    notesList: {
      margin: 0,
      paddingLeft: '20px',
      color: '#666',
    },
    spoken: {
      marginTop: '20px',
      padding: '16px',
      borderRadius: '12px',
      backgroundColor: '#E3F2FD',
      border: '1px solid #2196F3',
    },
    spokenTitle: {
      margin: '0 0 8px 0',
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#1976D2',
      textTransform: 'uppercase',
    },
    spokenText: {
      margin: 0,
      fontSize: '15px',
      lineHeight: 1.6,
      color: '#666',
      fontStyle: 'italic',
    },
    confidence: {
      marginTop: '12px',
      fontSize: '14px',
      color: confidence > 0.8 ? '#4CAF50' : confidence > 0.6 ? '#FF9800' : '#F44336',
      fontWeight: 'bold',
    },
  };

  const categoryIcons = {
    outerwear: '🧥',
    baseLayers: '👕',
    accessories: '🧤',
    footwear: '👟',
  };

  const renderCategory = (title, items, key) => {
    if (!items || items.length === 0) return null;

    return (
      <div key={key} style={styles.category}>
        <h3 style={styles.categoryTitle}>
          {categoryIcons[key]} {title}
        </h3>
        <ul style={styles.itemList}>
          {items.map((item, index) => {
            // Handle both string format (local fallback) and object format (server response)
            const itemText = typeof item === 'string' ? item : item.item;
            const itemReason = typeof item === 'object' && item.reason ? item.reason : null;

            return (
              <li
                key={index}
                style={{
                  ...styles.item,
                  ...(index === items.length - 1 ? styles.lastItem : {}),
                }}
              >
                <div style={{ fontWeight: '500' }}>{itemText}</div>
                {itemReason && (
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                    {itemReason}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Your Clothing Recommendation</h2>
        <div style={styles.weather}>
          <div style={styles.weatherItem}>
            🌡️ {weatherData.temperature}°F
            {weatherData.feelsLike !== weatherData.temperature &&
              ` (feels like ${weatherData.feelsLike}°F)`}
          </div>
          <div style={styles.weatherItem}>
            ☁️ {weatherData.conditions}
          </div>
          {weatherData.precipitationProbability > 0 && (
            <div style={styles.weatherItem}>
              🌧️ {weatherData.precipitationProbability}% chance of rain
            </div>
          )}
          {weatherData.windSpeed > 10 && (
            <div style={styles.weatherItem}>
              💨 {weatherData.windSpeed} mph wind
            </div>
          )}
        </div>
      </div>

      <div style={styles.categories}>
        {renderCategory('Outerwear', recommendations.outerwear, 'outerwear')}
        {renderCategory('Base Layers', recommendations.baseLayers, 'baseLayers')}
        {renderCategory('Accessories', recommendations.accessories, 'accessories')}
        {renderCategory('Footwear', recommendations.footwear, 'footwear')}
      </div>

      {recommendations.specialNotes && recommendations.specialNotes.length > 0 && (
        <div style={styles.notes}>
          <h3 style={styles.notesTitle}>💡 Important Notes</h3>
          <ul style={styles.notesList}>
            {recommendations.specialNotes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={styles.spoken}>
        <h4 style={styles.spokenTitle}>🗣️ What I would say:</h4>
        <p style={styles.spokenText}>&quot;{spokenResponse}&quot;</p>
        <div style={styles.confidence}>
          Confidence: {Math.round(confidence * 100)}%
        </div>
      </div>
    </div>
  );
}
