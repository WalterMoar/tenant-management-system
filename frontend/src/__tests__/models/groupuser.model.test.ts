import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  GroupUser,
  type GroupUserId,
  Role,
  type SsoUserId,
  User,
  type UserId,
} from '@/models'

const fakeSsoUser = {
  displayName: 'John Doe',
  email: 'jdoe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  ssoUserId: 'sso-123' as SsoUserId,
  userName: 'jdoe',
}

const fakeUserData = {
  id: 'user1' as UserId,
  roles: [] as Role[],
  ssoUser: fakeSsoUser,
}

describe('GroupUser model', () => {
  let mockedUserInstance: User

  beforeEach(() => {
    mockedUserInstance = new User(
      fakeUserData.id,
      fakeUserData.ssoUser,
      fakeUserData.roles,
    )

    vi.spyOn(User, 'fromApiData').mockImplementation(() => mockedUserInstance)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('constructor assigns properties correctly', () => {
    const groupUser = new GroupUser(
      'groupUserId' as GroupUserId,
      mockedUserInstance,
    )
    expect(groupUser.id).toBe('groupUserId')
    expect(groupUser.user).toBe(mockedUserInstance)
  })

  it('fromApiData converts API data to GroupUser instance correctly', () => {
    const apiData = {
      id: 'groupUser123' as GroupUserId,
      user: fakeUserData,
    }

    const groupUser = GroupUser.fromApiData(apiData)

    expect(User.fromApiData).toHaveBeenCalledWith(apiData.user)
    expect(groupUser).toBeInstanceOf(GroupUser)
    expect(groupUser.id).toBe(apiData.id)
    expect(groupUser.user).toBe(mockedUserInstance)
  })
})
