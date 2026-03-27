import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import posthog from 'posthog-js';
import { PostHogProvider } from '@posthog/react';

const options = {
  api_host: `${window.location.origin}/ingest`,
  ui_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
  person_profiles: 'identified_only',
} as const;

// Suppress TensorFlow Lite XNNPACK delegate info log
const suppressTensorFlowLogs = (...args: any[]) => {
  if (typeof args[0] === 'string' && args[0].includes('TensorFlow Lite XNNPACK delegate')) {
    return;
  }
};

const originalInfo = console.info;
console.info = (...args) => {
  suppressTensorFlowLogs(...args);
  originalInfo(...args);
};

const originalLog = console.log;
console.log = (...args) => {
  suppressTensorFlowLogs(...args);
  originalLog(...args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PostHogProvider apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY} options={options}>
      <App />
    </PostHogProvider>
  </StrictMode>,
);
