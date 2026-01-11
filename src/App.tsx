import { useState } from 'react';
import { Screen } from './types';
import UploadScreen from './components/UploadScreen';
import CleaningScreen from './components/CleaningScreen';
import VisualizationScreen from './components/VisualizationScreen';
import SummaryScreen from './components/SummaryScreen';
import { generateMockDataSummary, generateCleaningIssues, generateStatistics } from './utils/mockData';
import LoginScreen from './components/LoginScreen';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const dataSummary = generateMockDataSummary();
  const cleaningIssues = generateCleaningIssues(dataSummary);
  const statistics = generateStatistics();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleAnalyze = () => {
    setCurrentScreen('cleaning');
  };

  const handleClean = (type: 'auto' | 'missing' | 'invalid') => {
    console.log('Cleaning data with type:', type);
  };

  const handleExport = () => {
    console.log('Exporting cleaned data');
    const blob = new Blob(['Cleaned CSV data would be here'], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cleaned-data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStartNew = () => {
    setSelectedFile(null);
    setCurrentScreen('upload');
  };

  return (
    <>
      {currentScreen === 'upload' && (
        <UploadScreen
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
          onAnalyze={handleAnalyze}
        />
      )}
      {currentScreen === 'cleaning' && (
        <CleaningScreen
          dataSummary={dataSummary}
          cleaningIssues={cleaningIssues}
          onClean={handleClean}
          onNext={() => setCurrentScreen('visualization')}
        />
      )}
      {currentScreen === 'visualization' && (
        <VisualizationScreen
          statistics={statistics}
          onNext={() => setCurrentScreen('summary')}
        />
      )}
      {currentScreen === 'summary' && (
        <SummaryScreen
          rowsCleaned={78}
          columnsAffected={6}
          insightsGenerated={12}
          onExport={handleExport}
          onStartNew={handleStartNew}
        />
      )}
     {currentScreen === 'login' && (
  <LoginScreen onSuccess={() => setCurrentScreen('upload')} />
)} 
    </>
  );
}

export default App;
