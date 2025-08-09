'use client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { Preloaded, useMutation, usePreloadedQuery } from 'convex/react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { api } from '../../../../../convex/_generated/api'
import {
  ProfileFormData,
  profileFormSchema,
  ReminderFormData,
  reminderFormSchema,
} from '../../../../../convex/validation'

const reminderOptions = [
  { value: 'one_week' as const, label: 'One week before' },
  { value: 'one_day' as const, label: 'One day before' },
  { value: 'on_the_day' as const, label: 'On the day' },
]

type ProfileSettingsProps = {
  preloadedUser: Preloaded<typeof api.users.getCurrentUser>
}

const ProfileSettings = ({ preloadedUser }: ProfileSettingsProps) => {
  const user = usePreloadedQuery(preloadedUser)
  const updateUser = useMutation(api.users.updateUser)

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      givenName: '',
      familyName: '',
    },
  })

  const reminderForm = useForm<ReminderFormData>({
    resolver: zodResolver(reminderFormSchema),
    defaultValues: {
      reminderSchedule: [],
    },
  })

  useEffect(() => {
    if (user) {
      profileForm.reset({
        givenName: user.givenName || '',
        familyName: user.familyName || '',
      })
      const userReminders = user.reminderSchedule || []
      reminderForm.reset({
        reminderSchedule: userReminders,
      })
    }
  }, [user, profileForm, reminderForm])

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      await updateUser({
        givenName: data.givenName || undefined,
        familyName: data.familyName || undefined,
      })
      toast.success('Profile updated successfully!')
    } catch {
      toast.error('Failed to update profile')
    }
  }

  const onReminderSubmit = async (data: ReminderFormData) => {
    try {
      await updateUser({
        reminderSchedule: data.reminderSchedule,
      })
      toast.success('Reminder preferences updated successfully!')
    } catch {
      toast.error('Failed to update reminder preferences')
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={profileForm.control}
                  name="givenName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="familyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name</FormLabel>
                      <FormControl>
                        <Input placeholder="Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={!profileForm.formState.isDirty}
                  loading={profileForm.formState.isSubmitting}
                >
                  Save changes
                </Button>
                {profileForm.formState.isDirty && (
                  <Button type="button" variant="outline" onClick={() => profileForm.reset()}>
                    Reset
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Reminders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...reminderForm}>
            <form onSubmit={reminderForm.handleSubmit(onReminderSubmit)} className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Choose when you want to be reminded about upcoming assessments.
              </p>
              <FormField
                control={reminderForm.control}
                name="reminderSchedule"
                render={() => (
                  <FormItem>
                    {reminderOptions.map((reminder) => (
                      <FormField
                        key={reminder.value}
                        control={reminderForm.control}
                        name="reminderSchedule"
                        render={({ field }) => {
                          return (
                            <FormItem className="flex items-center gap-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(reminder.value)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), reminder.value])
                                      : field.onChange(field.value?.filter((value) => value !== reminder.value))
                                  }}
                                  className="size-5"
                                />
                              </FormControl>
                              <FormLabel>
                                <p>{reminder.label}</p>
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={!reminderForm.formState.isDirty}
                  loading={reminderForm.formState.isSubmitting}
                >
                  Save reminder preferences
                </Button>
                {reminderForm.formState.isDirty && (
                  <Button type="button" variant="outline" onClick={() => reminderForm.reset()}>
                    Reset
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  )
}

export default ProfileSettings
