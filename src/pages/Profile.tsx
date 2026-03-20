import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export const Profile = () => {
  const { user, updateUser } = useAuth();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleAvatarUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!avatarFile) {
      setError('Please choose an image first');
      return;
    }

    setAvatarLoading(true);
    setMessage('');
    setError('');

    try {
      const updatedUser = await authService.updateAvatar(avatarFile);
      updateUser(updatedUser);
      setAvatarFile(null);
      setMessage('Avatar updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update avatar');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const updatedUser = await authService.updateProfile(profileData);
      updateUser(updatedUser);
      setMessage('Profile updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setMessage('');
    setError('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      setPasswordLoading(false);
      return;
    }

    try {
      await authService.changePassword(passwordData.oldPassword, passwordData.newPassword);
      setMessage('Password changed successfully');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account settings</p>
        </div>

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Photo</h2>

              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-24 w-24 rounded-full object-cover border border-gray-200 mb-4"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-2xl font-semibold mb-4">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}

              <form onSubmit={handleAvatarUpload} className="space-y-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                />
                <Button type="submit" isLoading={avatarLoading} disabled={!avatarFile}>
                  Upload Avatar
                </Button>
              </form>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Information</h2>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
                  <p className="text-sm">
                    <strong>Role:</strong> {user?.role === 'student' ? 'Student' : 'Instructor'}
                  </p>
                </div>

                <Input
                  label="Full Name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  required
                />

                <Input
                  label="Email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  required
                />

                <Button type="submit" isLoading={loading}>
                  Update Profile
                </Button>
              </form>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Change Password</h2>
              <form onSubmit={handleChangePassword} className="space-y-6">
                <Input
                  label="Current Password"
                  type="password"
                  value={passwordData.oldPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, oldPassword: e.target.value })
                  }
                  required
                />

                <Input
                  label="New Password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  required
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  required
                />

                <Button type="submit" isLoading={passwordLoading}>
                  Change Password
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
