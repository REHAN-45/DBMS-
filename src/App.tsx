import React, { useState, useEffect } from 'react';
import { Sidebar, ScreenId } from './components/Sidebar';
import { Header } from './components/Header';
import { SqlLogModal } from './components/SqlLogModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ToastProvider, useToast } from './components/Toast';
import { sqliteService } from './db/sqlite';

// Screens
import { DashboardScreen } from './screens/DashboardScreen';
import { StudentsScreen } from './screens/StudentsScreen';
import { CompaniesJobsScreen } from './screens/CompaniesJobsScreen';
import { ApplicationsScreen } from './screens/ApplicationsScreen';
import { AutoShortlistScreen } from './screens/AutoShortlistScreen';
import { AddRecordScreen } from './screens/AddRecordScreen';
import { UpdateRecordScreen } from './screens/UpdateRecordScreen';
import { DeleteRecordScreen } from './screens/DeleteRecordScreen';
import { SearchScreen } from './screens/SearchScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { SqlConsoleScreen } from './screens/SqlConsoleScreen';
import { QueryShowcaseScreen } from './screens/QueryShowcaseScreen';
import { NormalizationScreen } from './screens/NormalizationScreen';
import { SchemaDdlScreen } from './screens/SchemaDdlScreen';
import { Database, Loader2 } from 'lucide-react';

function AppContent() {
  const toast = useToast();
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('dashboard');
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSqlLogOpen, setIsSqlLogOpen] = useState<boolean>(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [isDbReady, setIsDbReady] = useState<boolean>(false);
  const [dbInitError, setDbInitError] = useState<string | null>(null);

  // Screen-specific navigation context
  const [shortlistJobId, setShortlistJobId] = useState<number | undefined>(undefined);
  const [editEntityInfo, setEditEntityInfo] = useState<{ entity?: any; id?: number }>({});
  const [deleteEntityInfo, setDeleteEntityInfo] = useState<{ entity?: any; id?: number }>({});

  // Initialize SQLite database
  useEffect(() => {
    let mounted = true;
    sqliteService
      .getDb()
      .then(() => {
        if (mounted) setIsDbReady(true);
      })
      .catch((err) => {
        if (mounted) {
          console.error('Failed to initialize SQLite WASM:', err);
          setDbInitError(String(err?.message || err));
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Theme synchronization
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const handleNavigate = (screen: ScreenId, extra?: any) => {
    if (screen === 'auto_shortlist' && extra?.jobId) {
      setShortlistJobId(extra.jobId);
    }
    if (screen === 'update_record' && extra) {
      setEditEntityInfo(extra);
    }
    if (screen === 'delete_record' && extra) {
      setDeleteEntityInfo(extra);
    }
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetDatabase = async () => {
    setIsResetModalOpen(false);
    try {
      await sqliteService.resetDatabase();
      toast.success(
        'Database Reset Complete!',
        'All 6 tables re-created with constraints and fresh Indian college placement data seeded.'
      );
      setCurrentScreen('dashboard');
    } catch (err: any) {
      toast.error('Reset Failed', String(err?.message || err));
    }
  };

  if (dbInitError) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-950 p-6 rounded-2xl border border-rose-800 text-center shadow-2xl">
          <Database className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-rose-400">SQLite WASM Engine Failed to Load</h2>
          <p className="text-xs text-slate-400 mt-2">{dbInitError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-5 px-4 py-2 bg-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
          >
            Retry Loading Database
          </button>
        </div>
      </div>
    );
  }

  if (!isDbReady) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-500/30 animate-pulse">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Starting SQLite WASM Engine...</h2>
            <p className="text-xs text-slate-400 mt-1">
              Mounting in-memory relational database & compiling 3NF schema tables
            </p>
          </div>
          <Loader2 className="w-5 h-5 text-indigo-400 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col antialiased selection:bg-indigo-600 selection:text-white transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar
        currentScreen={currentScreen}
        onSelectScreen={(screen) => handleNavigate(screen)}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-72 flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <Header
          currentScreen={currentScreen}
          onOpenMobileSidebar={() => setIsMobileMenuOpen(true)}
          onOpenSqlLog={() => setIsSqlLogOpen(true)}
          onResetDbClick={() => setIsResetModalOpen(true)}
        />

        {/* Dynamic Screen View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentScreen === 'dashboard' && <DashboardScreen onNavigate={handleNavigate} />}
          {currentScreen === 'students' && <StudentsScreen onNavigate={handleNavigate} />}
          {currentScreen === 'companies_jobs' && (
            <CompaniesJobsScreen
              onNavigate={handleNavigate}
              onSelectJobForShortlist={(jobId) => setShortlistJobId(jobId)}
            />
          )}
          {currentScreen === 'applications' && <ApplicationsScreen onNavigate={handleNavigate} />}
          {currentScreen === 'auto_shortlist' && (
            <AutoShortlistScreen initialJobId={shortlistJobId} />
          )}
          {currentScreen === 'add_record' && <AddRecordScreen />}
          {currentScreen === 'update_record' && (
            <UpdateRecordScreen
              initialEntity={editEntityInfo.entity}
              initialId={editEntityInfo.id}
            />
          )}
          {currentScreen === 'delete_record' && (
            <DeleteRecordScreen
              initialEntity={deleteEntityInfo.entity}
              initialId={deleteEntityInfo.id}
            />
          )}
          {currentScreen === 'search' && <SearchScreen />}
          {currentScreen === 'reports' && <ReportsScreen />}
          {currentScreen === 'sql_console' && <SqlConsoleScreen />}
          {currentScreen === 'query_showcase' && <QueryShowcaseScreen />}
          {currentScreen === 'normalization' && <NormalizationScreen />}
          {currentScreen === 'schema_ddl' && <SchemaDdlScreen />}
        </main>
      </div>

      {/* Real-Time SQL Log Modal */}
      <SqlLogModal isOpen={isSqlLogOpen} onClose={() => setIsSqlLogOpen(false)} />

      {/* Reset Database Confirmation Modal */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        title="Reset Entire Relational Database?"
        message="This will drop all tables (Departments, Students, Companies, Jobs, Applications, Offers) and re-seed clean, realistic Indian college placement drive records. Any custom changes you made will be re-initialized."
        confirmLabel="Yes, Reset Database"
        cancelLabel="Cancel"
        variant="danger"
        details="Actions: DROP TABLE IF EXISTS Offers, Applications, Jobs, Companies, Students, Departments; followed by full schema.sql and seed_data.sql execution."
        onConfirm={handleResetDatabase}
        onCancel={() => setIsResetModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
