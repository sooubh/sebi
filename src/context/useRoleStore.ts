import { create } from 'zustand';

export type UserRole = 'Compliance Officer' | 'IT Admin' | 'Operations';

interface RoleState {
  role: UserRole;
  setRole: (role: UserRole) => void;
  hasPermission: (permission: string) => boolean;
}

// Simple role permission mapping
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  'Compliance Officer': [
    'view_dashboard',
    'view_circulars',
    'upload_circular',
    'run_analysis',
    'view_gap_analysis',
    'edit_gap_analysis',
    'view_tasks',
    'create_task',
    'edit_task',
    'upload_evidence',
    'approve_evidence',
  ],
  'IT Admin': [
    'view_dashboard',
    'view_circulars',
    'view_gap_analysis',
    'view_tasks',
    'edit_task',
    'upload_evidence',
    // IT Admin has limited compliance scope but can edit/view tech tasks
  ],
  'Operations': [
    'view_dashboard',
    'view_circulars',
    'view_gap_analysis',
    'view_tasks',
    'upload_evidence',
    'complete_task',
    // Operations completes tasks and uploads evidence but doesn't change policies
  ],
};

export const useRoleStore = create<RoleState>((set, get) => ({
  role: 'Compliance Officer',
  setRole: (role) => set({ role }),
  hasPermission: (permission) => {
    const currentRole = get().role;
    return ROLE_PERMISSIONS[currentRole]?.includes(permission) || false;
  },
}));
