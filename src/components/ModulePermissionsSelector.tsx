import React from 'react';
import {
  MODULE_PERMISSIONS_LIST,
  DEFAULT_ROLE_PERMISSIONS,
  ALL_ADMIN_MODULES,
} from '../utils/adminPermissions';
import { AdminModulePermission } from '../types';
import { Check, Shield, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';

interface ModulePermissionsSelectorProps {
  selectedPermissions: AdminModulePermission[];
  onChange: (permissions: AdminModulePermission[]) => void;
  selectedRole?: string;
  onRoleChange?: (role: string) => void;
  isSuperAdminAccount?: boolean;
}

export const ModulePermissionsSelector: React.FC<ModulePermissionsSelectorProps> = ({
  selectedPermissions,
  onChange,
  selectedRole,
  onRoleChange,
  isSuperAdminAccount = false,
}) => {
  const handleToggle = (moduleId: AdminModulePermission) => {
    if (isSuperAdminAccount) return;
    if (selectedPermissions.includes(moduleId)) {
      onChange(selectedPermissions.filter((id) => id !== moduleId));
    } else {
      onChange([...selectedPermissions, moduleId]);
    }
  };

  const handleApplyPreset = (presetRole: string) => {
    if (onRoleChange) {
      onRoleChange(presetRole);
    }
    const defaultPerms = DEFAULT_ROLE_PERMISSIONS[presetRole] || ['examination_scores'];
    onChange([...defaultPerms]);
  };

  const handleSelectAll = () => {
    onChange([...ALL_ADMIN_MODULES]);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const totalSelected = selectedPermissions.length;
  const isAllSelected = totalSelected === ALL_ADMIN_MODULES.length;

  return (
    <div className="space-y-3.5 bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#1E3A8A]" />
            <span className="text-xs font-black text-[#0F172A] uppercase tracking-wider font-['Plus_Jakarta_Sans']">
              Assigned Module Permissions & Role Privileges
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Select which administrative sections this staff member is authorized to access and manage.
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
              isAllSelected
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : totalSelected > 0
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>
              {totalSelected} of {ALL_ADMIN_MODULES.length} Modules Active
            </span>
          </span>
        </div>
      </div>

      {/* Quick Preset Buttons */}
      {!isSuperAdminAccount && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#F59E0B]" />
              Quick Role Presets:
            </span>
            <div className="flex items-center gap-2 text-[10px] font-bold">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[#1E3A8A] hover:underline cursor-pointer"
              >
                Select All
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-slate-500 hover:text-red-600 hover:underline cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleApplyPreset('Teacher / Exam Officer')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                selectedRole === 'Teacher / Exam Officer' &&
                selectedPermissions.includes('examination_scores') &&
                selectedPermissions.includes('analytics_reports')
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
              }`}
            >
              Exam Officer Preset
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset('Class Teacher')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                selectedRole === 'Class Teacher' &&
                selectedPermissions.includes('academic_structure') &&
                selectedPermissions.includes('examination_scores')
                  ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
              }`}
            >
              Class Teacher Preset
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset('Academic Administrator')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                selectedRole === 'Academic Administrator' &&
                selectedPermissions.includes('academic_structure') &&
                selectedPermissions.includes('examination_scores') &&
                selectedPermissions.includes('analytics_reports')
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50'
              }`}
            >
              Academic Admin Preset
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset('System Super Administrator')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                isAllSelected
                  ? 'bg-[#1E3A8A] text-[#F59E0B] border-blue-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50/50'
              }`}
            >
              Full Access (All 6)
            </button>
          </div>
        </div>
      )}

      {/* Module Permission Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {MODULE_PERMISSIONS_LIST.map((module) => {
          const isSelected = selectedPermissions.includes(module.id);
          const Icon = module.icon;

          return (
            <div
              key={module.id}
              onClick={() => handleToggle(module.id)}
              className={`p-3 rounded-xl border text-left transition-all relative select-none cursor-pointer flex flex-col justify-between gap-2 ${
                isSelected
                  ? 'bg-white border-[#1E3A8A] shadow-xs ring-1 ring-[#1E3A8A]/30'
                  : 'bg-slate-100/60 border-slate-200 opacity-75 hover:opacity-100 hover:bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                      isSelected
                        ? `${module.badgeBg} ${module.badgeBorder} ${module.badgeText}`
                        : 'bg-slate-200 text-slate-500 border-slate-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[#0F172A] leading-tight">
                      {module.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {module.category}
                    </span>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                    isSelected
                      ? 'bg-[#1E3A8A] border-[#1E3A8A] text-white shadow-2xs'
                      : 'border-slate-300 bg-white text-transparent'
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              </div>

              <p className="text-[10.5px] text-slate-500 leading-relaxed font-normal">
                {module.description}
              </p>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                <span className="text-slate-400 font-mono">
                  {module.tabIds.length} Section{module.tabIds.length > 1 ? 's' : ''} Included
                </span>
                <span
                  className={`font-bold ${
                    isSelected ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  {isSelected ? 'Access Granted' : 'Restricted'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {totalSelected === 0 && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Warning:</strong> No module permissions selected. This user will only be able to view their account dashboard overview.
          </span>
        </div>
      )}
    </div>
  );
};
