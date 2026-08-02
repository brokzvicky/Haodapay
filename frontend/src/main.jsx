import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';

// Order matters: customized Bootstrap first, then design tokens (so token
// values can be referenced by anything after), then global resets/utilities.
import './design-system/styles/custom.scss';
import './design-system/styles/tokens.css';
import './design-system/styles/global.css';
import './components/ui/components.css';

import { queryClient } from './api/queryClient';
import { AuthProvider } from './auth/AuthContext';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
