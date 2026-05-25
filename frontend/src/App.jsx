import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RoleProvider } from './context/RoleContext';
import { CreditProvider } from './context/CreditContext';
import { CaseProvider } from './context/CaseContext';
import { EvidenceProvider } from './context/EvidenceContext';
import { ActivityProvider } from './context/ActivityContext';
import { HistoryProvider } from './context/HistoryContext';
import { SettingsProvider } from './context/SettingsContext';
import { ThemeProvider } from './context/ThemeContext';
import { SearchHistoryProvider } from './context/SearchHistoryContext';
import { SessionProvider } from './context/SessionContext';
import { ToastProvider } from './components/common/Toast';
import SessionTimeoutWarning from './components/common/SessionTimeoutWarning';
import ErrorBoundary from './components/common/ErrorBoundary';
import DebugPanel from './components/common/DebugPanel';
import AppRoutes from './pages/auth/routes/AppRoutes';

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ThemeProvider>
          <SettingsProvider>
            <ToastProvider>
              <AuthProvider>
                <SessionProvider>
                  <RoleProvider>
                    <CreditProvider>
                      <SearchHistoryProvider>
                        <HistoryProvider>
                          <CaseProvider>
                            <EvidenceProvider>
                              <ActivityProvider>
                                <div className="min-h-screen bg-gray-950 dark:bg-gray-950 light:bg-gray-50 transition-colors">
                                  <AppRoutes />
                                  <SessionTimeoutWarning />
                                  <DebugPanel />
                                </div>
                              </ActivityProvider>
                            </EvidenceProvider>
                          </CaseProvider>
                        </HistoryProvider>
                      </SearchHistoryProvider>
                    </CreditProvider>
                  </RoleProvider>
                </SessionProvider>
              </AuthProvider>
            </ToastProvider>
          </SettingsProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
