'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/contexts/UserContext';
import { useUserNameValidation } from '@/app/hooks/useUserNameValidation';

type ResetFrequency = 'DAILY' | 'WEEKLY';
type DominantHand = 'LEFT' | 'RIGHT';

export function useSettingsPage() {
  const router = useRouter();
  const { effectiveUser, currentUser, isAdmin, updateEffectiveUser, logout, deleteAccount } = useUser();

  const userToEdit = effectiveUser;
  const isImpersonating = isAdmin && effectiveUser && currentUser && effectiveUser.id !== currentUser.id;

  const { validateName } = useUserNameValidation({ currentUserId: userToEdit?.id });

  const [name, setName] = useState(userToEdit?.name || '');
  const [resetFrequency, setResetFrequency] = useState<ResetFrequency>(
    (userToEdit?.resetFrequency as ResetFrequency) || 'DAILY'
  );
  const [dominantHand, setDominantHand] = useState<DominantHand>(
    (userToEdit?.dominantHand as DominantHand) || 'RIGHT'
  );
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [initialValues, setInitialValues] = useState<{
    name: string;
    resetFrequency: ResetFrequency;
    dominantHand: DominantHand;
  } | null>(null);

  // Fill the form once per user: keyed on the user object, every refetch (e.g. after
  // the persisted cache restores) reset what was being typed.
  const loadedForUserId = useRef<number | null>(null);
  useEffect(() => {
    if (userToEdit && loadedForUserId.current !== userToEdit.id) {
      loadedForUserId.current = userToEdit.id;
      const loadedName = userToEdit.name || '';
      const loadedResetFrequency = (userToEdit.resetFrequency as ResetFrequency) || 'DAILY';
      const loadedDominantHand = (userToEdit.dominantHand as DominantHand) || 'RIGHT';

      setName(loadedName);
      setResetFrequency(loadedResetFrequency);
      setDominantHand(loadedDominantHand);
      setInitialValues({
        name: loadedName,
        resetFrequency: loadedResetFrequency,
        dominantHand: loadedDominantHand,
      });
      setInitialLoading(false);
    }
  }, [userToEdit]);

  const hasUnsavedChanges = initialValues && (
    name !== initialValues.name ||
    resetFrequency !== initialValues.resetFrequency ||
    dominantHand !== initialValues.dominantHand
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) {
      setError('Utilisateur non défini');
      return;
    }
    const nameError = validateName(name);
    if (nameError) {
      setError(nameError);
      return;
    }
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const response = await fetch(`/api/users/${userToEdit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, resetFrequency, dominantHand }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour');
      }
      const updatedUser = await response.json();
      updateEffectiveUser(updatedUser);
      setInitialValues({
        name: updatedUser.name || '',
        resetFrequency: (updatedUser.resetFrequency as ResetFrequency) || 'DAILY',
        dominantHand: (updatedUser.dominantHand as DominantHand) || 'RIGHT',
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Erreur:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const shouldLeave = window.confirm('Vous avez des modifications non enregistrées. Êtes-vous sûr de vouloir quitter ?');
      if (shouldLeave) router.push('/');
    } else {
      router.push('/');
    }
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    const shouldLogout = window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?');
    if (!shouldLogout) return;
    setLoggingOut(true);
    try {
      await logout();
      router.push('/');
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
      setError('Erreur lors de la déconnexion');
      setLoggingOut(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;
    setChangingPassword(true);
    setPasswordError('');
    setPasswordSuccess(false);
    const validations: [boolean, string][] = [
      [!!currentPassword, 'Le mot de passe actuel est obligatoire'],
      [!!newPassword, 'Le nouveau mot de passe est obligatoire'],
      [newPassword.length >= 8, 'Le nouveau mot de passe doit contenir au moins 8 caractères'],
      [newPassword === confirmPassword, 'Les nouveaux mots de passe ne correspondent pas'],
      [currentPassword !== newPassword, 'Le nouveau mot de passe doit être différent de l\'ancien'],
    ];
    const fail = validations.find(([ok]) => !ok);
    if (fail) {
      setPasswordError(fail[1]);
      setChangingPassword(false);
      return;
    }
    try {
      const response = await fetch(`/api/users/${userToEdit.id}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la modification du mot de passe');
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePassword(false);
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      console.error('Erreur:', err);
      setPasswordError(err instanceof Error ? err.message : 'Erreur lors de la modification du mot de passe');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!userToEdit || isDeleting) return;
    const msg = '⚠️ Attention : Cette action est irréversible !\n\nToutes vos données seront définitivement supprimées (exercices, historique, progrès, journal).\n\nÊtes-vous absolument sûr de vouloir supprimer votre compte ?';
    if (!window.confirm(msg)) return;
    const confirmName = window.prompt(`Pour confirmer, veuillez taper votre nom exactement comme il apparaît : "${userToEdit.name}"`);
    if (confirmName !== userToEdit.name) {
      setError('Le nom ne correspond pas. Suppression annulée.');
      return;
    }
    setIsDeleting(true);
    setError('');
    try {
      await deleteAccount(userToEdit.id);
      router.push('/');
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression du compte');
      setIsDeleting(false);
    }
  };

  return {
    userToEdit,
    isImpersonating,
    initialLoading,
    name,
    setName,
    resetFrequency,
    setResetFrequency,
    dominantHand,
    setDominantHand,
    hasUnsavedChanges: !!hasUnsavedChanges,
    loading,
    error,
    success,
    handleSubmit,
    handleCancel,
    showChangePassword,
    setShowChangePassword,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showPasswords,
    setShowPasswords,
    changingPassword,
    passwordError,
    setPasswordError,
    passwordSuccess,
    handleChangePassword,
    handleLogout,
    handleDeleteAccount,
    loggingOut,
    isDeleting,
  };
}

