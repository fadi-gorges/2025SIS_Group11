import NotificationSettings from '@/app/(authenticated)/settings/_components/notification-settings'
import PreferencesSettings from '@/app/(authenticated)/settings/_components/preferences-settings'
import ProfileSettings from '@/app/(authenticated)/settings/_components/profile-settings'
import SecuritySettings from '@/app/(authenticated)/settings/_components/security-settings'
import Heading from '@/components/page/heading'
import SidebarPage from '@/components/sidebar/sidebar-page'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getPreloadedUser } from '../../../../convex/serverUtils'

const SettingsPage = async () => {
  const preloadedUser = await getPreloadedUser()

  return (
    <SidebarPage>
      <div className="space-y-6">
        <Heading title="Settings" description="Manage your account and preferences." />
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="space-y-4">
            <ProfileSettings preloadedUser={preloadedUser} />
          </TabsContent>
          <TabsContent value="notifications" className="space-y-4">
            <NotificationSettings />
          </TabsContent>
          <TabsContent value="preferences" className="space-y-4">
            <PreferencesSettings />
          </TabsContent>
          <TabsContent value="security" className="space-y-4">
            <SecuritySettings />
          </TabsContent>
        </Tabs>
      </div>
    </SidebarPage>
  )
}

export default SettingsPage
