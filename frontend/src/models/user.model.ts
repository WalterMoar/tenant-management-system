import { Role, SsoUser, type SsoUserId } from '@/models'

/**
 * Branded type for User IDs to prevent mixing with other ID types.
 */
export type UserId = string & { readonly __brand: 'UserId' }

/**
 * Represents a user in the system.
 */
export class User {
  /**
   * Unique identifier for the user.
   */
  id: UserId

  /**
   * Array of roles assigned to the user.
   */
  roles: Role[]

  /**
   * SSO user details.
   */
  ssoUser: SsoUser

  /**
   * Creates a new User instance.
   *
   * @param id - Unique identifier for the user
   * @param ssoUser - The associated SSO user details
   * @param roles - Array of roles assigned to the user (default empty array)
   */
  constructor(id: UserId, ssoUser: SsoUser, roles: Role[] = []) {
    this.id = id
    this.roles = Array.isArray(roles) ? roles : []
    this.ssoUser = ssoUser
  }

  /**
   * Creates a User instance from API response data.
   *
   * @param apiData - The raw user data from the API
   * @param apiData.id - Unique identifier for the user
   * @param apiData.ssoUser - Raw SSO user data to be converted
   * @param apiData.roles - Optional array of raw role data to be converted
   * @returns A new User instance
   */
  static fromApiData(apiData: {
    id: UserId
    ssoUser: SsoUser
    roles?: Role[]
  }): User {
    const roles = Array.isArray(apiData.roles)
      ? apiData.roles.map(Role.fromApiData)
      : []
    const ssoUser = SsoUser.fromApiData(apiData.ssoUser)

    return new User(apiData.id, ssoUser, roles)
  }

  /**
   * Creates a User instance from search result data.
   *
   * Note: The SSO API search results might be incomplete or inconsistent.
   * This method attempts to handle missing fields gracefully, but if the
   * username is undefined it could cause issues.
   *
   * @param searchData - The raw user search data
   * @param searchData.email - Email address of the user
   * @param searchData.firstName - First name of the user
   * @param searchData.lastName - Last name of the user
   * @param searchData.attributes - Additional attributes with possibly
   *   inconsistent key casing or presence
   * @returns A new User instance with no roles (roles are not provided in
   *   search results)
   */
  static fromSearchData(searchData: {
    email: string
    firstName: string
    lastName: string
    attributes: {
      [key: string]: string[] | undefined
    }
  }): User {
    // The SSO API doesn't always return the expected fields - try to be lenient
    // but note that if the username is undefined then it will cause issues.
    const attributes = searchData.attributes
    const ssoUserId = (attributes.idir_user_guid?.[0] ??
      attributes.idir_userid?.[0] ??
      '') as SsoUserId
    const userId = (attributes.idir_user_guid?.[0] ??
      attributes.idir_userid?.[0] ??
      '') as UserId
    const username = attributes.idir_username?.[0]
    const displayName =
      attributes.display_name?.[0] ?? attributes.displayName?.[0] ?? ''

    const ssoUser = new SsoUser(
      ssoUserId,
      username,
      searchData.firstName,
      searchData.lastName,
      displayName,
      searchData.email,
    )

    return new User(
      userId,
      ssoUser,
      [], // Roles are not provided in search results
    )
  }
}
