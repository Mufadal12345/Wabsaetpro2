import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SettingsLayout } from '../components/SettingsLayout';
import { SettingsHome } from './SettingsHome';
import { AccountSettings } from './AccountSettings';
import { PrivacySettings } from './PrivacySettings';
import { AppearanceSettings } from './AppearanceSettings';
import { AccountSecurity } from './SecuritySettings';
import { SessionsSettings } from './SessionsSettings';
import { LanguageSettings } from './LanguageSettings';
import { AccessibilitySettings } from './AccessibilitySettings';
import { ActivitySettings } from './ActivitySettings';
import { NotificationSettings } from './NotificationSettings';
import { FollowersSettings } from './FollowersSettings';

export const SettingsRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<SettingsLayout />}>
        <Route index element={<SettingsHome />} />
        <Route path="account" element={<AccountSettings />} />
        <Route path="security" element={<AccountSecurity />} />
        <Route path="sessions" element={<SessionsSettings />} />
        <Route path="privacy" element={<PrivacySettings />} />
        <Route path="appearance" element={<AppearanceSettings />} />
        <Route path="language" element={<LanguageSettings />} />
        <Route path="accessibility" element={<AccessibilitySettings />} />
        <Route path="activity" element={<ActivitySettings />} />
        <Route path="notifications" element={<NotificationSettings />} />
        <Route path="followers" element={<FollowersSettings />} />
        <Route path="*" element={<Navigate to="/settings" />} />
      </Route>
    </Routes>
  );
};
