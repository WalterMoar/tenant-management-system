import { defineStore } from 'pinia'
import { ref } from 'vue'

import {
  Group,
  type GroupDetailFields,
  type GroupId,
  GroupUser,
  type TenantId,
  User,
} from '@/models'
import { groupService } from '@/services'

/**
 * Pinia store for managing groups and group users.
 */
export const useGroupStore = defineStore('group', () => {
  const loading = ref(false)
  const groups = ref<Group[]>([])

  // Private methods

  /**
   * Inserts or updates a group in the store.
   *
   * @param {Group} group - The group to insert or update.
   * @returns {Group} The inserted or updated group.
   */
  function upsertGroup(group: Group) {
    const index = groups.value.findIndex((g) => g.id === group.id)
    if (index !== -1) {
      groups.value[index] = group
    } else {
      groups.value.push(group)
    }

    return group
  }

  // Exported Methods

  /**
   * Creates a new group and adds it to the store.
   *
   * @param {TenantId} tenantId - The ID of the tenant.
   * @param {string} name - The name of the group.
   * @param {string} description - The description of the group.
   * @returns {Promise<Group>} The created group.
   */
  const addGroup = async (
    tenantId: TenantId,
    name: string,
    description: string,
  ) => {
    const apiResponse = await groupService.createGroup(
      tenantId,
      name,
      description,
    )
    const group = Group.fromApiData(apiResponse)

    return upsertGroup(group)
  }

  /**
   * Adds a user to a group.
   *
   * @param {TenantId} tenantId - The ID of the tenant.
   * @param {GroupId} groupId - The ID of the group.
   * @param {User} user - The user to add to the group.
   * @throws {Error} If the group is not found in the store.
   * @returns {Promise<void>}
   */
  const addGroupUser = async (
    tenantId: TenantId,
    groupId: GroupId,
    user: User,
  ) => {
    // Grab the existing group from the store, to confirm the ID and for use
    // later.
    const group = getGroup(groupId)
    if (!group) {
      throw new Error(`Group with ID ${groupId} not found`)
    }

    const apiResponse = await groupService.addUserToGroup(
      tenantId,
      groupId,
      user,
    )

    // Update group users after adding
    const addedUser = GroupUser.fromApiData(apiResponse)
    group.groupUsers.push(addedUser)
  }

  /**
   * Fetches a single group from the API and updates the store.
   *
   * @param {TenantId} tenantId - The ID of the tenant.
   * @param {GroupId} groupId - The ID of the group.
   * @returns {Promise<Group>} The fetched group.
   */
  const fetchGroup = async (tenantId: TenantId, groupId: GroupId) => {
    loading.value = true
    try {
      const groupData = await groupService.getGroup(tenantId, groupId)
      const group = Group.fromApiData(groupData)

      return upsertGroup(group)
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetches all groups for a tenant from the API and updates the store.
   *
   * @param {TenantId} tenantId - The ID of the tenant.
   * @returns {Promise<void>}
   */
  const fetchGroups = async (tenantId: TenantId) => {
    loading.value = true
    try {
      const groupList = await groupService.getTenantGroups(tenantId)
      groups.value = groupList.map(Group.fromApiData)
    } finally {
      loading.value = false
    }
  }

  /**
   * Retrieves a group by its ID from the store.
   *
   * @param {GroupId} groupId - The ID of the group.
   * @returns {Group|undefined} The group if found, otherwise undefined.
   */
  function getGroup(groupId: GroupId): Group | undefined {
    return groups.value.find((g) => g.id === groupId)
  }

  /**
   * Removes a user from a group.
   *
   * @param {TenantId} tenantId - The ID of the tenant.
   * @param {GroupId} groupId - The ID of the group.
   * @param {string} groupUserId - The ID of the user in the group.
   * @throws {Error} If the group is not found in the store.
   * @returns {Promise<void>}
   */
  const removeGroupUser = async (
    tenantId: TenantId,
    groupId: GroupId,
    groupUserId: string,
  ) => {
    // Grab the existing group from the store, to confirm the ID and for use
    // later.
    const group = getGroup(groupId)
    if (!group) {
      throw new Error(`Group with ID ${groupId} not found`)
    }

    await groupService.removeUserFromGroup(tenantId, groupId, groupUserId)

    // Update group users after removing
    const userIndex = group.groupUsers.findIndex((gu) => gu.id === groupUserId)
    if (userIndex !== -1) {
      group.groupUsers.splice(userIndex, 1)
    }
  }

  /**
   * Updates the details of a group.
   *
   * @param {TenantId} tenantId - The ID of the tenant.
   * @param {GroupId} groupId - The ID of the group.
   * @param {GroupDetailFields} groupDetails - The new group details.
   * @throws {Error} If the group is not found in the store.
   * @returns {Promise<void>}
   */
  const updateGroupDetails = async (
    tenantId: TenantId,
    groupId: GroupId,
    groupDetails: GroupDetailFields,
  ) => {
    // Grab the existing group from the store, to confirm the ID and for use
    // later.
    const group = getGroup(groupId)
    if (!group) {
      throw new Error(`Group with ID ${groupId} not found`)
    }

    const apiResponse = await groupService.updateGroup(
      tenantId,
      groupId,
      groupDetails.name,
      groupDetails.description,
    )

    const updatedGroup = Group.fromApiData(apiResponse)

    // Update the group details in the store
    group.name = updatedGroup.name
    group.description = updatedGroup.description
  }

  return {
    loading,
    groups,

    addGroup,
    addGroupUser,
    fetchGroup,
    fetchGroups,
    getGroup,
    removeGroupUser,
    updateGroupDetails,
  }
})
