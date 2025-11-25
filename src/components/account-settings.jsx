import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import React, { useEffect, useState } from 'react'
import { fetchUserProfile, updateUserProfile, changeUserPassword } from '@/lib/api'

export function AccountSettings() {
  const [fullname, setFullname] = useState('')
  const [username, setUsername] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    (async () => {
      try {
        const profile = await fetchUserProfile(token)
        setFullname(profile.fullname || profile.name || '')
        setUsername(profile.username || '')
      } catch (err) {
        console.error('Failed to load profile', err)
      }
    })()
  }, [])

  const onSaveProfile = async () => {
    const token = localStorage.getItem('token')
    if (!token) return setMessage('Please sign in')
    setLoading(true)
    try {
      const resp = await updateUserProfile(token, { fullname, username })
      setMessage('Profile updated')
    } catch (err) {
      setMessage(err.message || 'Update failed')
    } finally { setLoading(false) }
  }

  const onChangePassword = async () => {
    if (newPassword !== confirmPassword) return setMessage('New passwords do not match')
    const token = localStorage.getItem('token')
    if (!token) return setMessage('Please sign in')
    setLoading(true)
    try {
      await changeUserPassword(token, currentPassword, newPassword)
      setMessage('Password changed')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setMessage(err.message || 'Password change failed')
    } finally { setLoading(false) }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
        <CardDescription>Update your account information and email preferences.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={fullname} onChange={e => setFullname(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={username} onChange={e => setUsername(e.target.value)} />
          </div>
        </div>
        <Separator />
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input id="current-password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </div>
        </div>
        {message && <div style={{ color: 'red' }}>{message}</div>}
      </CardContent>
      <CardFooter>
        <div style={{ display: 'flex', gap: 8, width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={onSaveProfile} disabled={loading}>Save Changes</Button>
          <Button onClick={onChangePassword} disabled={loading}>Change Password</Button>
        </div>
      </CardFooter>
    </Card>
  );
}

