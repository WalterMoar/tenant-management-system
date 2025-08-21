import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'

import {
  Role,
  type RoleId,
  SsoUser,
  type SsoUserId,
  Tenant,
  type TenantId,
  User,
  type UserId,
} from '@/models'
import { ROLES } from '@/utils/constants'

describe('Tenant model', () => {
  beforeEach(() => {
    vi.spyOn(User, 'fromApiData').mockImplementation(
      (apiData: { id: UserId; ssoUser: SsoUser; roles?: Role[] }) =>
        new User(apiData.id, apiData.ssoUser, apiData.roles ?? []),
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('constructor assigns properties correctly', () => {
    const users = [
      new User(
        'user1' as UserId,
        new SsoUser(
          'sso1' as SsoUserId,
          'username1',
          'First',
          'Last',
          'Display',
          'email1@example.com',
        ),
        [new Role('r1' as RoleId, 'role1', 'desc1')],
      ),
      new User(
        'user2' as UserId,
        new SsoUser(
          'sso2' as SsoUserId,
          'username2',
          'First2',
          'Last2',
          'Display2',
          'email2@example.com',
        ),
        [new Role('r2' as RoleId, 'role2', 'desc2')],
      ),
    ]

    const tenant = new Tenant(
      'creatorUser',
      '2025-08-01',
      'Tenant description',
      'tenant123' as TenantId,
      'Tenant Name',
      'Ministry',
      users,
    )

    expect(tenant.users).toEqual(users)
  })

  it('constructor sets users to empty array if not an array', () => {
    const tenant = new Tenant(
      'creatorUser',
      '2025-08-01',
      'Tenant description',
      'tenant123' as TenantId,
      'Tenant Name',
      'Ministry',
      null as unknown as User[],
    )

    expect(tenant.users).toEqual([])
  })

  it('fromApiData converts API data to Tenant instance correctly', () => {
    const apiData = {
      createdBy: 'creatorUser',
      createdDateTime: '2025-08-01',
      description: 'API description',
      id: 'tenant456' as TenantId,
      name: 'API Tenant',
      ministryName: 'Ministry',
      users: [
        {
          id: 'userA' as UserId,
          ssoUser: new SsoUser(
            'ssoA' as SsoUserId,
            'userA',
            'FirstA',
            'LastA',
            'DisplayA',
            'a@example.com',
          ),
          roles: [
            new Role('r1' as RoleId, ROLES.TENANT_OWNER.value, 'Owner role'),
          ],
        },
        {
          id: 'userB' as UserId,
          ssoUser: new SsoUser(
            'ssoB' as SsoUserId,
            'userB',
            'FirstB',
            'LastB',
            'DisplayB',
            'b@example.com',
          ),
          roles: [new Role('r2' as RoleId, 'SomeRole', 'Other role')],
        },
      ],
    }

    const tenant = Tenant.fromApiData(apiData)

    expect(User.fromApiData).toHaveBeenCalledTimes(apiData.users.length)
    expect(tenant.users).toHaveLength(apiData.users.length)
  })

  it('fromApiData handles null users gracefully', () => {
    type TenantApiData = Omit<
      Parameters<typeof Tenant.fromApiData>[0],
      'users'
    > & {
      users: User[] | null
    }

    const apiData: TenantApiData = {
      createdBy: 'creatorUser',
      createdDateTime: '2025-08-01',
      description: 'API description',
      id: 'tenant789' as TenantId,
      name: 'API Tenant',
      ministryName: 'Ministry',
      users: null,
    }

    // Cast to expected param type to simulate invalid input with nullable users
    const tenant = Tenant.fromApiData(
      apiData as unknown as Parameters<typeof Tenant.fromApiData>[0],
    )

    expect(tenant.users).toEqual([])
  })

  it('findUser returns the user matching the ssoUserId', () => {
    const ssoUserId = 'sso1'
    const user = new User(
      'user1' as UserId,
      new SsoUser(
        ssoUserId as SsoUserId,
        'username1',
        'First',
        'Last',
        'Display',
        'email1@example.com',
      ),
      [],
    )
    const tenant = new Tenant(
      'creatorUser',
      '2025-08-01',
      '',
      'tenant1' as TenantId,
      'Name',
      'Ministry',
      [user],
    )

    expect(tenant.findUser(ssoUserId)).toEqual(user)
    expect(tenant.findUser('not-found')).toBeUndefined()
  })

  it('getOwners returns users with TENANT_OWNER role', () => {
    const ownerRole = new Role(
      'r1' as RoleId,
      ROLES.TENANT_OWNER.value,
      'Owner role',
    )
    const otherRole = new Role('r2' as RoleId, 'SomeOtherRole', 'Other role')

    const ownerUser = new User(
      'user1' as UserId,
      new SsoUser(
        'sso1' as SsoUserId,
        'username1',
        'First',
        'Last',
        'Display',
        'email1@example.com',
      ),
      [ownerRole],
    )
    const otherUser = new User(
      'user2' as UserId,
      new SsoUser(
        'sso2' as SsoUserId,
        'username2',
        'First2',
        'Last2',
        'Display2',
        'email2@example.com',
      ),
      [otherRole],
    )

    const tenant = new Tenant(
      'creatorUser',
      '2025-08-01',
      '',
      'tenant1' as TenantId,
      'Name',
      'Ministry',
      [ownerUser, otherUser],
    )

    expect(tenant.getOwners()).toEqual([ownerUser])
    expect(tenant.getFirstOwner()).toEqual(ownerUser)
  })

  it('userHasRole returns true if user has the role', () => {
    const roleName = ROLES.TENANT_OWNER.value
    const user = new User(
      'user1' as UserId,
      new SsoUser(
        'sso1' as SsoUserId,
        'username1',
        'First',
        'Last',
        'Display',
        'email1@example.com',
      ),
      [new Role('r1' as RoleId, roleName, 'Owner role')],
    )
    const tenant = new Tenant(
      'creatorUser',
      '2025-08-01',
      '',
      'tenant1' as TenantId,
      'Name',
      'Ministry',
      [user],
    )

    expect(tenant.userHasRole(user, roleName)).toBe(true)
    expect(tenant.userHasRole(user, 'NonexistentRole')).toBe(false)
  })

  it('userHasRole returns false if user does not have the role or is not found', () => {
    const roleName = ROLES.TENANT_OWNER.value
    const user = new User(
      'user1' as UserId,
      new SsoUser(
        'sso1' as SsoUserId,
        'username1',
        'First',
        'Last',
        'Display',
        'email1@example.com',
      ),
      [new Role('r1' as RoleId, 'SomeOtherRole', 'Other role')],
    )
    const tenant = new Tenant(
      'creatorUser',
      '2025-08-01',
      '',
      'tenant1' as TenantId,
      'Name',
      'Ministry',
      [user],
    )

    // User exists but does not have the role
    expect(tenant.userHasRole(user, roleName)).toBe(false)

    // User not found in tenant users
    const unknownUser = new User(
      'user2' as UserId,
      new SsoUser(
        'sso2' as SsoUserId,
        'username2',
        'First2',
        'Last2',
        'Display2',
        'email2@example.com',
      ),
      [new Role('r2' as RoleId, roleName, 'Owner role')],
    )
    expect(tenant.userHasRole(unknownUser, roleName)).toBe(false)
  })
})
