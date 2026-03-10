/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Upload } from './pages/Upload';
import { Editor } from './pages/Editor';
import { Templates } from './pages/Templates';
import { Export } from './pages/Export';
import { Billing } from './pages/Billing';
import { Blueprint } from './pages/Blueprint';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="upload" element={<Upload />} />
          <Route path="editor" element={<Editor />} />
          <Route path="templates" element={<Templates />} />
          <Route path="export" element={<Export />} />
          <Route path="billing" element={<Billing />} />
          <Route path="settings" element={<Settings />} />
          <Route path="blueprint" element={<Blueprint />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
